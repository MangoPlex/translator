import { Token } from "./tokens";

const mapping = {
    ";": "end-of-statement",
    ",": "comma"
};

export class TokensEmitter {
    tokens: Token[] = [];

    accept(text: string) {
        let ts = new TextStream(text);

        while (!ts.eos) {
            this.#skipNonsenses(ts);

            let token: Token;
            if (
                (token = this.#acceptKeyword(ts)) ||
                (token = this.#acceptString(ts)) ||
                (token = this.#acceptSymbol(ts)) ||
                (token = this.#acceptBracket(ts))
            ) {
                this.tokens.push(token);
                this.#skipNonsenses(ts);
                continue;
            } else {
                throw new Error(`Unable to tokenize input: At position ${ts.pos}: '${ts.text.substring(ts.pos, ts.pos + 5)}...'`);
            }
        }
    }

    #skipNonsenses(ts: TextStream) {
        ts.next(/^(\/\/.*|\/\*.*?\*\/|\s*)+/);
    }

    #acceptKeyword(ts: TextStream) {
        let result = ts.next(/^(import|;|,)/);
        if (result) return <Token> { type: "keyword", keyword: mapping[result[0]] ?? result[0] };
        return null;
    }

    #acceptString(ts: TextStream) {
        let match = ts.next(/^["']/);
        if (match) {
            let quote = match[0];
            let escape = false;
            let result = "", char: string;

            while (true) {
                char = ts.nextChar();
                if (char == null) throw new Error(`Expected (${quote}) or any character, but found end of stream`);
                if (escape) {
                    result += char;
                    escape = false;
                    continue;
                }

                if (char == quote) {
                    return <Token> { type: "string", value: result };
                }

                result += char;
            }
        }

        return null;
    }

    #acceptSymbol(ts: TextStream) {
        let match = ts.next(/^[\w\.]+/);
        if (match) return <Token> { type: "symbol", name: match[0] };
        return null;
    }

    #acceptBracket(ts: TextStream) {
        if (ts.next(/^\(/)) return <Token> { type: "bracket", bracket: "round", mode: "open" };
        if (ts.next(/^\)/)) return <Token> { type: "bracket", bracket: "round", mode: "close" };
        return null;
    }
}

class TextStream {
    pos = 0;
    constructor(public readonly text: string) {}

    get eos() { return this.pos >= this.text.length; }

    next(regex: RegExp) {
        let result = this.text.substring(this.pos).match(regex);
        if (result) this.pos += result[0].length;
        return result;
    }

    nextChar() {
        if (this.eos) return null;
        return this.text[this.pos++];
    }
}