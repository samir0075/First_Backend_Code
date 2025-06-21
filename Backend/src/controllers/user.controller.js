import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    //Find User fom db
    const user = await User.findById(userId);

    // Generate Access and Refresh token
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateAccessToken();

    // Save refresh token into db

    user.refreshToken = refreshToken;

    // Before saving models will demand to validate other fields but we want only refesh token to save forcefully we need make validation false
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

//REGISTER

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

  const avatarLocalPath = req.files?.avatar[0]?.path; // req.files - because 2 files need to update

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

//LOGIN

const loginUser = asyncHandler(async (req, res) => {
  // Req body
  //Email -> check within database exist krta hai ya nhi
  // id -> Password compare krunga
  // response - return krunga - id , fullName , userName , email , access_token , refresh_token , avatar & coverImage

  const { email, userName, password } = req.body;

  if (!(userName || email)) {
    throw new ApiError(400, "Username or email is mandatory");
  }

  // $or - Mongodb Operators , Searching email and userName in database

  const existingUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!existingUser) {
    throw new ApiError(400, "Username or Email does not exist");
  }

  // With the reference of existing user will compare the password which is saved in db with created isPasswordCorrect Method in models .

  const isPasswordValid = await existingUser.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    existingUser._id
  );

  //After comparing the User in DB he will return few things
  const loggedInUser = await User.findById(existingUser._id).select(
    "-password -refreshToken"
  );

  // By this option no one can modify the things saved in cookies manually , only can be done through backend
  const options = {
    httpOnly: true,
    secure: true,
  };

  //Setup the accessToken and refreshToken in cookies and we return the response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged in successfully"
      )
    );
});

//LOGOUT

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    }, //New value need to return
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logout successfully"));
});

// Updated New Access and Refresh Token

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.user.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodeToken = jwt.verify(
      incomingRefreshToken,
      process.env.SECRET_REFRESH_TOKEN
    );
    const user = await User.findById(decodeToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { newRefreshToken, newAccessToken } = generateAccessAndRefreshToken(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", newRefreshToken, options)
      .cookie("refreshToken", newAccessToken, options)
      .json(
        new ApiResponse(
          "200",
          {
            refreshToken: newRefreshToken,
            accessToken: newAccessToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// Change Current Password

const changeCurrentPassword = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(401, `${!oldPassword || !newPassword} is required`);
  }

  const existingUser = await User.findById(req.user?._id);

  if (!existingUser) {
    throw new ApiError(401, `User not found`);
  }

  const isPasswordValid = await existingUser.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Old password is incorrect");
  }

  existingUser.password = newPassword;
  await existingUser.save({
    validateBeforeSave: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Updated Successfully"));
});

// Fetch Current User

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse("200", req.user, "User fetched successfully"));
});

//Update Account Details

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { userName, email } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        userName,
        email: email,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Account updated successfully"));
});

//Update Avatar

const updateUserAvatar = asyncHandler(async (req, res) => {
  const localFilePath = req.file.path;

  if (!localFilePath) {
    throw new ApiError("400", "Avatar file is missing");
  }

  const updateAvatarOnCloudinary = await uploadOnCloudinary(localFilePath);

  if (!updateAvatarOnCloudinary.url) {
    throw new ApiError(400, "Image Upload on cloudinary failed");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: updateAvatarOnCloudinary.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Avatar updated successfully"));
});

//Update CoverImage

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const localFilePath = req.file.path;

  if (!localFilePath) {
    throw new ApiError("400", "Avatar file is missing");
  }

  const updateCoverImageOnCloudinary = await uploadOnCloudinary(localFilePath);

  if (!updateCoverImageOnCloudinary.url) {
    throw new ApiError(400, "Image Upload on cloudinary failed");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: updateCoverImageOnCloudinary.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Cover Image updated successfully"));
});

//Channel Profile Page

const getUserChannelProfile = asyncHandler(async (req, res) => {
  console.log(req.params);
  const { userName } = req.params;

  if (!userName?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  // $match field -> It will find one key from the entire document
  // $lookup - used for joining other models fields.

  //Aggregate Pipeline always return array of objects

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },

    // created this pipeline to find subscriber
    {
      $lookup: {
        from: "subscriptions", //From - Subscription Model - but in db it will store in lowercase with plural
        localField: "_id",
        foreignField: "channel", // need to select channel from document so that we can get the subscriber.
        as: "subscriber",
      },
    },

    // how many channel user subscribed
    {
      $lookup: {
        from: "subscriptions", //From - Subscription Model - but in db it will store in lowercase with plural
        localField: "_id",
        foreignField: "subscriber", // need to select subscriber from document so that we can get the channel subscribed to.
        as: "subscribeTo",
      },
    },
    // $addFields - It will add additional fields
    {
      $addFields: {
        subscriberCounts: {
          $size: "$subscriber", //To calculate subscriber count by counting subscriber field if it is field need to put $ before it
        },
        channelsSubscribedToCount: {
          $size: "$subscribeTo",
        },
        // isSubscribed: {
        //   //if else case
        //   $cond: {
        //     if: {
        //       $in: [
        //         mongoose.Types.ObjectId(req.user?._id),
        //         "$subscribers.subscriber",
        //       ],
        //     }, // $in field checks in subscriber fields which is created above  in subscriber fields in model
        //     then: true,
        //     else: false,
        //   },
        // },
      },
    },
    // TO select which value we need to send in response
    {
      $project: {
        fullName: 1,
        userName: 1,
        email: 1,
        avatar: 1,
        createdAt: 1,
        subscriberCounts: 1,
        channelsSubscribedToCount: 1,
        // isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel doesn't exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

//Watch History

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        watchHistory: mongoose.Types.ObjectId(req.user._id), // we cannot write directly _id because in db it saved as Object("id") , in aggregate pipelinw _id wont work so new to write  like this
      },
      //From this we get in User models
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: _id,
        as: "watchHistory",

        //sub pipeline -> Now we get in Videos model
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: _id,
              as: "owner",
              pipeline: [
                {
                  $project: {
                    avatar: 1,
                    userName: 1,
                    fullName: 1,
                  },
                },

                //Pipeline always return [{},{}] - but in mos of cases we  required [{}] so extra thing we can do for frotend
                {
                  $addFields: {
                    //overwrite the owner fields
                    owner: {
                      $first: "$owner",
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
