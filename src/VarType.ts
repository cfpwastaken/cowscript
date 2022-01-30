export class VarType {
    name: string;
    default: any;
    validate: (v: any) => boolean;
    convert: (v: any) => any;
    constructor(name, def, validate, convert) {
        this.name = name;
        this.default = def;
        this.validate = validate;
        this.convert = convert;
    }
}