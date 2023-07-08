export type Translations = Record<string, TranslatedLine>;
export type TranslatedLine = (string | TranslationArgument)[];

export interface TranslationArgument {
    name?: string;
    pos: number;
}

export class TranslationsEngine {
    constructor(public readonly translations: Translations) {}

    translate(key: string, ...args: string[]) {
        let line = this.translations[key];
        if (line == null) return key;

        return line.map(v => {
            if (typeof v == "string") return v;
            return args[v.pos];
        }).join("");
    }

    convertToMC(): Record<string, string> {
        let converted: Record<string, string> = {};

        for (let key in this.translations) {
            converted[key] = this.translations[key].map(v => {
                if (typeof v == "string") return escape(v);
                return `%${v.pos + 1}$s`;
            }).join("");
        }

        return converted;
    }
}

function escape(v: string) {
    return v.replaceAll(/%/g, "%%");
}