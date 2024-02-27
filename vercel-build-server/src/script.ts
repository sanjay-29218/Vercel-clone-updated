import { exec } from "child_process";
import path from "path";
import fs from "fs";
import mime from "mime-types";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import Redis from "ioredis";
const Publisher = new Redis(
  "rediss://default:AVNS_Fl33i0wT9Y1O6k0rREo@redis-d4b013c-sanjay29218-5c63.a.aivencloud.com:28267"
);
const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRETACCESSKEY,
  },
});
const PROJECT_ID = process.env.PROJECT_ID;
function publisher(log: string) {
  Publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }));
}
async function init() {
  console.log("executing script.ts");
  publisher("logs:Build started...");
  const parentDir = path.resolve(__dirname, "..");

  const outDir = path.join(parentDir, "output");
  const p = exec(`cd ${outDir} && npm install && npm run build`);

  p.stdout?.on("data", (data) => {
    console.log(data.toString());
    publisher(data.toString());
  });
  p.stdout?.on("error", (data) => {
    console.log("Error", data.toString());
    publisher(`error:${data.toString()}`);
  });
  p.on("close", async () => {
    const distFolderPath = path.join(parentDir, "output", "dist");
    const distFolderContent: string[] | Buffer[] = fs.readdirSync(
      distFolderPath,
      {
        recursive: true,
      }
    );

    for (const file of distFolderContent) {
      const filePath = path.join(distFolderPath, file as string);
      publisher(`logs:uploading file${filePath}`);
      console.log("uploading file", filePath);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      const command = new PutObjectCommand({
        Bucket: "vercel-project-output",
        Key: `outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath as string) as string,
      });
      await s3.send(command);
      publisher(`logs:uploaded:${filePath}`);
      console.log("uploaded", filePath);
    }
    publisher("build complete");
  });
}
init();
