import { Compiler } from "./compiler";
import { Translations, TranslationsEngine } from "./translations";
import * as path from "node:path";
import * as fs from "node:fs";

async function compile(input: string) {
    const compiler = new (class extends Compiler {
        override async resolveImport(p: string, importFrom: string): Promise<Translations> {
            const target = path.resolve(importFrom, "..", p);
            return this.compileFromText(await fs.promises.readFile(target, "utf-8"), "", target);
        }
    })();
    const result = await compiler.compileFromText(input, "", __filename);
    return new TranslationsEngine(result);
}

function assert(input: string, expected: string) {
    if (input != expected) {
        process.stderr.write(`\x1b[91mTEST ERROR: \x1b[0m'${input}' != '${expected}'\x1b[0m\n`);
        process.exit(1);
    }
}

function exists(a: any) {
    if (a == null) {
        process.stderr.write(`\x1b[91mTEST ERROR: \x1b[0mNon-existent/null/undefined object\x1b[0m\n`);
        process.exit(1);
    }
}

async function main() {
    let all = await Promise.all([
        compile(`
        test "a";
        test.nothing;
        test.single "a";
        test.one_argument(a) "Value is " a "!";
        test.two_arguments(a, b) "We got " a " then " b " and back to " a " and " a " again.";
        `).then(t => {
            assert(t.translate("test"), "a");
            assert(t.translate("test.nothing"), "");
            assert(t.translate("test.single"), "a");
            assert(t.translate("test.one_argument", "12345"), "Value is 12345!");
            assert(t.translate("test.two_arguments", "123", "abc"), "We got 123 then abc and back to 123 and 123 again.");
        }),
        compile(`
        import "../example/en-us.lang";
        
        namespace separateNamespace.abcdef;

        key "separateNamespace.abcdef";
        key2(a) "Value is " a "!";
        key3(a, b) a " then " b " and then " a " and " a " again";
        `).then(t => {
            exists(t.translations["separateNamespace.abcdef.key"]);
            exists(t.translations["mynamespace.example.key"]);
            exists(t.translations["mynamespace.hi.key"]);

            assert(t.translate("example.engb"), "12345");
            assert(t.translate("mynamespace.example.key2", "A", "B"), "abc AB def A");
            assert(t.translate("mynamespace.hi.key"), "mynamespace.hi.key");
        })
    ]);

    process.stdout.write(`\x1b[92mTests passed! (${all.length} tests)\x1b[0m\n`);
    process.exit(0);
}

main();