import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export const sendMail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      to: to,
      subject: subject,
      html: html,
    });

    console.log("Email sent");
    return info;
  } catch (error) {
    console.log(error || "Error while sending mail");
  }
};
