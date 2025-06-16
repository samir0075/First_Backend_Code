import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //Geting details from frontend

  if (!req.body) {
    throw new ApiError(400, "Request body is missing");
  }

  const { userName, email, fullName, password } = req.body;

  //Validations and return error with ApiError Method in utils
  if (
    [userName, fullName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are mandatory");
  }

  // To check that email or userName should be unique
  const existingUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with email or username already exist");
  }

  // To set Avatar into local and validate as mandatory

  const avatarLocalPath = req.files?.avatar[0]?.path;

  // if we want send coverImage key then this will throw error

  //   const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is mandatory");
  }

  // Upload on Cloudinary

  const uploadAvatarOnCloudinary = await uploadOnCloudinary(avatarLocalPath);

  const uploadCoverImageOnCloudinary =
    await uploadOnCloudinary(coverImageLocalPath);

  //Avatar is Mandatory in models - to prevent database failure need to apply check
  if (!uploadAvatarOnCloudinary) {
    throw new ApiError(400, "Avatar File is not uploaded on server");
  }

  //User Creation in database
  const user = await User.create({
    userName: userName.toLowerCase(),
    email,
    fullName,
    avatar: uploadAvatarOnCloudinary.url,
    coverImage: uploadCoverImageOnCloudinary.url || "",
    password,
  });

  //To check user has been created or not and to remove the fields which is not required during sending response will write with "-fieldName"

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering User");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

export default registerUser;
