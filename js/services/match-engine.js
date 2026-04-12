/* MatchScore Engine */

import { MATCH_WEIGHTS, MATCH_THRESHOLDS, SKILL_SYNONYMS, DEGREE_LEVELS } from '../utils/constants.js';
import { containsKeyword, fuzzyMatch, extractYearsOfExperience } from '../utils/text-analysis.js';
import { normalizeSkill } from './keyword-extractor.js';

/**
 * Main match scoring function
 */
export function scoreMatch(resume, jobKeywords) {
  const resumeText = buildResumeText(resume);

  const skillScore = scoreSkills(resume, jobKeywords);
  const experienceScore = scoreExperience(resume, jobKeywords);
  const keywordScore = scoreKeywords(resumeText, jobKeywords);
  const educationScore = scoreEducation(resume, jobKeywords);

  const overall = Math.round(
    skillScore.score * MATCH_WEIGHTS.SKILLS +
    experienceScore.score * MATCH_WEIGHTS.EXPERIENCE +
    keywordScore.score * MATCH_WEIGHTS.KEYWORDS +
    educationScore.score * MATCH_WEIGHTS.EDUCATION
  );

  const missingKeywords = gatherMissingKeywords(resumeText, jobKeywords);
  const strengths = gatherStrengths(resume, jobKeywords, { skillScore, keywordScore });
  const weakAreas = gatherWeakAreas({ skillScore, experienceScore, keywordScore, educationScore });

  return {
    overallScore: overall,
    skillMatch: skillScore.score,
    experienceMatch: experienceScore.score,
    keywordMatch: keywordScore.score,
    educationMatch: educationScore.score,
    missingKeywords,
    matchedKeywords: keywordScore.matched,
    strengths,
    weakAreas,
    breakdown: {
      skills: skillScore,
      experience: experienceScore,
      keywords: keywordScore,
      education: educationScore,
    },
  };
}

function buildResumeText(resume) {
  const sections = resume.sections || {};
  const parts = [];

  if (sections.summary) parts.push(sections.summary);

  (sections.experience || []).forEach(exp => {
    parts.push(`${exp.role} ${exp.company}`);
    (exp.bullets || []).forEach(b => parts.push(b));
  });

  (sections.skills || []).forEach(s => parts.push(typeof s === 'string' ? s : s.name || ''));

  (sections.education || []).forEach(edu => {
    parts.push(`${edu.degree} ${edu.field} ${edu.institution}`);
  });

  (sections.projects || []).forEach(p => {
    parts.push(p.description || '');
    (p.technologies || []).forEach(t => parts.push(t));
  });

  (sections.certifications || []).forEach(c => parts.push(c.name));

  return parts.join(' ');
}

function scoreSkills(resume, jobKeywords) {
  const resumeSkills = (resume.sections?.skills || []).map(s => {
    const val = typeof s === 'string' ? s : s.name || '';
    return normalizeSkill(val).toLowerCase();
  });

  const requiredSkills = jobKeywords.required || [];
  const preferredSkills = jobKeywords.preferred || [];
  const allSkills = [...new Set([...requiredSkills, ...preferredSkills, ...(jobKeywords.skills || [])])];

  if (allSkills.length === 0) return { score: 70, matched: [], missing: [] };

  let totalScore = 0;
  const matched = [];
  const missing = [];

  allSkills.forEach(skill => {
    const normalized = normalizeSkill(skill).toLowerCase();
    const isRequired = requiredSkills.includes(skill);
    const weight = isRequired ? 2 : 1;

    // Exact match
    if (resumeSkills.some(rs => rs === normalized || rs.includes(normalized) || normalized.includes(rs))) {
      matched.push(skill);
      totalScore += 100 * weight;
      return;
    }

    // Synonym match
    const synonyms = SKILL_SYNONYMS[normalized] || [];
    if (synonyms.some(syn => resumeSkills.some(rs => rs === syn))) {
      matched.push(skill);
      totalScore += 90 * weight;
      return;
    }

    // Fuzzy match
    const bestMatch = resumeSkills.reduce((best, rs) => {
      const score = fuzzyMatch(rs, normalized);
      return score > best ? score : best;
    }, 0);

    if (bestMatch >= 0.82) {
      matched.push(skill);
      totalScore += 80 * weight;
    } else {
      missing.push(skill);
      // Give partial credit if close
      totalScore += Math.round(bestMatch * 30) * weight;
    }
  });

  const maxScore = allSkills.reduce((sum, s) => sum + (requiredSkills.includes(s) ? 2 : 1) * 100, 0);
  const score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 70;

  return { score: Math.min(100, score), matched, missing };
}

