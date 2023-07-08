import { Parser, Statement } from "./parser";
import { Translations } from "./translations";

export class Compiler {
    async resolveImport(path: string): Promise<Translations> {
        throw new Error(`Missing implementation. Please extends Compiler and implement your own resolveImport().`);
    }

    async compileFromStatements(statements: Statement[]): Promise<Translations>;
    async compileFromStatements(parser: Parser): Promise<Translations>;
    async compileFromStatements(a: Statement[] | Parser): Promise<Translations> {
        if (a instanceof Parser) return this.compileFromStatements(a.statements);

        let result: Translations = {};

        for (let i = 0; i < a.length; i++) {
            const s = a[i];

            if (s.type == "import") {
                const imported = await this.resolveImport(s.path);
                for (let key in imported) result[key] = imported[key];
            } else if (s.type == "translation") {
                result[s.key] = s.line;
            }
        }

        return result;
    }
}