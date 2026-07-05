const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_HOST,
  port: Number(process.env.BREVO_PORT),
  secure: process.env.BREVO_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

// console.log("SMTP mail server is Ready:" , transporter.logger);


transporter.verify((error, success) => {
  if (error) {
    console.log("SMTP Verify Error:", error);
  } else {
    console.log("SMTP mail server is Ready:", success);
  }
});

module.exports = transporter;