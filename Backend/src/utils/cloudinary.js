import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEYS,
  api_secret: process.env.CLOUDINARY_API_KEYS,
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

    return response;
  } catch (error) {
    //   Removed the locally saved file when operation got failed
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export default uploadOnCloudinary;
