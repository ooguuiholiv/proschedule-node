const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const {
  validateEmail,
  validateName,
  validatePassword,
} = require("../utils/validators");
const send_email = require("../utils/models_email/send_email_recovery_link");
const send_email_welcome = require("../utils/models_email/send_email_welcome");
const send_email_recovery_link = require("../utils/models_email/send_email_recovery_link");
const PasswordReset = require("../models/resetPassModel");
const secretJwt = process.env.SECRET;
const router = express.Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { fullname, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(403).json({ err: "User already exists" });
    }

    if (!validateName(fullname)) {
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
      fullname,
      email,
      phone,
      password: hashedPassword,
    };

    const newUser = new User(userData);
    await newUser.save();

    console.log(newUser);
    await send_email_welcome(userData.email);
    console.log(email);
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

router.patch("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (email.length === 0) {
      return res.status(400).json({ err: "Please enter your email" });
    }
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ err: "User not found" });
    }

    const token = jwt.sign({ email }, secretJwt, { expiresIn: 1800000 });
    const min30 = 1800000;
    const resetTokenExpiry = Date.now() + min30;
    await PasswordReset.create({ email, token, resetTokenExpiry });
    const resetLink = `http://localhost:7777/auth/reset-password?token=${token}`;
    send_email_recovery_link(resetLink, email);
    return res
      .status(200)
      .json("Um email foi enviado com instruções para redefinir sua senha.");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err: err.message });
  }
});

router.post("/auth/reset-password", async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, secretJwt);
    const { email } = decoded;
    const resetRequest = await PasswordReset.findOne({ email, token });
    if (!resetRequest) {
      return res.status(400).send("Token inválido ou expirado.");
    }
    const now = new Date();
    if (now > resetRequest.resetTokenExpiry) {
      await PasswordReset.deleteOne({ email, token });
      return res
        .status(400)
        .send("Token expirado. Solicite novamente a redefinição de senha.");
    }
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .send("A nova senha e a confirmação de senha não correspondem.");
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send("Usuário não encontrado.");
    }

    const hashedPassword = await bcrypt.hash(
      confirmPassword,
      (saltOrRounds = 10)
    );
    user.password = hashedPassword;
    await user.save();
    res.send("Senha atualizada com sucesso.");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err: err.message });
  }
});

module.exports = router;
