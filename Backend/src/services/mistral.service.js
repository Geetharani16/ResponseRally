export const callMistral = async (prompt) => {
  const response = await fetch(
    "https://api.mistral.ai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistral-small",
        messages: [{ role: "user", content: prompt }]
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Mistral API error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
