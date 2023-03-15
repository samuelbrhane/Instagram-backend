const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require("./model/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

dotenv.config();

const PORT = process.env.PORT;

app.use(cors());
app.use(morgan("tiny"));

app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("<h1>Instagram Clone</h1>");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // check user exists
  const userExists = await User.findOne({ email });

  // user not register
  if (!userExists)
    return res.json({ error: "Email Not Exists.", status: false });

  // check password
  const matchPassword = await bcrypt.compare(password, userExists.password);

  // password not match
  if (!matchPassword)
    return res.json({ error: "Incorrect Password!", status: false });

  //  create user
  try {
    const token = jwt.sign({ _id: userExists._id }, process.env.SECRET, {
      expiresIn: "12h",
    });
    let { password, ...other } = userExists._doc;
    res.json({ user: other, token, status: true });
  } catch (error) {
    res.status(500).json({ error: error.message, status: false });
  }
});

app.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;
  //   check if email exists
  const emailExists = await User.findOne({ email });
  if (emailExists)
    return res.json({ error: "Email Already Exists!", status: false });

  // hash user password
  const hash = await bcrypt.hash(password, 12);

  //  create user
  try {
    const user = await User.create({
      fullName,
      email,
      password: hash,
    });

    // create token
    const token = jwt.sign({ _id: user._id }, process.env.SECRET, {
      expiresIn: "12h",
    });
    let { password, ...other } = user._doc;
    res.json({ user: other, token, status: true });
  } catch (error) {
    res.status(500).json({ error: error.message, status: false });
  }
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`connect to database and server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
