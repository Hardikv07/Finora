const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
 
// 1. Configure Cloudinary using environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
 
// 2. Configure Multer Memory Storage
const storage = multer.memoryStorage();
 
// 3. File Filter: Allow only Images (JPEG, PNG, WEBP) and PDF files
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type! Only JPEG, PNG, WEBP, and PDF files are allowed."), false);
    }
};
 
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB maximum file size limit
    },
    fileFilter: fileFilter
});
 
/**
 * Helper function to stream memory buffer to Cloudinary
 * @param {Buffer} fileBuffer - Buffer from req.file.buffer
 * @param {String} folder - Cloudinary target folder ('bills' or 'receipts')
 * @returns {Promise<Object>} Cloudinary upload result containing secure_url and public_id
 */
const uploadToCloudinary = (fileBuffer, folder = "receipts") => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "finance_project/" + folder,
                resource_type: "auto", // Automatically detect image vs raw PDF
                transformation: [
                    // Optimize images automatically on upload while preserving quality
                    { quality: "auto", fetch_format: "auto" }
                ]
            },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};
 
/**
 * Middleware wrapper to handle single receipt upload and attach Cloudinary URL to req.body
 */
const handleReceiptUpload = async (req, res, next) => {
    if (!req.file) return next();
    try {
        const result = await uploadToCloudinary(req.file.buffer, "receipts");
        req.body.receiptUrl = result.secure_url;
        req.body.receiptPublicId = result.public_id;
        next();
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        return res.status(500).json({ message: "Failed to upload receipt file to CDN." });
    }
};
 
module.exports = {
    uploadReceipt: upload.single("receipt"),
    handleReceiptUpload,
    uploadToCloudinary,
    cloudinary
};
