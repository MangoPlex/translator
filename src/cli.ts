#!/usr/bin/env node
import { extname } from "path";
import * as fsp from "fs/promises";
import * as fs from "fs";
import * as path from "path";
import { Configuration } from "./Configuration";
import { compile } from ".";
import { Constants } from "./Constants";

const args = process.argv.splice(2);
args.forEach(async arg => {
    if (arg.endsWith(".json")) processConfigFile(arg);
    else processStandaloneFile(arg);
});

async function processStandaloneFile(p: string) {
    const ext = extname(p);
    const dst = p.substring(0, p.length - ext.length) + ".json";
    const result = compile(p, Constants.VERSION);
    await fsp.writeFile(dst, JSON.stringify(result, null, 4), "utf-8");
}

async function processConfigFile(p: string) {
    const config: Configuration = JSON.parse(await fsp.readFile(p, "utf-8"));
    const result = await Promise.all(config.include
        .filter(v => {
            let result = fs.existsSync(path.join(p, "..", v));
            if (!result) process.stderr.write(`File not found: '${v}' (defined inside ${p}), skipping...\n`);
            return result;
        })
        .map(v => new Promise<[string, Record<string, string>]>(resolve => {
            compile(path.join(p, "..", v), config.gameVersion ?? Constants.VERSION).then(map => {
                resolve([path.join(p, "..", v), map]);
            });
        }))
    );
    if (!config.outputDirectory) {
        await Promise.all(result.map(v => {
            const src = v[0];
            const ext = extname(src);
            const dst = src.substring(0, src.length - ext.length) + ".json";
            return <[string, Record<string, string>]> [dst, v[1]];
        }).map(v => fsp.writeFile(v[0], JSON.stringify(v[1], null, 4), "utf-8")));
    } else {
        const outputDir = path.join(p, "..", config.outputDirectory);
        await fsp.mkdir(outputDir, { recursive: true });
        await Promise.all(result.map(v => {
            const src = v[0];
            const ext = extname(src);
            const prevDst = src.substring(0, src.length - ext.length) + ".json";

            let newDst: string;
            for (let i = 0; i < Math.min(prevDst.length, outputDir.length); i++) {
                if (prevDst[i] != outputDir[i]) {
                    newDst = path.join(outputDir, prevDst.substring(i));
                    break;
                }
            }

            return <[string, Record<string, string>]> [newDst, v[1]];
        }).map(v => fsp.writeFile(v[0], JSON.stringify(v[1], null, 4), "utf-8")));
    }
}