function scoreExperience(resume, jobKeywords) {
  const yearsRequired = jobKeywords.yearsExperience || 0;

  // Calculate total years from resume
  const experiences = resume.sections?.experience || [];
  let totalMonths = 0;

  experiences.forEach(exp => {
    const start = exp.startDate ? new Date(exp.startDate + '-01') : null;
    const end = exp.isCurrent || !exp.endDate
      ? new Date()
      : new Date(exp.endDate + '-01');

    if (start && end && end > start) {
      totalMonths += (end - start) / (1000 * 60 * 60 * 24 * 30);
    }
  });

  const totalYears = totalMonths / 12;

  let score;
  if (yearsRequired === 0) {
    score = experiences.length > 0 ? 75 : 50;
  } else {
    const ratio = totalYears / yearsRequired;
    if (ratio >= 1.5) score = 100;
    else if (ratio >= 1) score = 90;
    else if (ratio >= 0.8) score = 75;
    else if (ratio >= 0.5) score = 55;
    else score = 30;
  }

  return {
    score,
    yearsRequired,
    yearsFound: Math.round(totalYears * 10) / 10,
    experienceCount: experiences.length,
  };
}

function scoreKeywords(resumeText, jobKeywords) {
  const allKws = [
    ...(jobKeywords.required || []).map(k => ({ keyword: k, weight: 2 })),
    ...(jobKeywords.preferred || []).map(k => ({ keyword: k, weight: 1.5 })),
    ...(jobKeywords.skills || []).map(k => ({ keyword: k, weight: 1 })),
    ...(jobKeywords.topKeywords || []).map(k => ({ keyword: k, weight: 0.5 })),
  ];

  if (allKws.length === 0) return { score: 60, matched: [], missing: [] };

  const text = resumeText.toLowerCase();
  let totalScore = 0;
  let maxScore = 0;
  const matched = [];
  const missing = [];

  allKws.forEach(({ keyword, weight }) => {
    maxScore += 100 * weight;
    if (containsKeyword(text, keyword, 0.85)) {
      matched.push(keyword);
      totalScore += 100 * weight;
    } else {
      missing.push(keyword);
    }
  });

  const score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 60;
  return { score: Math.min(100, score), matched, missing };
}

function scoreEducation(resume, jobKeywords) {
  const requiredLevel = jobKeywords.educationLevel?.toLowerCase() || '';
  const education = resume.sections?.education || [];

  if (!requiredLevel || education.length === 0) {
    return { score: education.length > 0 ? 75 : 50 };
  }

  const requiredScore = DEGREE_LEVELS[requiredLevel] || 0;
  const maxResumeScore = education.reduce((max, edu) => {
    const degreeWords = (edu.degree || '').toLowerCase().split(' ');
    const degreeScore = degreeWords.reduce((s, w) => {
      const ds = DEGREE_LEVELS[w];
      return ds && ds > s ? ds : s;
    }, 0);
    return degreeScore > max ? degreeScore : max;
  }, 0);

  if (maxResumeScore >= requiredScore) return { score: 100 };
  if (maxResumeScore >= requiredScore - 1) return { score: 75 };
  if (maxResumeScore > 0) return { score: 50 };
  return { score: 25 };
}

function gatherMissingKeywords(resumeText, jobKeywords) {
  const allRequired = [...new Set([
    ...(jobKeywords.required || []),
    ...(jobKeywords.skills || []).slice(0, 10),
  ])];

  return allRequired
    .filter(kw => !containsKeyword(resumeText.toLowerCase(), kw, 0.85))
    .slice(0, 15);
}

function gatherStrengths(resume, jobKeywords, { skillScore, keywordScore }) {
  const strengths = [];

  if (skillScore.matched.length > 0) {
    strengths.push(`Strong skill match: ${skillScore.matched.slice(0, 4).join(', ')}`);
  }

  if ((resume.sections?.experience || []).length >= 3) {
    strengths.push('Solid work history with multiple positions');
  }

  if (keywordScore.score >= 70) {
    strengths.push('Good keyword coverage for ATS systems');
  }

  if ((resume.sections?.certifications || []).length > 0) {
    strengths.push('Professional certifications add credibility');
  }

  return strengths;
}

function gatherWeakAreas({ skillScore, experienceScore, keywordScore, educationScore }) {
  const areas = [];

  if (skillScore.missing.length > 0) {
    areas.push(`Missing skills: ${skillScore.missing.slice(0, 4).join(', ')}`);
  }

  if (experienceScore.yearsRequired > 0 && experienceScore.yearsFound < experienceScore.yearsRequired) {
    areas.push(`Experience gap: ${experienceScore.yearsRequired}yr required, ${experienceScore.yearsFound}yr found`);
  }

  if (keywordScore.score < 50) {
    areas.push('Low keyword coverage — resume may be filtered by ATS');
  }

  return areas;
}
