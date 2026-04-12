/* AI Service - Unified Provider Abstraction */

import { SettingsRepo } from '../db/repositories.js';
import { openaiComplete } from './ai-providers/openai.js';
import { anthropicComplete } from './ai-providers/anthropic.js';
import { openrouterComplete } from './ai-providers/openrouter.js';
import { AI_PROVIDERS, AI_DEFAULT_MODELS } from '../utils/constants.js';

export class AIService {
  constructor() {
    this._config = null;
  }

  async getConfig() {
    if (this._config) return this._config;
    this._config = await SettingsRepo.getAIConfig();
    return this._config;
  }

  invalidateConfig() {
    this._config = null;
  }

  async isAvailable() {
    const config = await this.getConfig();
    return !!(config?.provider && config?.apiKey);
  }

  async complete({ messages, temperature = 0.7, maxTokens = 2000 }) {
    const config = await this.getConfig();
    if (!config?.provider || !config?.apiKey) {
      throw new Error('No AI provider configured. Please add your API key in Settings.');
    }

    const model = config.model || AI_DEFAULT_MODELS[config.provider];
    const args = { apiKey: config.apiKey, model, messages, temperature, maxTokens };

    switch (config.provider) {
      case AI_PROVIDERS.OPENAI:
        return openaiComplete(args);
      case AI_PROVIDERS.ANTHROPIC:
        return anthropicComplete(args);
      case AI_PROVIDERS.OPENROUTER:
        return openrouterComplete(args);
      default:
        throw new Error(`Unknown AI provider: ${config.provider}`);
    }
  }

  async prompt(systemPrompt, userPrompt, options = {}) {
    return this.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      ...options,
    });
  }

  async parseResumeText(text) {
    const system = `You are an expert resume parser. Extract structured data from the provided resume text.
Return ONLY valid JSON with this exact structure:
{
  "contact": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "website": "string"
  },
  "summary": "string",
  "experience": [
    {
      "role": "string",
      "company": "string",
      "location": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or null",
      "isCurrent": boolean,
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "field": "string",
      "institution": "string",
      "location": "string",
      "graduationDate": "YYYY-MM",
      "gpa": "string or null"
    }
  ],
  "skills": ["string"],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string or null"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "YYYY-MM or null"
    }
  ],
  "awards": ["string"]
}`;

    const result = await this.prompt(system, `Parse this resume:\n\n${text}`, { maxTokens: 3000, temperature: 0.1 });
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return null;
    }
  }

  async extractJobKeywords(jobDescription) {
    const system = `You are an expert ATS and job requirements analyzer.
Return ONLY valid JSON with this structure:
{
  "required": ["skill/requirement"],
  "preferred": ["skill/requirement"],
  "skills": ["technical skill"],
  "softSkills": ["soft skill"],
  "yearsExperience": number or null,
  "educationLevel": "string or null",
  "title": "normalized job title",
  "seniority": "junior|mid|senior|lead|executive"
}`;

    const result = await this.prompt(system, `Extract keywords from this job description:\n\n${jobDescription}`, { maxTokens: 1500, temperature: 0.1 });
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return null;
    }
  }

  async optimizeBullet(bullet, jobDescription, missingKeywords = []) {
    const system = `You are an expert resume writer. Rewrite resume bullets to be more impactful, ATS-friendly, and aligned with job requirements.
Rules:
- Start with a strong action verb
- Include metrics/numbers where reasonable
- Naturally incorporate relevant keywords
- Keep it concise (1-2 lines max)
- Maintain truthfulness - don't invent facts
- Return ONLY the improved bullet text, nothing else`;

    const user = `Original bullet: "${bullet}"
Job description summary: ${jobDescription.slice(0, 500)}
Keywords to incorporate if relevant: ${missingKeywords.slice(0, 8).join(', ')}
Rewrite:`;

    return this.prompt(system, user, { maxTokens: 200, temperature: 0.6 });
  }

  async generateSummary(resumeData, jobDescription = '') {
    const system = `You are an expert resume writer. Write a compelling professional summary.
- 3-4 sentences maximum
- Lead with years of experience and key expertise
- Highlight most relevant skills for the role
- End with value proposition
- No "I" statements, no clichés
Return ONLY the summary text.`;

    const user = `Resume data: ${JSON.stringify(resumeData, null, 2).slice(0, 1000)}
${jobDescription ? `Target job: ${jobDescription.slice(0, 400)}` : ''}
Write summary:`;

    return this.prompt(system, user, { maxTokens: 300, temperature: 0.7 });
  }

  async generateCoverLetter({ resumeData, jobTitle, company, jobDescription, tone = 'professional' }) {
    const toneGuide = {
      formal: 'formal and traditional',
      professional: 'professional and confident',
      concise: 'concise and direct, under 250 words',
      persuasive: 'persuasive and enthusiastic',
    };

    const system = `You are an expert cover letter writer. Write a ${toneGuide[tone] || 'professional'} cover letter.
Structure: Opening hook → Why this role/company → Key achievements → Call to action
Format: 3-4 short paragraphs, no headers, professional tone.
Return ONLY the cover letter text.`;

    const user = `Applicant: ${resumeData?.sections?.contact?.name || 'the applicant'}
Role: ${jobTitle} at ${company}
Key skills: ${(resumeData?.sections?.skills || []).slice(0, 10).join(', ')}
Top experience: ${(resumeData?.sections?.experience || []).slice(0, 2).map(e => `${e.role} at ${e.company}`).join('; ')}
Job description: ${jobDescription?.slice(0, 600)}
Write cover letter:`;

    return this.prompt(system, user, { maxTokens: 600, temperature: 0.8 });
  }
}

export const aiService = new AIService();
