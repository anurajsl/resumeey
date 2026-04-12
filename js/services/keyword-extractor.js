/* Local Keyword Extractor (fallback when no AI) */

import { extractKeywords, containsKeyword } from '../utils/text-analysis.js';
import { SKILL_CATEGORIES, SKILL_SYNONYMS } from '../utils/constants.js';

// Build reverse synonym map
const synonymMap = new Map();
Object.entries(SKILL_SYNONYMS).forEach(([canonical, aliases]) => {
  aliases.forEach(alias => synonymMap.set(alias.toLowerCase(), canonical.toLowerCase()));
});

// Flat list of all known skills
const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

export function extractJobKeywords(jobDescription) {
  if (!jobDescription) return { required: [], preferred: [], skills: [], softSkills: [] };

  const text = jobDescription.toLowerCase();
  const keywords = extractKeywords(jobDescription, 50);

  // Find skills
  const skills = ALL_SKILLS.filter(skill => {
    const normalized = synonymMap.get(skill) || skill;
    return containsKeyword(text, skill, 0.9) || containsKeyword(text, normalized, 0.9);
  });

  // Find soft skills
  const softSkills = SKILL_CATEGORIES.soft.filter(s => containsKeyword(text, s, 0.9));

  // Find required vs preferred signals
  const requiredPattern = /required|must have|must be|essential|minimum|at least/i;
  const preferredPattern = /preferred|nice to have|plus|bonus|desired|advantage/i;

  const sentences = jobDescription.split(/[.!?]/);
  const required = [];
  const preferred = [];

  sentences.forEach(sentence => {
    const sentenceSkills = ALL_SKILLS.filter(s => containsKeyword(sentence.toLowerCase(), s, 0.9));
    if (requiredPattern.test(sentence)) {
      required.push(...sentenceSkills);
    } else if (preferredPattern.test(sentence)) {
      preferred.push(...sentenceSkills);
    }
  });

  // Fallback: use all extracted keywords as preferred
  const allTechSkills = [...new Set(skills)];
  const finalRequired = [...new Set(required)].slice(0, 10);
  const finalPreferred = [...new Set([...preferred, ...allTechSkills.filter(s => !finalRequired.includes(s))])].slice(0, 15);

  return {
    required: finalRequired,
    preferred: finalPreferred,
    skills: allTechSkills,
    softSkills: [...new Set(softSkills)],
    topKeywords: keywords.slice(0, 20),
  };
}

export function normalizeSkill(skill) {
  const lower = skill.toLowerCase().trim();
  return synonymMap.get(lower) || lower;
}

export function skillsFromText(text) {
  return ALL_SKILLS.filter(skill => containsKeyword(text.toLowerCase(), skill, 0.88));
}
