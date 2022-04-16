import * as fsp from "fs/promises";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { parse } from "./parser/parse";
import { Constants } from "./Constants";

let index: {
    objects: Record<string, { hash: string; size: number; }>
};

function getMinecraftAssetPath(p: string, version: string) {
    const platform = os.platform();
    let gameDir: string;
    switch (platform) {
        case "linux": gameDir = path.join(os.homedir(), ".minecraft"); break;
        case "win32": gameDir = path.join(os.homedir(), "AppData\\Roaming\\.minecraft"); break;
        // TODO: someone please add darwin platform because i don't have a mac
        default:
            process.stderr.write(`Failed to get game asset path: Platform is not supported (${platform})`);
            return null;
    }

    if (!index) {
        process.stdout.write(`Loading ${version}.json...\n`);
        index = JSON.parse(fs.readFileSync(path.join(gameDir, "assets", "indexes", version + ".json"), "utf-8"));
    }
    const hash = index.objects[p].hash;
    return path.join(gameDir, "assets", "objects", hash.substring(0, 2), hash);
}

function mapImport(p: string, importedFrom: string, version: string) {
    if (p.startsWith("#")) {
        const mcPath = p.substring(1);
        const actualPath = getMinecraftAssetPath(mcPath, version);
        return actualPath;
    }
    return path.join(importedFrom, "..", p);
}

export async function compile(filePath: string, version = Constants.VERSION, importedFrom?: string): Promise<Record<string, string>> {
    const impFError = importedFrom? ` (imported from ${importedFrom})` : "";
    const output: Record<string, string> = {};
    
    if (!fs.existsSync(filePath)) throw new CompileError(`File not found: ${filePath}` + impFError);
    const text = await fsp.readFile(filePath, "utf-8");
    if (text.startsWith("{")) return JSON.parse(text);

    let parseResult = parse(text);

    let importedRecords = await Promise.all(parseResult.imports
        .map(v => mapImport(v, filePath, version))
        .filter(v => v != null)
        .map(v => compile(v, version, filePath))
    );
    importedRecords.forEach(v => Object.keys(v).forEach(key => {
        output[key] = v[key];
    }));

    parseResult.pairs.forEach(pair => {
        const key = pair.key;
        const args = pair.arguments;
        const value = pair.value.map(v => v.type == "string"? v.value : `%${args.indexOf(v.argument) + 1}$s`).join("");
        output[key] = value;
    });

    return output;
}

export class CompileError extends Error {}

export * from "./Configuration";
export * from "./Constants";
export * from "./TranslatePair";
export * from "./parser/Matcher";
export * from "./parser/parse";
