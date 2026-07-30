const API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-v4-flash";

export async function sendMessage(messages, apiKey, tools) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools,
      thinking: { type: "disabled" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`DeepSeek API ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0].message;
}
