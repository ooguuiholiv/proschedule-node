const mongoose = require('mongoose')
require("dotenv").config()

const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;
const db = process.env.MONGO;
const db_name = process.env.DB_NAME;

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      auth:{
        username,
        password
      },dbName: db_name
    });
    console.log("Database Connected");
  } catch (err) {
    console.log("Could not connect to MongoDB");
    console.log(err);
    process.exit(1);
  }
};

module.exports = connectDB;
