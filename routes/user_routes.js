const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const {
  validateEmail,
  validateName,
  validatePassword,
} = require("../utils/validators");
const isAuthenticated = require("../middlewares/auth");

const router = express.Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(403).json({ err: "User already exists" });
    }

    if (!validateName(name)) {
      return res.status(400).json({
        err: "Invalid user name: name must be longer than two characters and must not include any numbers or special characters",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ err: "Error: Invalid email" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        err: "Error: Invalid password: password must be at least 8 characters long and must include atleast one - one uppercase letter, one lowercase letter, one digit, one special character",
      });
    }

    const hashedPassword = await bcrypt.hash(password, (saltOrRounds = 10));
    const userData = {
      name,
      email,
      phone,
      password: hashedPassword,
    };

    const newUser = new User(userData);
    await newUser.save();

    console.log(newUser);
    return res.status(201).json({ msg: "User created successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err: err.message });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email.length === 0) {
      return res.status(400).json({ err: "Please enter your email" });
    }
    if (password.length === 0) {
      return res.status(400).json({ err: "Please enter your password" });
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ err: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({ err: "Invalid credentials" });
    }
    console.log(existingUser, existingUser.id);
    const payload = { user: { id: existingUser.id } };
    const bearerToken = await jwt.sign(payload, process.env.SECRET, {
      expiresIn: 3600,
    });

    res.cookie("t", bearerToken, { expire: new Date() + 9999 });

    console.log("Logged in successfully");

    return res.status(200).json({ msg: "Signed-In successfully", bearerToken });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err: err.message });
  }
});

router.get("/auth/signout", (_req, res) => {
  res.clearCookie("t");
  return res.status(200).json({ msg: "Signed-Out successfully" });
});

router.get("/auth/users", async (req, res) => {
  try {
    const user = await User.find();
    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err: err.message });
  }
});

 router.get("/auth/is-authenticated", isAuthenticated, (req, res) => {
   res.json({ authenticated: true });

});

module.exports = router;
