import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import ApiResponse from "../utils/apiResponse.js";

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and Description are mandatory");
  }

  const localVideoPath = req.files?.videoFile?.[0]?.path;
  if (!localVideoPath) {
    throw new ApiError(400, "Video File upload on local failed");
  }

  const uploadVideoOnCloudinary = await uploadOnCloudinary(localVideoPath);
  if (!uploadVideoOnCloudinary?.url) {
    throw new ApiError(400, "Video File upload on cloud failed");
  }

  const localThumbnailPath = req.files?.thumbnail?.[0]?.path;
  if (!localThumbnailPath) {
    throw new ApiError(400, "Image File upload on local failed");
  }

  const uploadThumbnailOnCloudinary =
    await uploadOnCloudinary(localThumbnailPath);
  if (!uploadThumbnailOnCloudinary?.url) {
    throw new ApiError(400, "Image File upload on cloud failed");
  }

  const videoUploadData = await Video.create({
    videoFile: uploadVideoOnCloudinary.url,
    thumbnail: uploadThumbnailOnCloudinary.url,
    title,
    description,
    duration: uploadVideoOnCloudinary?.duration,
    owner: req.user._id,
  });

  if (!videoUploadData) {
    throw new ApiError(500, "Video upload data in DB failed");
  }

  //   const videoWithOwner = await Video.aggregate([
  //     {
  //       //Matching the uploaded video id with the above created one and insert the owner data

  //       $match: {
  //         _id: new mongoose.Types.ObjectId(videoUploadData._id),
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "users",
  //         localField: "owner", //Value store of id
  //         foreignField: "_id", //which i matching against in users
  //         as: "owner",
  //         pipeline: [
  //           {
  //             $project: {
  //               fullName: 1,
  //               email: 1,
  //               avatar: 1,
  //               userName: 1,
  //             },
  //           },
  //         ],
  //       },
  //     },

  //     //$unwind is an aggregation pipeline operator in MongoDB that deconstructs an array field from the input documents and outputs a document for each element of the array.
  //     // convert array to object
  //     {
  //       $unwind: "$owner",
  //     },
  //     {
  //       $project: {
  //         videoFile: 1,
  //         thumbnail: 1,
  //         title: 1,
  //         description: 1,
  //         duration: 1,
  //         createdAt: 1,
  //         owner: 1,
  //       },
  //     },
  //   ]);

  // or we can use .populate() method of mongoose

  const videoWithOwner = await Video.findById(videoUploadData._id).populate(
    "owner",
    "fullName avatar userName email"
  );

  if (!videoWithOwner || videoWithOwner.length === 0) {
    throw new ApiError(
      404,
      "Failed to fetch uploaded video with owner details"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videoWithOwner, "Video Uploaded Successfully"));
});

const listOfUploadedVideo = asyncHandler(async (req, res) => {
  //find use to find multiple documents
  const listOfDocuments = await Video.find({ owner: req.user._id }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, listOfDocuments, "Videos Fetched successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const skipContentPerPage = (page - 1) * limit;

  const sortOrder = sortType === "asc" ? 1 : -1;

  //Filter by id or anything

  const filter = {};

  if (userId) {
    filter.owner = userId; // filter by owner
  }

  //Search

  if (query) {
    filter.title = { $regex: query, $options: "i" }; //$regex-  perform partial match , $options: "i": case-insensitive match
  }

  const videos = await Video.find(filter)
    .sort({ [sortBy]: sortOrder })
    .skip(parseInt(skipContentPerPage))
    .limit(parseInt(limit));

  const totalCount = await Video.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
      "Videos fetched successfully"
    )
  );
});

export { uploadVideo, listOfUploadedVideo, getAllVideos };
