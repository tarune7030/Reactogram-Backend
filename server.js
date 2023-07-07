require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const { MONGODB_URL } = require("./config");

global.__basedir = __dirname;
mongoose.connect(MONGODB_URL);

mongoose.connection.on("connected", () => {
  console.log("DB Connected");
});

mongoose.connection.on("error", (error) => {
  console.log("Some error while connecting");
});

require("./models/user_model");
require("./models/post_model");

app.use(cors());
app.use(express.json());

app.use(require("./routes/user_route"));
app.use(require("./routes/post_route"));
app.use(require("./routes/file_route"));

app.listen(5000, () => {
  console.log("Server has been started!");
});
