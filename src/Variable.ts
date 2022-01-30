import { VarType } from "./VarType";

export class Variable {
    name: string;
    type: VarType;
    value: any;
    constructor(name: string, type: VarType, value: any) {
        this.name = name;
        this.type = type;
        this.value = value;
    }
}