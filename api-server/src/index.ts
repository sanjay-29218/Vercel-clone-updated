import express from "express";
import { generateSlug } from "random-word-slugs";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import Redis from "ioredis";
import { Server, Socket } from "socket.io";
const app = express();

app.use(express.json());
const ecsClient = new ECSClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: "AKIAYS2NVRTAVHXJTGKR",
    secretAccessKey: "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",
  },
});

const config = {
  CLUSTER: "arn:aws:ecs:eu-north-1:590184025281:cluster/builder-cluster",
  TASK: "arn:aws:ecs:eu-north-1:590184025281:task-definition/builder-task:1",
};

const subscriber = new Redis(
  "rediss://default:AVNS_Fl33i0wT9Y1O6k0rREo@redis-d4b013c-sanjay29218-5c63.a.aivencloud.com:28267"
);

//@ts-ignore
const io = new Server({ cors: "*" });

io.listen(9001);

io.on("connection", (socket: Socket) => {
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("message", `joined ${channel}`);
  });
});

app.post("/project", async (req, res) => {
  const { gitUrl, slug } = req.body;
  const projectSlug = slug ?? generateSlug();
  const command = new RunTaskCommand({
    cluster: config.CLUSTER,
    taskDefinition: config.TASK,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: "ENABLED",
        subnets: [
          "subnet-042c5928352c33589",
          "subnet-0ac9422f58c03b6a4",
          "subnet-0a6190d587c75d653",
        ],
        securityGroups: ["sg-028fc4e2a35b8199e"],
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: "builder-image",
          environment: [
            { name: "GIT_REPOSITORY_URL", value: gitUrl },
            { name: "PROJECT_ID", value: projectSlug },
          ],
        },
      ],
    },
  });
  await ecsClient.send(command);

  return res.json({
    status: "queued",
    data: { projectSlug, url: `http://${projectSlug}.localhost:8000` },
  });
});

async function redisInit() {
  subscriber.psubscribe("logs:*");
  subscriber.on("pmessage", (pattern: any, channel: any, message: any) => {
    io.to(channel).emit("message", message);
  });
}
redisInit();

app.listen(9000, () => console.log("listening at 9000"));
