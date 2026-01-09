
import express from "express";
import { comparePrompt } from "../controllers/compare.controller.js";

const router = express.Router();

/**
 * POST /api/compare
 */
router.post("/compare", comparePrompt);

export default router;
