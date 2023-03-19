const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));
const exerciseSchema = mongoose.Schema({
  userId: { type: mongoose.ObjectId, required: true },
  description: String,
  duration: Number,
  date: Date,
});
const userSchema = mongoose.Schema({
  username: { type: String, required: true },
});
const userModel = mongoose.model("users", userSchema);
const exerciseModel = mongoose.model("exercises", exerciseSchema);
const URI = "mongodb://127.0.0.1/boilerplate-project-exercisetracker";
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log(`Connected to MongoDB`);
  })
  .catch((error) => {
    console.log(`Failed to connect to MongoDB: ${error.message}`);
  });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  const newUser = new userModel(req.body);
  try {
    await newUser.save();
    res.status(201).json({ username: newUser.username, _id: newUser._id });
  } catch (error) {
    console.log(error);
    res.status(409).json({ message: error.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const userList = await userModel.find({}).select({ username: 1, _id: 1 });
    res.status(201).json(userList);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
});
app.post("/api/users/:_id/exercises", async (req, res) => {
  const uid = req.params._id;
  let { description, duration, date } = req.body;
  if (date == "" || date == undefined) {
    date = new Date();
  } else {
    date = new Date(date);
  }
  try {
    const user = await userModel.findById(uid);
    // console.log(uid + " pushed to log!" + user);
    const newExercise = new exerciseModel({
      userId: user._id,
      description: description,
      duration: duration,
      date: date,
    });
    await newExercise.save();
    res.status(201).json({
      username: user.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date.toDateString(),
      _id: user._id,
    });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
});
app.get("/api/users/:_id/logs", async (req, res) => {
  const uid = req.params._id;
  let { from, to, limit } = req.query;
  // console.log(` uid: ${uid}, from: ${from}, to: ${to}, limit: ${limit}`);
  try {
    const user = await userModel.findById(uid);
    let filter = { userId: user._id };
    if (from || to) {
      filter.date = {};
    }
    if (from) {
      filter.date["$gte"] = new Date(from);
    }
    if (to) {
      filter.date["$lte"] = new Date(to);
    }
    if (!limit || limit == undefined) {
      //set limit to 100 if not given
      limit = 100;
    }
    // console.log("filter made!: ", filter);
    const exercises = await exerciseModel.find(filter).limit(limit);
    const count = exercises.length;
    const log = exercises.map((exer) => ({
      description: exer.description,
      duration: exer.duration,
      date: exer.date.toDateString(),
    }));
    console.log("log: ", log);
    res.status(201).json({
      username: user.username,
      count: count,
      _id: user._id,
      log: log,
    });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
