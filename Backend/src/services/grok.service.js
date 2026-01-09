export const callGrok = async (prompt) => {
  const response = await fetch(
    "https://api.x.ai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROK_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [{ role: "user", content: prompt }]
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Grok API error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
