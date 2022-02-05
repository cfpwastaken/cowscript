import { Variable } from "../Variable";
import * as promptsync from "prompt-sync";
const prompt = promptsync({
    sigint: true
});

export function print(v?: any): void {
    console.log(v);
}

export function error(v?: any): void {
    console.error(v);
}

export function input(v?: any): void {
    return prompt(v);
}