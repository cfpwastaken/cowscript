#!/usr/bin/env node
import { readFileSync, existsSync } from "fs";
import { Variable } from "./Variable";
import * as types from "./VarTypes";

const file = process.argv[2];
export const vars = {};
const config = {
  strict: false
}
const libs = [require("./lib/io")];

let lineNumber = 1;

function cowscriptError(v: string) {
  console.error(`[Cowscript] [${file}:${lineNumber}] ${v}`);
  if(config.strict) {
    process.exit(1);
  }
}

if(existsSync(file)) {
  const content = readFileSync(file, { encoding: "utf-8" });
  const lines = content.split("\n");
  for(const linenum in lines) {
    lineNumber = parseInt(linenum) + 1;
    const line = lines[linenum];
    evalCode(line);
  }
} else {
  console.error("File does not exist");
}

let ifSkip = 0;

export function evalCode(line: string): any {
  while(line.startsWith(" ") || line.startsWith("\t")) {
    line = line.substring(1);
  }
  while(line.endsWith(";")) {
    line = line.substring(0, line.length - 1)
  }
  if(ifSkip > 0 && !line.startsWith("}")) return;
  if(line === "") return;
  if(line.startsWith("//")) return;
  if(line.startsWith("define ")) { // define name type (value)
    const name = line.split(" ")[1];
    const type = line.split(" ")[2];
    if(!types[type]) {
      cowscriptError(`Unknown type '${type}'`);
    } else {
      let value = line.split(" ").length < 4 ? types[type].default : line.split(" ").slice(3).join(" ");
      if(typeof value == "string" && value.endsWith(")")) {
        value = callFunction(value);
        if(typeof value == "string") {
          value = "\"" + value + "\"";
        }
      }
      if(types[type].validate(value)) {
        vars[name] = new Variable(name, types[type], types[type].convert(value));
      } else {
        cowscriptError(`Invalid value '${value}' for type ${type}`)
      }
    }
  } else if(line.split(" ").length >= 3 && line.split(" ")[1] === "=") {
    const name = line.split(" ")[0];
    if(vars[name]) {
      let value = line.split(" ").slice(2).join(" ");
      if(value.endsWith(")")) {
        value = callFunction(value);
        if(typeof value == "string") {
          value = "\"" + value + "\"";
        }
      }
      if(vars[name].type.validate(value)) {
        vars[name].value = vars[name].type.convert(value);
      } else {
        cowscriptError(`Invalid value '${value}' for type ${vars[name].type.name}`)
      }
    } else {
      cowscriptError(`Variable '${name}' does not exist.`)
    }
  } else if(line.startsWith("strict")) {
    config.strict = !config.strict;
  } else if(line.startsWith("import ")) {
    const name = line.split(" ")[1];
    if(existsSync(__dirname + "/lib/" + name + ".js")) {
      libs.push(require("./lib/" + name + ".js"))
    } else {
      cowscriptError(`Unknown library '${name}'`)
    }
  } else if(line.startsWith("if(") && line.endsWith("{")) {
    const condition = line.substring(3, line.length - 3).split(/ (==|<|>) /g);
    
    condition[0] = parseArg(condition[0]);
    condition[2] = parseArg(condition[2]);
    
    switch(condition[1]) {
      case "==":
        if(!(condition[0] == condition[2])) {
          ifSkip = 1;
        }
        break;
      case "<":
        if(!(condition[0] < condition[2])) {
          ifSkip = 1;
        }
        break;
      case ">":
        if(!(condition[0] > condition[2])) {
          ifSkip = 1;
        }
        break;
    }
  } else if(line.endsWith("++")) {
    const varname = line.substring(0, line.length - 2);
    if(vars[varname]) {
      if(vars[varname].type.name == "number") {
        vars[varname].value++;
      } else {
        cowscriptError(`Adding is not supported for ${vars[varname].type.name}`);
      }
    } else {
      cowscriptError(`Variable ${varname} does not exist`)
    }
  } else if(line.endsWith("--")) {
    const varname = line.substring(0, line.length - 2);
    if(vars[varname]) {
      if(vars[varname].type.name == "number") {
        vars[varname].value--;
      } else if(vars[varname].type.name == "string") {
        vars[varname].value = vars[varname].value.substring(0, vars[varname].value.length - 1)
      } else {
        cowscriptError(`Removing is not supported for ${vars[varname].type.name}`);
      }
    } else {
      cowscriptError(`Variable ${varname} does not exist`)
    }
  } else if(line.startsWith("} else {")) {
    if(ifSkip == 1) {
      ifSkip = 0;
    } else {
      ifSkip = 1;
    }
  } else if(line.startsWith("}")) {
    ifSkip--;
  } else if(line.endsWith(")")) {
    callFunction(line);
  } else {
    cowscriptError(`Unknown statement`);
  }
}

function parseArg(arg): any {
  let gotValue = false;
  while(arg.startsWith(" ")) {
    arg = arg.substring(1);
  }
  if(arg.endsWith(")")) {
    arg = callFunction(arg);
    gotValue = true;
  }
  for(const j in vars) {
    if(gotValue) continue;
    if(arg === vars[j].name) {
      arg = vars[j].value;
      gotValue = true;
    }
  }
  if(!gotValue && arg.startsWith("!")) {
    arg = !parseArg(arg.substring(1));
    gotValue = true;
  }
  if(!gotValue) {
    for(const type of Object.values(types)) {
      if(gotValue) continue;
      if(type.validate(arg)) {
        arg = type.convert(arg);
        gotValue = true;
      }
    }
  }
  if(!gotValue) {
    const exprStr = arg.split(/ (\+|\-|\*|\/|\%) /g);
    let expr = [];
    if(exprStr.length == 3) {
      expr[0] = parseFloat(parseArg(exprStr[0]));
      expr[1] = exprStr[1];
      expr[2] = parseFloat(parseArg(exprStr[2]));

      gotValue = true;
      switch(expr[1]) {
        case "+":
          arg = expr[0] + expr[2];
          break;
        case "-":
          arg = expr[0] - expr[2];
          break;
        case "*":
          arg = expr[0] * expr[2];
          break;
        case "/":
          arg = expr[0] / expr[2];
          break;
        case "%":
          arg = expr[0] % expr[2];
          break;
        default:
          gotValue = false;
          break;
      }
    }
  }
  if(!gotValue && arg.endsWith("!")) {
    gotValue = true;
    arg = factorial(parseArg(arg.substring(0, arg.length - 1)));
  }
  if(!gotValue && arg !== "") {
    cowscriptError(`Unknown value '${arg}'`);
  }
  return arg;
}

function callFunction(line: string): any {
  let rtn = undefined;
  let ran = false;
  for(const lib of libs) {
    if(ran) continue;
    if(lib[line.split("(")[0]]) {
      // get arguments
      let args = line.substring(line.split("(", 1)[0].length).substring(1, line.substring(line.split("(", 1)[0].length).length - 1).split(",");

      let shouldRun = true;
      
      for(const i in args) {
        let res = parseArg(args[i]);
        if(args) {
          args[i] = res;
        } else {
          shouldRun = false;
        }
      }

      if(shouldRun) rtn = lib[line.split("(")[0]].apply(null, args);
      ran = true;
    }
  }
  if(!ran) cowscriptError(`Unknown function`);
  return rtn;
}

function factorial(num: number) : number {
  if (num == 0) return 1;
  else return num * factorial(num - 1)
}
