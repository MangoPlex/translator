export class Matcher {

    pointer = 0;
    lastLength = 0;

    constructor(public readonly text: string) {
    }

    get eot() { return this.pointer >= this.text.length; }

    tryMatch(regexp: RegExp, autoAccept = false) {
        if (this.eot) throw new MatcherError(`Expecting ${regexp} but end of file found`);

        let result = this.text.substring(this.pointer).match(regexp);
        if (result) {
            if (autoAccept) this.pointer += result[0].length;
            else this.lastLength += result[0].length;
        }
        return result;
    }

    tryMatchString(matches: string[], autoAccept = false) {
        if (this.eot) throw new MatcherError(`Expecting [${matches.join(", ")}] but end of file found`);

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            if (this.text.substring(this.pointer, this.pointer + match.length) == match) {
                if (autoAccept) this.pointer += match.length;
                else this.lastLength += match.length;
                return match;
            }
        }
        return null;
    }

    accept() {
        this.pointer += this.lastLength;
        this.lastLength = 0;
    }

    peek() {
        if (this.eot) throw new MatcherError(`Expected a character but end of file found`);
        return this.text[this.pointer];
    }

    skipWhitespaces() {
        let count = 0;
        while (!this.eot && this.tryMatch(/^[\s\r\n]/, true)) count++;
        return count;
    }

    skipComment() {
        if (this.eot) return false;

        let match: RegExpMatchArray;
        if (match = this.tryMatch(/^(\/\/|\/\*)/)) {
            const head = match[0];
            const tail = head == "//"? "\n" : "*/";
            while (!this.tryMatchString([tail], true)) this.pointer++;
        }
    }

}

export class MatcherError extends Error {}