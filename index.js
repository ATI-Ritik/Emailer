import nodemailer from "nodemailer";
import dotenv from "dotenv";
import realine from "readline";
dotenv.config();

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: "email-smtp.ap-south-1.amazonaws.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

const rl = realine.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

// async..await is not allowed in global scope, must use a wrapper
async function main() {
  // send mail with defined transport object

  const subject = await askQuestion("Enter the subject of the mail: ");
  const text = await askQuestion("Enter the text of the mail: ");

  const info = await transporter.sendMail({
    from: `"Ritik" <${process.env.SENDER_EMAIL}> `, // sender address
    to: process.env.RECEIVER_EMAIL, // list of receivers
    subject: subject, // Subject line
    text: text, // plain text body
    // html: "<b>Hello world?</b>", // html body
  });

  rl.close();

  console.log("Message sent: %s", info.messageId);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
}

main().catch(console.error);
