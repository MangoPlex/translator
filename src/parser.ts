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

export interface NamespaceDeclare extends IStatement<"namespace-declare"> {
    name: string;
}

export interface NamespaceNested extends IStatement<"namespace-nested"> {
    name: string;
    children: Statement[];
}

export type Statement = ImportStatement | TranslationStatement | NamespaceDeclare | NamespaceNested;

export class Parser {
    statements: Statement[] = [];

    accept(tokens: Token[], onInvaild?: (tokens: Token[]) => boolean): void;
    accept(emitter: TokensEmitter): void;
    accept(a: Token[] | TokensEmitter, onInvaild = (tokens: Token[]) => false) {
        if (a instanceof TokensEmitter) return this.accept(a.tokens);

        while (a.length > 0) {
            let statement: Statement;

            if (
                (statement = this.#acceptImport(a)) ||
                (statement = this.#acceptNamespace(a)) ||
                (statement = this.#acceptTranslation(a))
            ) {
                this.statements.push(statement);
                continue;
            } else {
                if (!onInvaild(a)) throw new Error(`Unexpected token: ${a[0].type}`);
                return;
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

    #acceptNamespace(tokens: Token[]) {
        if (tokens[0].type == "keyword" && tokens[0].keyword == "namespace") {
            tokens.shift();
            const a = tokens.shift();
            if (a.type != "symbol") throw new Error(`Expected symbol but found ${a.type}`);
            const name = a.name;
            const b = tokens.shift();

            if (b.type == "bracket" && b.bracket == "spike" && b.mode == "open") {
                const parser = new Parser();
                parser.accept(tokens, t => {
                    if (t[0].type == "bracket" && t[0].bracket == "spike" && t[0].mode == "close") {
                        t.shift();
                        return true;
                    }

                    return false;
                });

                return <Statement> { type: "namespace-nested", name, children: parser.statements };
            } else if (b.type == "keyword" && b.keyword == "end-of-statement") {
                return <Statement> { type: "namespace-declare", name };
            } else {
                throw new Error(`Expected ({) or (;) but found ${b.type}`);
            }
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