/* OpenAI Chat Completions Client */

export async function openaiComplete({ apiKey, model = 'gpt-4o-mini', messages, temperature = 0.7, maxTokens = 2000 }) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `OpenAI error: ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

export async function validateOpenAIKey(apiKey) {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  return response.ok;
}
