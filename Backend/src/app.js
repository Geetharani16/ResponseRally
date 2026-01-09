import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import compareRoutes from "./routes/compare.routes.js";

dotenv.config();

const app = express();

/* =======================
   Middleware
======================= */
app.use(cors());
app.use(express.json({ limit: "10mb" }));

/* =======================
   Routes
======================= */
app.use("/api", compareRoutes);

/* =======================
   Health Check
======================= */
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "ResponseRally Backend is running"
  });
});

/* =======================
   Global Error Handler
======================= */
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);

  res.status(500).json({
    success: false,
    message: "Something went wrong"
  });
});

/* =======================
   Server Start
======================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
