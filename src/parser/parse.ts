import { TranslatePair, TranslateValue } from "../TranslatePair";
import { Matcher } from "./Matcher";

export function tryParseString(m: Matcher) {
    const head = m.tryMatchString([`"`, `'`], true);
    if (!head) return null;

    let escape = false;
    let out = "";
    while (escape || !m.tryMatchString([head], true)) {
        if (escape) {
            escape = false;
            out += m.peek();
        } else if (m.peek() == "\\") {
            escape = true;
        } else {
            out += m.peek();
        }
        m.pointer++;
    }

    return out;
}

export function parse(text: string): ParseResult {
    let m = new Matcher(text);
    let imports: string[] = [];
    let pairs: TranslatePair[] = [];

    while (!m.eot) {
        m.skipWhitespaces();
        m.skipComment();
        if (m.eot) break;

        let matchResult: RegExpMatchArray;
        if (matchResult = m.tryMatch(/^import /, true)) {
            m.skipWhitespaces();
            let importPath = tryParseString(m);
            if (!importPath) throw new ParserError(`Expected a string (starts with " or '), but ${m.peek()} was found`);
            m.skipWhitespaces();

            if (m.peek() != ";") throw new ParserError(`Expected semicolon ";" but ${m.peek()} was found`);
            m.pointer++;
            imports.push(importPath);
            continue;
        }
        if (matchResult = m.tryMatch(/^[A-Za-z0-9.]+/, true)) {
            const key = matchResult[0];
            const args: string[] = [];
            m.skipWhitespaces();
            if (m.peek() == "(") {
                m.pointer++;
                let tryParseArgName = () => {
                    m.skipWhitespaces();
                    let name = "";
                    while (m.peek().match(/^[A-Za-z0-9]/)) {
                        name += m.peek();
                        m.pointer++;
                    }
                    m.skipWhitespaces();
                    return name;
                };
                while (m.peek() != ")") {
                    const argName = tryParseArgName();
                    if (!m.tryMatchString([",", ")"])) throw new ParserError(`Expected "," or ")" but ${m.peek()} was found`);
                    args.push(argName);
                    if (m.peek() == ",") m.pointer++;
                }
                m.pointer++;
            }
            
            const value: TranslateValue[] = [];
            while (m.peek() != ";") {
                m.skipWhitespaces();
                const str = tryParseString(m);
                if (str) value.push({ type: "string", value: str });
                else if (matchResult = m.tryMatch(/^[A-Za-z0-9]+/, true)) value.push({ type: "argument", argument: matchResult[0] });
                m.skipWhitespaces();
            }

            pairs.push({ key, arguments: args, value });
            m.pointer++;
        }
    }

    return { imports, pairs };
}

export class ParserError extends Error {}

export interface ParseResult {

    imports: string[];
    pairs: TranslatePair[];

}
