import { Variable } from "../Variable";

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