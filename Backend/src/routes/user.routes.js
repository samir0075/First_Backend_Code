import { Router } from "express";
import {
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
  testMail,
  emailVerificationForPassword,
  updatePassword,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

// Register
userRouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 }, //fields -> because 2 files need to update
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

// Login
userRouter.route("/login").post(loginUser);

//Protected Routes

//Logout
userRouter.route("/logout").post(verifyJWT, logoutUser);

//Update through Refresh Token
userRouter.route("/refresh_token").post(refreshAccessToken);

// Change Password
userRouter.route("/change_password").post(verifyJWT, changeCurrentPassword);

//Fetch Current User
userRouter.route("/fetch_user").get(verifyJWT, getCurrentUser);

//Update Account Details
userRouter
  .route("/update_account_details")
  .patch(verifyJWT, updateAccountDetails);

//Update Avatar
userRouter
  .route("/update_avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

//Update Cover Image
userRouter
  .route("/update_cover_image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

//Get User channel
userRouter
  .route("/user_channel/:userName") // req.params   ,  ?userName - req.query
  .get(verifyJWT, getUserChannelProfile);

//Get User watch History
userRouter.route("/watch_history").get(verifyJWT, getWatchHistory);

//Sendig test mail
userRouter.route("/test_mail/:email").get(verifyJWT, testMail);

//Sending email for setting up the password
userRouter.route("/email_verification").post(emailVerificationForPassword);

//Update Password
userRouter.route("/update_password").post(updatePassword);

export default userRouter;
