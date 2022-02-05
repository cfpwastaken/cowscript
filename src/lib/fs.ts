import * as fs from "fs";
import { Variable } from "../Variable";

export function writeFile(file: string, v: any): void {
  fs.writeFileSync(file, v);
}

export function readFile(file: string): string {
  return fs.readFileSync(file, { encoding: "utf8" });
}

export function exists(file: string): boolean {
  return fs.existsSync(file);
}

export function deleteFile(file: string): void {
  fs.unlinkSync(file);
}