const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const scheduleSchema = new mongoose.Schema({
  user: {
    type: ObjectId,
    ref: "User",
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  // TODO Programar o day para puxar o dia atual
  day: {
    type: Date,
    required: true,
  },
  daysOfWeek: {
    type: [String],
    required: false,
  },
  dayStart: {
    type: String,
    required: true,
  },
  dayEnd: {
    type: String,
    required: true,
  },
  eventDuration: {
    type: Number,
    required: true,
  },
  schedules: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedules",
    },
  ],
});

module.exports = mongoose.model("Event", scheduleSchema);
