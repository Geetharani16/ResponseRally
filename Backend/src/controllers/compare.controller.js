import { orchestratePrompt } from "../services/orchestrator.js";

/**
 * POST /api/compare
 * Body: { prompt: string }
 */
export const comparePrompt = async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validation
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required"
      });
    }

    // Orchestrate AI responses
    const results = await orchestratePrompt(prompt);

    return res.status(200).json({
      success: true,
      prompt,
      results
    });
  } catch (error) {
    console.error("Compare Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
