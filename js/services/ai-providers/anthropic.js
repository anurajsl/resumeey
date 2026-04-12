/* Anthropic Messages Client */

export async function anthropicComplete({ apiKey, model = 'claude-3-haiku-20240307', messages, temperature = 0.7, maxTokens = 2000 }) {
  // Separate system message if present
  let system = '';
  const userMessages = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      system = msg.content;
    } else {
      userMessages.push(msg);
    }
  }

  const body = {
    model,
    max_tokens: maxTokens,
    temperature,
    messages: userMessages,
  };

  if (system) body.system = system;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `Anthropic error: ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  return data.content?.[0]?.text?.trim() || '';
}

export async function validateAnthropicKey(apiKey) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });
    return response.ok || response.status === 400; // 400 = bad request format but key works
  } catch {
    return false;
  }
}
