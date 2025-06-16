import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

/*
 ** CORS SETUP
 ** use - for using middleware and to setup configuration
 */

app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // * - for all
  })
);

/*
 ** To receive data in json format with limits
 */
app.use(
  express.json({
    limit: "16kb",
  })
);

/*
 ** To receive data in params
 */
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

/*
 ** To receive images and file to store in public
 */
app.use(express.static("public"));

/*
 ** To read and write cookies into browser
 */
app.use(cookieParser());

//Import Routes

import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter);

export default app;
