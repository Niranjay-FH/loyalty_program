import fs from "fs";
import path from "path";

export const writeData = (filename: string, data: any): void => {
  fs.writeFileSync(
    path.join(__dirname, "..", "data", `${filename}.ts`), // Added ".." to go up one directory
    `export const ${filename} = ${JSON.stringify(data, null, 2)};`
  );
};