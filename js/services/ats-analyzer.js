/* ATS Scoring Engine */

import { readabilityScore, wordCount, extractKeywords } from '../utils/text-analysis.js';
import { ATS_THRESHOLDS } from '../utils/constants.js';

export function analyzeATS(resume, jobKeywords = {}) {
  const sections = resume.sections || {};
  const issues = [];
  const tips = [];
  let totalScore = 0;
  const weights = {
    formatting: 0.25,
    keywords: 0.30,
    readability: 0.20,
    completeness: 0.25,
  };

  // --- Formatting score ---
  let formattingScore = 100;
  const formattingIssues = [];

  // Check for contact info completeness
  const contact = sections.contact || {};
  if (!contact.email) { formattingIssues.push({ text: 'Missing email address', severity: 'high' }); formattingScore -= 15; }
  if (!contact.phone) { formattingIssues.push({ text: 'Missing phone number', severity: 'medium' }); formattingScore -= 8; }
  if (!contact.name) { formattingIssues.push({ text: 'Missing full name', severity: 'high' }); formattingScore -= 20; }

  // Check dates format
  const experiences = sections.experience || [];
  const hasDateIssues = experiences.some(e => !e.startDate);
  if (hasDateIssues) {
    formattingIssues.push({ text: 'Some experience entries missing dates', severity: 'medium' });
    formattingScore -= 10;
  }

  // Check bullet points
  const bulletsTotal = experiences.reduce((sum, e) => sum + (e.bullets?.length || 0), 0);
  if (experiences.length > 0 && bulletsTotal < experiences.length) {
    formattingIssues.push({ text: 'Some roles have no bullet points / achievements', severity: 'medium' });
    formattingScore -= 10;
  }

  issues.push(...formattingIssues);

  // --- Keyword score ---
  let keywordScore = 70; // Default if no job keywords
  const requiredKws = jobKeywords.required || [];
  const allJobKws = [...new Set([...requiredKws, ...(jobKeywords.skills || []), ...(jobKeywords.preferred || [])])];

  if (allJobKws.length > 0) {
    const resumeText = buildResumeText(resume).toLowerCase();
    const matchedKws = allJobKws.filter(kw => resumeText.includes(kw.toLowerCase()));
    keywordScore = Math.round((matchedKws.length / allJobKws.length) * 100);

    if (keywordScore < 40) {
      issues.push({ text: 'Low keyword density — resume may be filtered by ATS', severity: 'high' });
      tips.push('Add more job-specific keywords from the job description');
    }

    const missingRequired = requiredKws.filter(kw => !resumeText.includes(kw.toLowerCase()));
    if (missingRequired.length > 0) {
      issues.push({
        text: `Missing required keywords: ${missingRequired.slice(0, 4).join(', ')}`,
        severity: 'high',
      });
    }
  }

  // --- Readability score ---
  const allText = buildResumeText(resume);
  const readability = readabilityScore(allText);
  let readabilityNorm = Math.round((readability / 100) * 100);

  // Check bullet length
  const longBullets = experiences.flatMap(e => e.bullets || []).filter(b => b.split(' ').length > 30);
  if (longBullets.length > 2) {
    issues.push({ text: 'Some bullet points are too long (30+ words)', severity: 'low' });
    readabilityNorm -= 10;
    tips.push('Keep bullet points concise — aim for 15–25 words each');
  }

  // Check for weak verbs
  const weakVerbs = ['helped', 'worked on', 'assisted', 'was responsible for', 'participated in'];
  const hasWeakVerbs = experiences.flatMap(e => e.bullets || [])
    .some(b => weakVerbs.some(v => b.toLowerCase().startsWith(v)));

  if (hasWeakVerbs) {
    issues.push({ text: 'Weak action verbs detected in bullet points', severity: 'low' });
    tips.push('Start bullets with strong action verbs: Led, Built, Launched, Increased, Reduced');
    readabilityNorm -= 8;
  }

  // --- Completeness score ---
  let completenessScore = 0;
  const sectionChecks = [
    { key: 'contact', check: () => contact.name && contact.email, label: 'Contact info', points: 20 },
    { key: 'summary', check: () => sections.summary?.length > 50, label: 'Professional summary', points: 15 },
    { key: 'experience', check: () => experiences.length > 0, label: 'Work experience', points: 25 },
    { key: 'education', check: () => (sections.education || []).length > 0, label: 'Education', points: 15 },
    { key: 'skills', check: () => (sections.skills || []).length >= 5, label: 'Skills (5+ listed)', points: 15 },
    { key: 'bullets', check: () => bulletsTotal >= 3, label: 'Achievement bullets', points: 10 },
  ];

  const missingItems = [];
  sectionChecks.forEach(({ key, check, label, points }) => {
    if (check()) {
      completenessScore += points;
    } else {
      missingItems.push(label);
    }
  });

  if (missingItems.length > 0) {
    issues.push({ text: `Incomplete sections: ${missingItems.join(', ')}`, severity: 'medium' });
    tips.push('Complete all key resume sections for better ATS performance');
  }

  // Calculate overall
  const overall = Math.round(
    Math.max(0, formattingScore) * weights.formatting +
    keywordScore * weights.keywords +
    Math.max(0, readabilityNorm) * weights.readability +
    completenessScore * weights.completeness
  );

  // Generate positive tips
  if (overall >= ATS_THRESHOLDS.EXCELLENT) {
    tips.push('Excellent ATS optimization! Your resume is well-structured for automated screening.');
  } else if (overall >= ATS_THRESHOLDS.GOOD) {
    tips.push('Good ATS score. Small improvements can push you above 85%.');
  }

  return {
    overallScore: Math.min(100, Math.max(0, overall)),
    formattingScore: Math.max(0, formattingScore),
    keywordScore,
    readabilityScore: Math.max(0, readabilityNorm),
    completenessScore,
    issues: issues.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.severity] || 1) - (order[b.severity] || 1);
    }),
    tips,
    wordCount: wordCount(allText),
  };
}

function buildResumeText(resume) {
  const sections = resume.sections || {};
  return [
    sections.summary || '',
    ...(sections.experience || []).map(e => [e.role, e.company, ...(e.bullets || [])].join(' ')),
    ...(sections.skills || []).map(s => typeof s === 'string' ? s : s.name || ''),
    ...(sections.education || []).map(e => `${e.degree} ${e.field} ${e.institution}`),
  ].join(' ');
}
