import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

dotenv.config({
  path: "./.env",
});

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return {};

    //Upload File on cloudinary

    const response = await cloudinary.uploader.upload(
      localFilePath,
      // To check the uploaded resource
      {
        resource_type: "auto",
      }
    );

    console.log("File is uploaded Successfully", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    //   Removed the locally saved file when operation got failed
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export default uploadOnCloudinary;
