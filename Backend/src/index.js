import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log("APP RUNNING ON PORT 4000");
    });
  })
  .catch((error) => {
    console.log("MONGO DB CONNECTION FAILED !!!", error);
  });

// HTTP STATUS CODE -

// 200 - OK
// 201 - CREATED
// 202 - ACCEPTED
// 307 - REDIRECT
// 400 - BAD_REQUEST
// 401 - UNAUTHORIZED
// 402 - PAYMENT_REQUIRED
// 404 - NOT_FOUND
// 500 - INTERNAL_SERVER_ERROR
// 504 - PAYMENT_GATEWAY_TIMEOUT
