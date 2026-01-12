import fs from "fs";
import path from "path";

export const writeData = (filename: string, data: any): void => {
  fs.writeFileSync(
    path.join(__dirname, "data", `${filename}.ts`),
    `export default ${JSON.stringify(data, null, 2)};`
  );
};