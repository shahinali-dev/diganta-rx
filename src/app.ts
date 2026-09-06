import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import nunjucks from "nunjucks";
import path from "path";
import config from "./config";
import globalErrorHandler from "./middleware/global_error_handler.middleware";
import notFound from "./middleware/not_found.middleware";
import router from "./router/router";

const app: Application = express();

// Nunjucks setup — use absolute path to avoid issues in container
nunjucks.configure(path.resolve(process.cwd(), "views"), {
  autoescape: true,
  express: app,
  watch: true,
});
app.set("view engine", "html");

const allowedOrigins = config.CORS_ORIGIN?.split(",");
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// Serve uploaded avatars locally — future e R2/S3 e move korle
// eita static serve line ta ar dorkar hobe na, cloud URL direct client e jabe
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(router);

app.get("/", (req: Request, res: Response) => {
  res.send("Diganta Rx API is running");
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
