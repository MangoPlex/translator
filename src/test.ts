import { Compiler } from "./compiler";
import { Parser } from "./parser";
import { TokensEmitter } from "./tokensemitter";
import { Translations, TranslationsEngine } from "./translations";

let te = new TokensEmitter();
te.accept(`
import "./hello_world.lang";
import "./sus.lang";

// Comment
/* Comment */

example.first(playerName, arg2) "Hello " /* Comment in da middle! */ playerName " and welcome to our server!";
example.second "cool";
example.third;
`);
console.log(te);

let parser = new Parser();
parser.accept(te);
console.log(parser.statements);

let compiler = new(class extends Compiler {
    override async resolveImport(path: string): Promise<Translations> {
        return {};
    }
})();
async function main() {
    let translations = await compiler.compileFromStatements(parser);
    let engine = new TranslationsEngine(translations);
    console.log(engine.translate("example.first", "nahkd123"));
    console.log(engine.convertToMC()["example.first"]);
}

main();