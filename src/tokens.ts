export interface IToken<TType extends string> {
    type: TType;
}

export interface Keyword extends IToken<"keyword"> {
    keyword: AllKeywords;
}

export type AllKeywords = "import" | "end-of-statement" | "comma";

export interface Symbol extends IToken<"symbol"> {
    name: string;
}

export interface StringToken extends IToken<"string"> {
    value: string;
}

export interface Bracket extends IToken<"bracket"> {
    bracket: "round";
    mode: "open" | "close";
}

export type Token = Keyword | Symbol | StringToken | Bracket;