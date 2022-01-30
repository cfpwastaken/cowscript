import { VarType } from "./VarType";

export const number = new VarType("number", 0, (v) => {
    return !isNaN(v) && !isNaN(parseFloat(v));
}, (v) => {
    return parseFloat(v);
});
export const string = new VarType("string", "", (v) => {
    return v.startsWith("\"") && v.endsWith("\"");
}, (v) => {
    return v.substring(1, v.length - 1);
});
export const boolean = new VarType("boolean", false, (v) => {
    return v === "true" || v === "false";
}, (v) => {
    return v === "true";
});