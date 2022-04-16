export interface TranslatePair {

    key: string;
    arguments: string[];
    value: TranslateValue[];

}

export interface ITranslateValue {
    type: string;
}
export interface TranslateString extends ITranslateValue {
    type: "string";
    value: string;
}
export interface TranslateArgument extends ITranslateValue {
    type: "argument";
    argument: string;
}
export type TranslateValue = TranslateString | TranslateArgument;
