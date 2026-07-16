const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendEmail = async (options) => {
    await transporter.sendMail({
        from: process.env.EMAIL,
        to: options.email,
        subject: options.subject,
        html: options.html
    });
};

module.exports = sendEmail;