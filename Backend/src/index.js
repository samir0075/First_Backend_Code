import dotenv from "dotenv";
import connectDB from "./db/index.js";

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

/*
//Seting up th database

// const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

    // if express is not able to connect with DB
    app.on("error", () => {
      console.log("ERROR", error);
      throw error;
    });
    //Server Running on
    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
})();
*/

// Models Data Modelling
// import mongoose from "mongoose";
// const userSchema = new moongoose.Schema({
// name: {
//   type: String,
//   required: true,
//  unique: true,
// lowercase:true
// },password:String,

// Who created for that we are taking the reference
// createdBy: {
// type: moongoose.Schema.Types.ObjectId,
// ref:'user'
// }
// },{timestamps:true})

//export const user=  mongoose.model("user",userSchema)
//
//
//
