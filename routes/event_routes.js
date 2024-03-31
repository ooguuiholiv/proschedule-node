const express = require("express");
const router = express.Router();
const isAuthenticated = require("../middlewares/auth");

const Event = require("../models/event_model");
const User = require("../models/userModel");

router.post("/services", isAuthenticated, async (req, res) => {
  try {
    const { title, description, daysOfWeek, dayStart, dayEnd, eventDuration } =
      req.body;
    const user = req.user.id;
    const foundUser = await User.findById(user);

    if (!foundUser) {
      console.log("Cannot get user id through req.user.id (middleware)");
      return res.status(503).json({ err: "Something went wrong" });
    }

    const day = new Date();

    const presentEvent = await Event.findOne({ user, day });

    if (presentEvent) {
      return res.status(403).json({ err: "Service already exists" });
    }

    const EventStart = Number(dayStart.replace(":", "."));
    const EventEnd = Number(dayEnd.replace(":", "."));

    const newEvent = new Event({
      user,
      day,
      title,
      description,
      daysOfWeek,
      dayStart: EventStart,
      dayEnd: EventEnd,
      eventDuration,
    });

    await newEvent.save();
    foundUser.events.push(newEvent);
    await foundUser.save();

    res.status(201).json(newEvent);
  } catch (err) {
    console.log(err);

    res.status(500).json({ err: err.message });
  }
});



router.get("/services/:slug", async (req, res) => {
   try {
    const slug = req.params.slug
     const event = await User.find({slug}).populate(
       "events"
     );
     res.status(200).json(event);
   } catch (err) {
     console.log(err);

     res.status(500).json({ err: err.message });
   }
})

router.put("/services/:eventID/status", isAuthenticated, async (req, res) => {
  try {
    const foundEvent = await Event.findById(req.params.eventID);

    if (!foundEvent) {
      return res.status(404).json({ err: "Service not found" });
    }

    if (foundEvent.events.length > 0) {
      return res.status(403).json({ err: "Cannot delete service with events" });
    }

    const { title, description, daysOfWeek, dayStart, dayEnd, eventDuration } =
      req.body;

    const eventStart = Number(dayStart.replace(":", "."));
    const eventEnd = Number(dayEnd.replace(":", "."));

    const updatedEvent = await Event.updateOne(
      { _id: req.params.eventID },
      {
        title,
        description,
        daysOfWeek,
        dayStart: eventStart,
        dayEnd: eventEnd,
        eventDuration,
      }
    );
    res.status(200).json(updatedEvent);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.delete("/services/:eventId", isAuthenticated, async (req, res) => {
  try {
    const foundUser = await User.findById(req.user.id);

    if (!foundUser) {
      return res.status(404).json({ err: "User not found" });
    }

    const foundEvent = await Event.findById(req.params.eventId);

    if (!foundEvent) {
      return res.status(404).json({ err: "Service not found" });
    }

    if (foundEvent.schedules.length > 0) {
      return res.status(403).json({ err: "Cannot delete service with events" });
    }

    await Event.findByIdAndDelete(req.params.eventId);
    foundUser.events.pull(req.params.eventId);
    await foundUser.save();

    res.status(200).json({ msg: "Service deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
