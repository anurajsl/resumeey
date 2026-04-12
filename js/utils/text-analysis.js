/* Text Analysis Utilities */

/**
 * Levenshtein distance
 */
export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

/**
 * Fuzzy match: returns similarity 0..1
 */
export function fuzzyMatch(a, b) {
  if (!a || !b) return 0;
  const al = a.toLowerCase().trim();
  const bl = b.toLowerCase().trim();
  if (al === bl) return 1;
  const dist = levenshtein(al, bl);
  const maxLen = Math.max(al.length, bl.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

/**
 * Tokenize text into words (lowercase, dedup optional)
 */
export function tokenize(text, deduplicate = false) {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
  return deduplicate ? [...new Set(words)] : words;
}

/**
 * Extract n-grams from text
 */
export function ngrams(text, n = 2) {
  const tokens = tokenize(text);
  const result = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    result.push(tokens.slice(i, i + n).join(' '));
  }
  return result;
}

/**
 * TF-IDF simplified — just compute TF for single document
 */
export function termFrequency(text, term) {
  const tokens = tokenize(text);
  if (tokens.length === 0) return 0;
  const count = tokens.filter(t => t === term.toLowerCase()).length;
  return count / tokens.length;
}

/**
 * Extract meaningful keywords from text using TF + stop-word filter
 */
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','up','about','into','through','during','is','are','was',
  'were','be','been','being','have','has','had','do','does','did','will',
  'would','could','should','may','might','must','shall','can','need',
  'this','that','these','those','i','you','he','she','it','we','they',
  'what','which','who','where','when','why','how','all','each','every',
  'both','few','more','most','other','some','such','than','too','very',
  'just','not','also','as','if','so','yet','now','then','there','here',
  'its','their','our','your','my','his','her'
]);

export function extractKeywords(text, topN = 30) {
  if (!text) return [];
  const tokens = tokenize(text);
  const freq = {};
  tokens.forEach(t => {
    if (!STOP_WORDS.has(t) && t.length > 2) {
      freq[t] = (freq[t] || 0) + 1;
    }
  });
  // Also extract bigrams
  const bi = ngrams(text, 2);
  bi.forEach(b => {
    const words = b.split(' ');
    if (!words.some(w => STOP_WORDS.has(w))) {
      freq[b] = (freq[b] || 0) + 0.5;
    }
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

/**
 * Readability score (Flesch-Kincaid simplified)
 */
export function readabilityScore(text) {
  if (!text) return 0;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = tokenize(text);
  const syllables = words.reduce((acc, w) => acc + countSyllables(w), 0);

  if (sentences.length === 0 || words.length === 0) return 50;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease
  const score = 206.835
    - (1.015 * avgWordsPerSentence)
    - (84.6 * avgSyllablesPerWord);

  return Math.max(0, Math.min(100, score));
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

/**
 * Count words in text
 */
export function wordCount(text) {
  return tokenize(text).length;
}

/**
 * Check if text contains keyword (with fuzzy matching)
 */
export function containsKeyword(text, keyword, threshold = 0.8) {
  const textLower = text.toLowerCase();
  const kw = keyword.toLowerCase().trim();

  // Exact check
  if (textLower.includes(kw)) return true;

  // Check each token with fuzzy
  const tokens = tokenize(text);
  const kwTokens = tokenize(kw);

  if (kwTokens.length === 1) {
    return tokens.some(t => fuzzyMatch(t, kw) >= threshold);
  }

  // Multi-word: check ngrams
  const ngramList = ngrams(text, kwTokens.length);
  return ngramList.some(ng => fuzzyMatch(ng, kw) >= threshold);
}

/**
 * Extract years of experience from text
 */
export function extractYearsOfExperience(text) {
  const matches = text.match(/(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)/gi) || [];
  if (matches.length === 0) return 0;
  const years = matches.map(m => parseInt(m));
  return Math.max(...years);
}

/**
 * Highlight keywords in text (returns HTML string)
 */
export function highlightKeywords(text, keywords, cls = 'highlight') {
  if (!text || !keywords?.length) return text;
  let result = text;
  keywords.forEach(kw => {
    const re = new RegExp(`\\b(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
    result = result.replace(re, `<mark class="${cls}">$1</mark>`);
  });
  return result;
}
