/* Resume Bullet Optimizer */

import { aiService } from './ai-service.js';

// ─── Rule-based fallback ──────────────────────────────────────────────────────

const WEAK_VERB_MAP = {
  'was responsible for': 'Owned',
  'responsible for': 'Owned',
  'worked on': 'Developed',
  'helped with': 'Contributed to',
  'helped': 'Supported',
  'assisted with': 'Partnered to',
  'assisted': 'Supported',
  'participated in': 'Contributed to',
  'involved in': 'Drove',
  'did': 'Executed',
  'made': 'Built',
  'handled': 'Managed',
  'did work': 'Delivered',
  'tried to': 'Worked to improve',
};

const PASSIVE_PATTERNS = [
  { pattern: /^was (\w+ed) by /i, replacement: '' },
  { pattern: /^were (\w+ed) by /i, replacement: '' },
];

export function ruleBasedOptimize(bullet, jobKeywords = [], missingKeywords = []) {
  if (!bullet || bullet.trim().length < 10) return null;

  let text = bullet.trim();
  let changed = false;

  // 1. Replace weak verb phrases at start of bullet
  for (const [weak, strong] of Object.entries(WEAK_VERB_MAP)) {
    const regex = new RegExp(`^${weak}\\s+`, 'i');
    if (regex.test(text)) {
      text = text.replace(regex, strong + ' ');
      changed = true;
      break;
    }
  }

  // 2. Remove passive voice openers
  for (const { pattern, replacement } of PASSIVE_PATTERNS) {
    if (pattern.test(text)) {
      text = text.replace(pattern, replacement);
      text = text.charAt(0).toUpperCase() + text.slice(1);
      changed = true;
    }
  }

  // 3. Capitalise first word if not already
  if (text[0] !== text[0].toUpperCase()) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
    changed = true;
  }

  // 4. Inject one missing keyword naturally if bullet doesn't already contain it
  if (missingKeywords.length > 0) {
    const lower = text.toLowerCase();
    const toInject = missingKeywords.find(kw => !lower.includes(kw.toLowerCase()) && kw.length > 3);
    if (toInject) {
      // Append as context if bullet is complete sentence
      if (!text.endsWith('.')) {
        text = text + ` using ${toInject}`;
      } else {
        text = text.slice(0, -1) + ` using ${toInject}.`;
      }
      changed = true;
    }
  }

  // 5. Trim overly long bullets (>200 chars) at a sentence boundary
  if (text.length > 200) {
    const cutoff = text.lastIndexOf(',', 200);
    if (cutoff > 120) {
      text = text.slice(0, cutoff).trim() + '.';
      changed = true;
    }
  }

  return changed ? text : null;
}

export async function optimizeResume(resume, jobKeywords, missingKeywords = [], { useAI = true } = {}) {
  const sections = resume.sections || {};
  const experiences = sections.experience || [];
  const jobDesc = [
    ...(jobKeywords.required || []),
    ...(jobKeywords.skills || []),
  ].join(', ');

  const optimizations = [];

  for (const exp of experiences) {
    if (!exp.bullets?.length) continue;
    const expOptimizations = [];

    for (const bullet of exp.bullets) {
      if (!bullet || bullet.trim().length < 10) continue;
      try {
        let optimized = null;
        if (useAI) {
          optimized = await aiService.optimizeBullet(bullet, jobDesc, missingKeywords);
        } else {
          optimized = ruleBasedOptimize(bullet, [...(jobKeywords.required || []), ...(jobKeywords.skills || [])], missingKeywords);
        }
        if (optimized && optimized.trim() !== bullet.trim()) {
          expOptimizations.push({
            original: bullet,
            optimized: optimized.trim(),
            accepted: false,
          });
        }
      } catch (err) {
        console.warn('Failed to optimize bullet:', err.message);
      }
    }

    if (expOptimizations.length > 0) {
      optimizations.push({
        role: exp.role,
        company: exp.company,
        bullets: expOptimizations,
      });
    }
  }

  return optimizations;
}

export function applyOptimizations(resume, acceptedOptimizations) {
  const sections = { ...resume.sections };
  const experiences = [...(sections.experience || [])];

  acceptedOptimizations.forEach(({ role, company, original, optimized }) => {
    const expIndex = experiences.findIndex(e => e.role === role && e.company === company);
    if (expIndex === -1) return;

    const exp = { ...experiences[expIndex] };
    const bullets = [...(exp.bullets || [])];
    const bulletIndex = bullets.findIndex(b => b === original);

    if (bulletIndex !== -1) {
      bullets[bulletIndex] = optimized;
      exp.bullets = bullets;
      experiences[expIndex] = exp;
    }
  });

  sections.experience = experiences;
  return { ...resume, sections };
}
