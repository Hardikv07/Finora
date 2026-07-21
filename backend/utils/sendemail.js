const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
        user: process.env.EMAIL_USERNAME || process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendEmail = async (options) => {
    const emailUser = process.env.EMAIL_USERNAME || process.env.EMAIL;
    const emailPass = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPass || emailUser === '') {
        console.log("-----------------------------------------------------");
        console.log(`[MOCK EMAIL] To: ${options.email}`);
        console.log(`[MOCK EMAIL] Subject: ${options.subject}`);
        console.log(`[MOCK EMAIL] Body: \n${options.html.replace(/<[^>]*>?/gm, '')}`); // Strip HTML tags
        console.log("-----------------------------------------------------");
        console.log("[MOCK EMAIL] Email credentials not configured in .env. Logging email content instead.");
        return;
    }

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || emailUser,
        to: options.email,
        subject: options.subject,
        html: options.html
    });
};

module.exports = sendEmail;