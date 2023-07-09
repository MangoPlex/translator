import { IStatement, Parser, Statement } from "./parser";
import { Token } from "./tokens";
import { TokensEmitter } from "./tokensemitter";
import { Translations } from "./translations";
import * as path from "node:path";

export class Compiler {
    async resolveImport(p: string, importFrom: string): Promise<Translations> {
        throw new Error(`Missing implementation. Please extends Compiler and implement your own resolveImport().`);
    }

    async compileFromStatements(statements: Statement[], keyPrefix?: string, currentPath?: string): Promise<Translations>;
    async compileFromStatements(parser: Parser, keyPrefix?: string, currentPath?: string): Promise<Translations>;
    async compileFromStatements(a: Statement[] | Parser, keyPrefix = "", currentPath = "."): Promise<Translations> {
        if (a instanceof Parser) return this.compileFromStatements(a.statements, keyPrefix, currentPath);

        let result: Translations = {};

        for (let i = 0; i < a.length; i++) {
            const s = a[i];

            if (s.type == "import") {
                const imported = await this.resolveImport(s.path, currentPath);
                for (let key in imported) result[key] = imported[key];
            } else if (s.type == "translation") {
                result[keyPrefix + s.key] = s.line;
            } else if (s.type == "namespace-declare") {
                keyPrefix += s.name + ".";
            } else if (s.type == "namespace-nested") {
                const child = await this.compileFromStatements(s.children, keyPrefix + s.name + ".", currentPath);
                for (let key in child) result[key] = child[key];
            } else {
                throw new Error(`Unknown statement: ${(s as IStatement<any>).type}`);
            }
        }

        return result;
    }

    async compileFromTokens(tokens: Token[], keyPrefix?: string, currentPath?: string): Promise<Translations>;
    async compileFromTokens(emitter: TokensEmitter, keyPrefix?: string, currentPath?: string): Promise<Translations>;
    async compileFromTokens(a: Token[] | TokensEmitter, keyPrefix?: string, currentPath?: string): Promise<Translations> {
        if (a instanceof TokensEmitter) return this.compileFromTokens(a.tokens, keyPrefix, currentPath);

        let parser = new Parser();
        parser.accept(a);
        return this.compileFromStatements(parser, keyPrefix, currentPath);
    }

    async compileFromText(text: string, keyPrefix?: string, currentPath?: string): Promise<Translations> {
        let emitter = new TokensEmitter();
        emitter.accept(text);
        return this.compileFromTokens(emitter, keyPrefix, currentPath);
    }
}