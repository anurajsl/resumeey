/* Cover Letter Generation Service */

import { aiService } from './ai-service.js';

export async function generateCoverLetter({ resume, job, tone = 'professional' }) {
  const aiAvailable = await aiService.isAvailable();

  if (aiAvailable) {
    return aiService.generateCoverLetter({
      resumeData: resume,
      jobTitle: job.title,
      company: job.company,
      jobDescription: job.description,
      tone,
    });
  }

  // Fallback template-based cover letter
  return generateTemplateCoverLetter(resume, job, tone);
}

function generateTemplateCoverLetter(resume, job, tone) {
  const contact = resume?.sections?.contact || {};
  const name = contact.name || 'the applicant';
  const skills = (resume?.sections?.skills || []).slice(0, 5).join(', ');
  const topExp = (resume?.sections?.experience || [])[0];

  const opening = tone === 'concise'
    ? `I am writing to express my interest in the ${job.title} position at ${job.company}.`
    : `I am excited to apply for the ${job.title} position at ${job.company}. Your company's work aligns strongly with my professional background and career goals.`;

  const body = topExp
    ? `In my most recent role as ${topExp.role} at ${topExp.company}, I developed strong expertise in ${skills}. I have consistently delivered results and am confident in my ability to contribute meaningfully to your team.`
    : `I bring strong skills in ${skills || 'relevant areas'} and am eager to contribute to ${job.company}'s success.`;

  const closing = tone === 'persuasive'
    ? `I would be thrilled to discuss how my background can drive value for ${job.company}. Thank you for considering my application — I look forward to speaking with you soon.`
    : `Thank you for considering my application. I look forward to discussing how I can contribute to your team.`;

  return `Dear Hiring Manager,

${opening}

${body}

${closing}

Sincerely,
${name}`;
}
