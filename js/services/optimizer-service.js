/* Resume Bullet Optimizer */

import { aiService } from './ai-service.js';

export async function optimizeResume(resume, jobKeywords, missingKeywords = []) {
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
        const optimized = await aiService.optimizeBullet(bullet, jobDesc, missingKeywords);
        if (optimized && optimized !== bullet) {
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
