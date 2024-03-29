const express = require("express");
const router = express.Router();
const isAuthenticated = require("../middlewares/auth");

const Schedule = require("../models/scheduleModel");
const User = require("../models/userModel");



router.post("/appointments", isAuthenticated, async (req, res) => {
  try {
    const { day, dayStart, dayEnd, eventDuration } = req.body;
    const user = req.user.id;
    const foundUser = await User.findById(user);

    if (!foundUser) {
      console.log(
        "Cannot get user id through req.user.id (middleware)"
      );
      return res.status(503).json({ err: "Something went wrong" });
    }

    const presentSchedule = await Schedule.findOne({ user, day });

    if (presentSchedule) {
      return res.status(403).json({ err: "Schedule already exists" });
    }

    const scheduleStart = Number(dayStart.replace(":", "."));
    const scheduleEnd = Number(dayEnd.replace(":", "."));

    const newSchedule = new Schedule({
      user,
      day,
      dayStart: scheduleStart,
      dayEnd: scheduleEnd,
      eventDuration,
    });

    await newSchedule.save();
    foundUser.schedules.push(newSchedule);
    await foundUser.save();

    res.status(201).json(newSchedule);
  } catch (err) {
    console.log(err);

    res.status(500).json({ err: err.message });
  }
});



router.get("/appointments/:userID", async (req, res) => {
  try {
    const foundUser = await User.findById(req.params.userID);
    if (!foundUser) {
      return res.status(404).json({ err: "User not found" });
    }
    const schedule = await Schedule.find({ user: req.params.userID });
    res.status(200).json(schedule);
  } catch (err) {
    console.log(err);

    res.status(500).json({ err: err.message });
  }
});



router.put("/appointments/:scheduleID/status", isAuthenticated, async (req, res) => {
  try {
    const foundSchedule = await Schedule.findById(req.params.scheduleID);

    if (!foundSchedule) {
      return res.status(404).json({ err: "Schedule not found" });
    }

    if (foundSchedule.events.length > 0) {
      return res
        .status(403)
        .json({ err: "Cannot delete schedule with events" });
    }

    const { day, dayStart, dayEnd, eventDuration } = req.body;

    const scheduleStart = Number(dayStart.replace(":", "."));
    const scheduleEnd = Number(dayEnd.replace(":", "."));

    const updatedSchedule = await Schedule.updateOne(
      { _id: req.params.scheduleID },
      { day, dayStart: scheduleStart, dayEnd: scheduleEnd, eventDuration }
    );
    res.status(200).json(updatedSchedule);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});



router.delete("/appointment/:scheduleID", isAuthenticated, async (req, res) => {
  try {
    const foundUser = await User.findById(req.user.id);

    if (!foundUser) {
      return res.status(404).json({ err: "User not found" });
    }

    const foundSchedule = await Schedule.findById(req.params.scheduleID);

    if (!foundSchedule) {
      return res.status(404).json({ err: "Schedule not found" });
    }

    if (foundSchedule.events.length > 0) {
      return res
        .status(403)
        .json({ err: "Cannot delete schedule with events" });
    }

    await Schedule.findByIdAndDelete(req.params.scheduleID);
    foundUser.schedules.pull(req.params.scheduleID);
    await foundUser.save();

    res.status(200).json({ msg: "Schedule deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
