/* Resume Parse Orchestrator */

import { aiService } from './ai-service.js';
import { parsePDF } from './pdf-parser.js';
import { parseDOCX } from './docx-parser.js';
import { parseLinkedIn } from './linkedin-parser.js';
import { parseResumeText as parseResumeTextLocal } from './linkedin-parser.js';

export async function parseFile(file) {
  const ext = file.name?.split('.').pop()?.toLowerCase();

  let text = '';
  if (ext === 'pdf') {
    text = await parsePDF(file);
  } else if (ext === 'docx' || ext === 'doc') {
    text = await parseDOCX(file);
  } else if (ext === 'txt') {
    text = await file.text();
  } else {
    throw new Error('Unsupported file format. Please upload PDF or DOCX.');
  }

  if (!text || text.trim().length < 50) {
    throw new Error('Could not extract text from file. Please try a different file.');
  }

  return parseText(text, 'file');
}

export async function parseLinkedInContent(text) {
  if (!text || text.trim().length < 50) {
    throw new Error('Please paste more content for parsing.');
  }
  return parseText(text, 'linkedin');
}

export async function parseText(text, sourceType = 'text') {
  // Try AI parsing first
  const aiAvailable = await aiService.isAvailable();

  if (aiAvailable) {
    try {
      const parsed = await aiService.parseResumeText(text);
      if (parsed && parsed.contact?.name) {
        return {
          ...parsed,
          metadata: { sourceType, parseConfidence: 0.9 },
        };
      }
    } catch (err) {
      console.warn('AI parsing failed, falling back to local parser:', err.message);
    }
  }

  // Local fallback
  const parsed = parseLinkedIn(text);
  return {
    ...parsed,
    metadata: { sourceType, parseConfidence: 0.65 },
  };
}

export { parseResumeTextLocal };
