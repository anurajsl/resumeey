/* OpenRouter Client */

export async function openrouterComplete({ apiKey, model = 'openai/gpt-4o-mini', messages, temperature = 0.7, maxTokens = 2000 }) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Resumey',
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
    const msg = err.error?.message || `OpenRouter error: ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

export async function validateOpenRouterKey(apiKey) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}
