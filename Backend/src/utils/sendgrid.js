// // utils/sendMail.js
// import sgMail from "@sendgrid/mail";
// import dotenv from "dotenv";

// dotenv.config();
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// export const sendTemplatedMail = async ({ to, dynamicTemplateData }) => {
//   const msg = {
//     to,
//     from: process.env.SENDGRID_FROM_EMAIL,
//     templateId: process.env.SENDGRID_TEMPLATE_ID,
//     dynamicTemplateData, // Object with your dynamic variables
//   };

//   try {
//     await sgMail.send(msg);
//     console.log("✅ Templated Email sent");
//     return true;
//   } catch (error) {
//     console.error("❌ SendGrid Error:", error.response?.body || error);
//     return false;
//   }
// };
//

// controllers.js;

// import { sendTemplatedMail } from "../utils/sendMail.js";

// const sendVerificationEmail = asyncHandler(async (req, res) => {
//   const { email, name } = req.body;

//   const verifyLink = `https://yourapp.com/verify?email=${email}`;

//   const success = await sendTemplatedMail({
//     to: email,
//     dynamicTemplateData: {
//       name,
//       verifyLink,
//     },
//   });

//   if (!success) throw new ApiError(500, "Failed to send verification email");

//   res
//     .status(200)
//     .json(new ApiResponse(200, {}, "Verification email sent successfully"));
// });
