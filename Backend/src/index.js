// console.log("chai and code");

// require("dotenv").config();
// const express = require("express");

import express from "express";

const app = express();
const port = process.env.PORT || 4000;

const userData = [
  {
    id: 1,
    names: "Samir Singh",
    age: 25,
  },
  {
    id: 2,
    names: "Deepak Singh",
    age: 31,
  },
  {
    id: 3,
    names: "Abhijeeet Singh",
    age: 21,
  },
];

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/api/login", (req, res) => {
  res.send("<h1>LOGIN</h1>");
});
app.get("/api/user", (req, res) => {
  res.json(userData);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

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
