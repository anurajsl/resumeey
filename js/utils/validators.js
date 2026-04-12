/* Input Validators */

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidPhone(phone) {
  return /^[\+]?[\d\s\-\(\)]{7,20}$/.test(phone.trim());
}

export function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidOpenAIKey(key) {
  return /^sk-[a-zA-Z0-9\-_]{20,}$/.test(key.trim());
}

export function isValidAnthropicKey(key) {
  return /^sk-ant-[a-zA-Z0-9\-_]{20,}$/.test(key.trim());
}

export function isValidOpenRouterKey(key) {
  return key.trim().length > 20;
}

export function isValidAIKey(provider, key) {
  const k = key?.trim() || '';
  if (!k) return false;
  switch (provider) {
    case 'openai':     return isValidOpenAIKey(k);
    case 'anthropic':  return isValidAnthropicKey(k);
    case 'openrouter': return isValidOpenRouterKey(k);
    default:           return k.length > 20;
  }
}

export function isValidLicenseKey(key) {
  return typeof key === 'string' && key.trim().length >= 6;
}

export function validateResumeSection(section, data) {
  const errors = {};
  if (section === 'contact') {
    if (!isNonEmpty(data.name)) errors.name = 'Name is required';
    if (data.email && !isValidEmail(data.email)) errors.email = 'Invalid email';
    if (data.phone && !isValidPhone(data.phone)) errors.phone = 'Invalid phone number';
  }
  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
