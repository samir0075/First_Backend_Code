import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  uploadVideo,
  listOfUploadedVideo,
} from "../controllers/video.controller.js";

const videoRouter = Router();

// Upload Video

videoRouter.route("/upload_videos").post(
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 }, //fields -> because 2 files need to update
    { name: "thumbnail", maxCount: 1 },
  ]),
  uploadVideo
);

//Fetch video list
videoRouter.route("/video_list").get(verifyJWT, listOfUploadedVideo);

export default videoRouter;
