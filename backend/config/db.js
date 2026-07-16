const mongoose = require("mongoose");
const dotenv = require("dotenv")

dotenv.config()

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully")
  } catch (err) {
    console.error("Database Error:", err);
    throw err;
  }
};

module.exports = connectDb;