const express = require("express");
const User = require("../models/userModel");
const Schedule = require("../models/schedule_model");
const Event = require("../models/event_model");
const { validateEmail } = require("../utils/validators");
const router = express.Router();

router.post("/appointments", async (req, res) => {
  try {
    const { mentorID, event, guestEmail, fullname, message, day, start, end } =
      req.body;

    const foundUser = await User.findById(mentorID);

    if (!foundUser) {
      return res.status(404).json({ err: "User not found" });
    }

    const foundEvent = await Event.findById(event);

    if (!foundEvent) {
      return res.status(404).json({ err: "Event not found" });
    }

    let date1 = new Date("1970-01-01T" + start + "Z");
    let date2 = new Date("1970-01-01T" + end + "Z");

    let diff = Math.abs(date1.getTime() - date2.getTime());
    let minutes = Math.floor(diff / 1000 / 60);

    if (minutes !== foundEvent.eventDuration) {
      return res.status(400).json({
        err: `Error: Event duration must be ${foundEvent.eventDuration} minutes`,
      });
    }

    const eventStart = Number(start.replace(":", "."));
    const eventEnd = Number(end.replace(":", "."));

    if (
      eventStart < foundEvent.dayStart ||
      eventEnd > foundEvent.dayEnd ||
      eventStart > foundEvent.dayEnd
    ) {
      return res.status(400).json({
        err: "Error: Event start and end times must be within schedule",
      });
    }

    const foundClashingMentorEvent = await Schedule.findOne({
      mentorID,
      day,
      $or: [
        { $and: [{ start: { $eq: eventStart } }, { end: { $eq: eventEnd } }] },
        { $and: [{ start: { $lt: eventEnd } }, { end: { $gt: eventStart } }] },
        {
          $and: [{ start: { $gt: eventStart } }, { start: { $lt: eventEnd } }],
        },
        { $and: [{ end: { $gt: eventStart } }, { end: { $lt: eventEnd } }] },
      ],
    });

    if (foundClashingMentorEvent) {
      return res.status(400).json({
        err: "Error: Mentor is booked for this time",
      });
    }

    const newSchedule = new Schedule({
      mentorID,
      event,
      fullname,
      guestEmail,
      message,
      status: "pending",
      day,
      start: eventStart,
      end: eventEnd,
    });

    await newSchedule.save();
    foundUser.schedules.push(newSchedule);
    await foundUser.save();
    foundEvent.schedules.push(newSchedule);
    await foundEvent.save();

    res.status(201).json(newSchedule);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err: err.message });
  }
});

router.delete("/appointments/:scheduleId", async (req, res) => {
  try {
    const foundSchedule = await Schedule.findByIdAndDelete(
      req.params.scheduleId
    );
    if (!foundSchedule) {
      return res.status(404).json({ err: "Event not found" });
    }

    res.status(200).json(foundSchedule);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err: err.message });
  }
});

router.patch("/appointments/:scheduleId/status", async (req, res) => {
  try {
    const { status } = req.body;
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      req.params.scheduleId,
      { status },
      { new: true }
    );

    if (!updatedSchedule) {
      return res.status(404).json({ err: "Event not found" });
    }

    res.status(200).json({
      message: "Schedule status updated successfully",
      updatedSchedule,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err: err.message });
  }
});

router.get("/appointments/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    console.log(slug);
    const getSchedule = await User.find({ slug })
      .populate("schedules");
    console.log(getSchedule);
    res.status(200).json(getSchedule)
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err: err.message });
  }
});

module.exports = router;
