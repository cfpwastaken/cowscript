#!/usr/bin/env node
import { readFileSync, existsSync } from "fs";
import { Variable } from "./Variable";
import * as types from "./VarTypes";

const file = process.argv[2];
const vars = {};
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
    if(line === "") continue;
    if(line.startsWith("//")) continue;
    if(line.startsWith("define ")) { // define name type (value)
      const name = line.split(" ")[1];
      const type = line.split(" ")[2];
      if(!types[type]) {
        cowscriptError(`Unknown type '${type}'`);
      } else {
        let value = line.split(" ").length < 4 ? types[type].default : line.split(" ").slice(3).join(" ");
        if(value.endsWith(")")) {
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
    } else if(line.endsWith(")")) {
      callFunction(line);
    } else {
      cowscriptError(`Unknown statement`);
    }
  }
} else {
  console.error("File does not exist");
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
        let gotValue = false;
        if(args[i].startsWith(" ")) {
          args[i] = args[i].substring(1);
        }
        if(args[i].endsWith(")")) {
          args[i] = callFunction(args[i]);
          gotValue = true;
        }
        for(const j in vars) {
          if(gotValue) continue;
          if(args[i] === vars[j].name) {
            args[i] = vars[j].value;
            gotValue = true;
          }
        }
        if(!gotValue) {
          for(const type of Object.values(types)) {
            if(gotValue) continue;
            if(type.validate(args[i])) {
              args[i] = type.convert(args[i]);
              gotValue = true;
            }
          }
        }
        if(!gotValue && args[i] !== "") {
          cowscriptError(`Unknown value '${args[i]}'`);
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
