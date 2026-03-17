const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

app.get("/", (req, res) => {
  res.send("API Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

app.get("/test-db", async (req, res) => {
  try {
    const Test = mongoose.model(
      "Test",
      new mongoose.Schema({ name: String })
    );

    const doc = await Test.create({ name: "Vaibhav" });

    res.json(doc);
  } catch (err) {
    res.status(500).json(err.message);
  }
});
});