import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bycrpt from "bcrypt";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, //Need to implement searching on any field make it index true (Hindered Performance)
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // Will use Cloudinry
      required: true,
    },
    coverImage: {
      type: String, // Will use Cloudinry
    },
    watchHistory: [
      {
        // ARRAY
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

//Mongoose Hooks "pre" used here to encrypt password before saving into db.

// Used function keyword because we want the reference of password , if used arrow func. then not possible

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bycrpt.hash(this.password, 10);
  next();
});

//Mongoose  Method

// Compare password from user and  encrypted password saved in DB.

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bycrpt.compare(password, this.password);
};

// To generate encrypted code .

// node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

// Generating Access Token

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
      fullName: this.fullName,
    },

    process.env.SECRET_ACCESS_TOKEN,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Generate Refresh Token

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },

    process.env.SECRET_REFRESH_TOKEN,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
