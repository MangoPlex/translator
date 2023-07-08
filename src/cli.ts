#!/usr/bin/env node
import { Translations, TranslationsEngine } from "./translations";
import * as fs from "node:fs";
import * as path from "node:path";
import { Compiler } from "./compiler";

interface Configuration {
    importMapping?: Record<string, ImportOption>;
    include: string[];
    outputDirectory?: string;
    outputFile?: string;
    format?: "translator" | "minecraft";
}

type ImportOption = { file: string } | { content: string };

let configuration: Configuration;
let args = process.argv.splice(2);

if (args.length == 0) {
    process.stdout.write([
        "Usages:",
        "    translator <path/to/file.lang> [output = path/to/file.json]",
        "    translator <path/to/config.json>",
        ""
    ].join("\n"));
    process.exit(1);
}

const entry = fs.readFileSync(args[0], "utf-8");
const entryDir = path.resolve(args[0], "..");

if (entry.startsWith("{")) {
    // Could be JSON file
    configuration = JSON.parse(entry);
} else {
    let importMapping: Record<string, ImportOption> = {};
    importMapping[path.resolve(args[0])] = { content: entry };

    let parsedPath = path.parse(args[0]);
    let outputFile = args[1] != null? path.resolve(args[1]) : path.resolve(parsedPath.dir, parsedPath.name + ".json");

    configuration = {
        include: [path.resolve(args[0])],
        importMapping,
        outputFile
    };
}

function findIncludeRoot(paths: string[]) {
    let paths2 = paths
        .map(v => path.isAbsolute(v)? v : path.resolve(entryDir, v))
        .map(v => v.split(path.sep));
    
    let shallowest = paths2[0];
    for (let i = 1; i < paths2.length; i++) if (shallowest.length > paths2[i].length) shallowest = paths2[i];
    return path.resolve(shallowest.join(path.sep), "..");
}

const includeRoot = findIncludeRoot(configuration.include);
if (configuration.outputFile) configuration.outputDirectory = path.join(configuration.outputFile, "..");
const outputRoot = path.isAbsolute(configuration.outputDirectory)? configuration.outputDirectory : path.resolve(entryDir, configuration.outputDirectory);
const outputFormat = configuration.format ?? "minecraft";

process.stdout.write([
    "This is MangoPlex Translator Compiler, using language version 1.",
    `    Entry directory is ${entryDir}`,
    `    Include root is ${includeRoot}`,
    `    Output root is ${outputRoot}`,
    `    Output format is ${outputFormat}`,
    ""
].join("\n"));

const compiler = new(class extends Compiler {
    override async resolveImport(p: string, from: string): Promise<Translations> {
        if (configuration.importMapping && configuration.importMapping[p]) {
            const mapped = configuration.importMapping[p];
            if ("file" in mapped) p = path.isAbsolute(mapped.file)? mapped.file : path.resolve(entryDir, mapped.file);
            else if ("content" in mapped) return await this.compileFromText(mapped.content);
        }

        const fromParent = path.resolve(from, "..");
        const importPath = path.isAbsolute(p)? p : path.resolve(fromParent, p);
        return await this.compileFromText(await fs.promises.readFile(importPath, "utf-8"), importPath); // TODO: Read from JSON file
    }
})();

process.stdout.write(`Compiling '${args[0]}'...\n`);
Promise.all(configuration.include.map(async included => {
    const includedPath = path.resolve(entryDir, included);
    const parsedIncludedPath = path.parse(includedPath);
    const outputPath = configuration.outputFile ?? path.resolve(outputRoot, path.relative(includeRoot, path.join(parsedIncludedPath.dir, parsedIncludedPath.name + ".json")));
    const outputDir = path.resolve(outputPath, "..");
    await fs.promises.mkdir(outputDir, { recursive: true });

    const result = await compiler.resolveImport(includedPath, includedPath);

    switch (outputFormat) {
        case "translator":
            await fs.promises.writeFile(outputPath, JSON.stringify(result, null, 4), "utf-8");
            break;
        case "minecraft":
            let engine = new TranslationsEngine(result);
            await fs.promises.writeFile(outputPath, JSON.stringify(engine.convertToMC(), null, 4), "utf-8");
            break;
    }

    process.stdout.write(`${includedPath} => ${outputPath}\n`);
})).then(() => {
    process.stdout.write("Compiled everything!\n");
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});