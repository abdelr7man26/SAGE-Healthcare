const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


const MONGO_URI = "mongodb+srv://abdelr7man264_db_user:sage1234@sage-health-care.z2g6clo.mongodb.net/?appName=SAGE-HEALTH-CARE";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ SAGE Database Connected Successfully!"))
  .catch((err) => console.log("❌ DB Connection Error: ", err));

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));