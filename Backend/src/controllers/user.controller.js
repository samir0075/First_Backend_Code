import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";

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

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

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

export { registerUser, loginUser, logoutUser, refreshAccessToken };
