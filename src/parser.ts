import { Token } from "./tokens";
import { TokensEmitter } from "./tokensemitter";
import { TranslatedLine, TranslationArgument } from "./translations";

export interface IStatement<TType extends string> {
    type: TType;
}

export interface ImportStatement extends IStatement<"import"> {
    path: string;
}

export interface TranslationStatement extends IStatement<"translation"> {
    key: string;
    line: TranslatedLine;
}

export type Statement = ImportStatement | TranslationStatement;

export class Parser {
    statements: Statement[] = [];

    accept(tokens: Token[]): void;
    accept(emitter: TokensEmitter): void;
    accept(a: Token[] | TokensEmitter) {
        if (a instanceof TokensEmitter) return this.accept(a.tokens);

        while (a.length > 0) {
            let statement: Statement;

            if (
                (statement = this.#acceptImport(a)) ||
                (statement = this.#acceptTranslation(a))
            ) {
                this.statements.push(statement);
                continue;
            } else {
                throw new Error(`Unexpected token: ${a[0].type}`);
            }
        }
    }

    #acceptImport(tokens: Token[]) {
        if (tokens[0].type == "keyword" && tokens[0].keyword == "import") {
            tokens.shift();
            const str = tokens.shift();
            if (str.type != "string") throw new Error(`Expected string but found ${str.type}`);
            const path = str.value;
            const eos = tokens.shift();
            if (eos.type != "keyword") throw new Error(`Expected keyword but found ${str.type}`);
            if (eos.keyword != "end-of-statement") throw new Error(`Expected end of statement but found ${eos.keyword}`);
            return <Statement> { type: "import", path };
        }
    }

    #acceptTranslation(tokens: Token[]) {
        if (tokens[0].type == "symbol") {
            const key = tokens[0].name;
            const line: TranslatedLine = [];
            tokens.shift();

            let next = tokens.shift();
            let args: TranslationArgument[] = [];

            if (next.type == "bracket" && next.bracket == "round" && next.mode == "open") {
                while (true) {
                    next = tokens.shift();

                    if (next.type == "symbol") {
                        args.push({ pos: args.length, name: next.name });
                        next = tokens.shift();

                        if (next.type == "bracket" && next.bracket == "round" && next.mode == "close") break;
                        if (next.type != "keyword" || next.keyword != "comma") throw new Error(`Expected (,) but found ${next.type == "keyword"? next.keyword : next.type}`);
                        continue;
                    }
                }
            } else {
                tokens.unshift(next);
            }

            while (true) {
                next = tokens.shift();

                if (next.type == "keyword" && next.keyword == "end-of-statement") {
                    return <Statement> { type: "translation", key, line };
                }

                if (next.type == "string") {
                    line.push(next.value);
                    continue;
                }

                if (next.type == "symbol") {
                    const name = next.name;
                    line.push({ name, pos: args.findIndex(v => v.name == name) });
                    continue;
                }

                throw new Error(`Expected a string, a symbol or end of statement, but ${next.type} found`);
            }
        }
    }
}