const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_HOST,
  port: Number(process.env.BREVO_PORT),
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

module.exports = transporter;

// transporter.verify((error, success) => {
//   if (error) {
//     console.error("SMTP Verify Error:", error);
//   } else {
//     console.log("SMTP mail server is Ready:", success);
//   }
// });

// module.exports = transporter;