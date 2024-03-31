const express = require("express");
const logger = require("morgan");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const userRoutes = require("./routes/user_routes");
const scheduleRoutes = require("./routes/schedule_routes");
const eventRoutes = require("./routes/event_routes");

const PORT = process.env.PORT;

const app = express();
connectDB(); 

// Middleware
app.use(express.json());
app.use(cors());
app.use(logger("dev"));

// Routes
app.use(userRoutes);
app.use(scheduleRoutes);
app.use(eventRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
