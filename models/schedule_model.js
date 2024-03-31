const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const eventSchema = new mongoose.Schema({
  mentorID: {
    type: ObjectId,
    ref: "User",
  },
  event: {
    type: ObjectId,
    ref: "Event",
  },
  fullname: {
    type: String,
    required: true,
  },
  guestEmail: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    required: true,
  },
  day: {
    type: Date,
    required: true,
  },
  start: {
    type: String,
    required: true,
  },
  end: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Schedule", eventSchema);
