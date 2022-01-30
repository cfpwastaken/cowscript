import { Variable } from "../Variable";
import * as promptsync from "prompt-sync";
const prompt = promptsync({
    sigint: true
});

export function log(stream, v?: any): void {
    if(v === undefined) {
        stream();
    } else if(typeof v === "string") {
        stream(v);
    } else if(v instanceof Variable) {
        stream(v.value);
    } else {
        stream(v.toString());
    }
}

export function print(v?: any): void {
    log(console.log, v);
}

export function error(v?: any): void {
    log(console.error, v);
}

export function input(v?: any): void {
    let text = "";
    if(typeof v === "string") {
        text = v;
    } else if(v instanceof Variable) {
        text = v.value;
    } else {
        text = v.toString();
    }
    return prompt(text);
}