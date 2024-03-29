const nodemailer = require("nodemailer");

const host = process.env.MAILER_HOST;
const username = process.env.MAILER_USER;
const password = process.env.MAILER_PASS;

const transporter = nodemailer.createTransport({
  host: host,
  port: 587,
  secure: false,
  auth: {
    user: username,
    pass: password,
  },
});

async function send_email_welcome(emailClient) {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: `"ProSchedule App 👻" <${username}>`,
    to: [username, emailClient],
    subject: "Welcome to ProSchedule App ✔", // Subject line
    text: "Hello world?",
  });
  console.log("email no send", emailClient)
}

module.exports = send_email_welcome