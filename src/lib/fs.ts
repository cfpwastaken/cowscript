import * as fs from "fs";
import { Variable } from "../Variable";

export function writeFile(file: string, v: any): void {
  fs.writeFileSync(file, v);
}