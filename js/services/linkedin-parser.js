/* LinkedIn & Plain Text Resume Parser (local regex-based) */

export function parseLinkedIn(text) {
  if (!text) return emptyResume();

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result = emptyResume();

  // Extract contact info
  result.contact = extractContact(text, lines);

  // Extract summary
  result.summary = extractSummary(text, lines);

  // Extract experience
  result.experience = extractExperience(text, lines);

  // Extract education
  result.education = extractEducation(text, lines);

  // Extract skills
  result.skills = extractSkills(text, lines);

  // Extract certifications
  result.certifications = extractCertifications(text, lines);

  return result;
}

function emptyResume() {
  return {
    contact: {},
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    awards: [],
  };
}

function extractContact(text, lines) {
  const contact = {};

  // Email
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) contact.email = emailMatch[0];

  // Phone
  const phoneMatch = text.match(/(\+?[\d\s\-().]{10,20})/);
  if (phoneMatch) contact.phone = phoneMatch[0].trim();

  // LinkedIn URL
  const linkedinMatch = text.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/i);
  if (linkedinMatch) contact.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;

  // Website/GitHub
  const websiteMatch = text.match(/https?:\/\/(?!linkedin)[^\s]+/);
  if (websiteMatch) contact.website = websiteMatch[0];

  // Location (rough)
  const locationPatterns = [
    /([A-Z][a-z]+(?:,\s*[A-Z]{2})?(?:,\s*[A-Z][a-z]+)?)/,
    /([A-Z][a-z]+,\s*[A-Z][a-z]+,\s*[A-Z][a-z]+)/,
  ];
  for (const pat of locationPatterns) {
    const m = text.match(pat);
    if (m) { contact.location = m[0]; break; }
  }

  // Name: usually the first non-email, non-phone line
  for (const line of lines.slice(0, 5)) {
    if (!/[@\d()+\-.]/.test(line) && line.split(' ').length >= 2 && line.length < 60) {
      contact.name = line;
      break;
    }
  }

  return contact;
}

function extractSummary(text, lines) {
  const summaryHeaders = /^(summary|about|profile|objective|professional summary|about me)/i;
  const idx = lines.findIndex(l => summaryHeaders.test(l));
  if (idx === -1) return '';

  const summaryLines = [];
  for (let i = idx + 1; i < lines.length && i < idx + 8; i++) {
    const line = lines[i];
    if (/^(experience|education|skills|work history|employment)/i.test(line)) break;
    summaryLines.push(line);
  }

  return summaryLines.join(' ').trim();
}

function extractExperience(text, lines) {
  const expHeaders = /^(experience|work experience|work history|employment|professional experience)/i;
  const stopHeaders = /^(education|skills|certifications|awards|projects|languages)/i;
  const datePattern = /(\w+ \d{4}|\d{4})\s*[-–—]\s*(present|\w+ \d{4}|\d{4})/i;

  const startIdx = lines.findIndex(l => expHeaders.test(l));
  if (startIdx === -1) return tryInferExperience(lines);

  const stopIdx = lines.findIndex((l, i) => i > startIdx && stopHeaders.test(l));
  const section = lines.slice(startIdx + 1, stopIdx === -1 ? lines.length : stopIdx);

  const experiences = [];
  let current = null;

  for (const line of section) {
    const dateMatch = line.match(datePattern);

    if (dateMatch) {
      if (current) experiences.push(current);
      const [start, end] = parseDateRange(dateMatch[0]);
      current = {
        role: '',
        company: '',
        startDate: start,
        endDate: end === 'present' ? null : end,
        isCurrent: end?.toLowerCase() === 'present',
        location: '',
        bullets: [],
      };
      // Try to extract role/company from nearby lines
      const lineIdx = section.indexOf(line);
      if (lineIdx > 0) current.role = section[lineIdx - 1];
      if (lineIdx > 1) current.company = section[lineIdx - 2];
    } else if (current) {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('·')) {
        current.bullets.push(line.replace(/^[•\-·]\s*/, '').trim());
      } else if (!current.role) {
        current.role = line;
      } else if (!current.company) {
        current.company = line;
      } else if (line.length > 30) {
        current.bullets.push(line);
      }
    }
  }

  if (current) experiences.push(current);
  return experiences.filter(e => e.role || e.company);
}

function tryInferExperience(lines) {
  const datePattern = /(\w+ \d{4}|\d{4})\s*[-–—]\s*(present|\w+ \d{4}|\d{4})/i;
  const experiences = [];

  lines.forEach((line, i) => {
    if (datePattern.test(line)) {
      const [start, end] = parseDateRange(line.match(datePattern)[0]);
      experiences.push({
        role: lines[i - 1] || '',
        company: lines[i - 2] || '',
        startDate: start,
        endDate: end === 'present' ? null : end,
        isCurrent: end?.toLowerCase() === 'present',
        location: '',
        bullets: [],
      });
    }
  });

  return experiences;
}

function parseDateRange(str) {
  const parts = str.split(/[-–—]/);
  return [
    parseMonthYear(parts[0]?.trim()),
    parseMonthYear(parts[1]?.trim()),
  ];
}

const MONTHS = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function parseMonthYear(str) {
  if (!str) return null;
  if (/present/i.test(str)) return 'present';
  const yearMatch = str.match(/\d{4}/);
  if (!yearMatch) return null;
  const year = yearMatch[0];
  const monthMatch = str.match(/[a-z]+/i);
  if (monthMatch) {
    const month = MONTHS[monthMatch[0].slice(0, 3).toLowerCase()] || '01';
    return `${year}-${month}`;
  }
  return year + '-01';
}

function extractEducation(text, lines) {
  const headers = /^(education|academic|qualifications)/i;
  const stopHeaders = /^(skills|certifications|awards|projects|experience|languages)/i;

  const startIdx = lines.findIndex(l => headers.test(l));
  if (startIdx === -1) return [];

  const stopIdx = lines.findIndex((l, i) => i > startIdx && stopHeaders.test(l));
  const section = lines.slice(startIdx + 1, stopIdx === -1 ? lines.length : stopIdx);

  const education = [];
  let current = null;

  const degreePattern = /(bachelor|master|phd|doctorate|associate|b\.s|b\.a|m\.s|m\.a|mba|b\.eng|m\.eng)/i;

  for (const line of section) {
    if (degreePattern.test(line)) {
      if (current) education.push(current);
      current = {
        degree: line,
        field: '',
        institution: '',
        location: '',
        graduationDate: null,
        gpa: null,
      };
    } else if (current) {
      const yearMatch = line.match(/\d{4}/);
      if (yearMatch && !current.graduationDate) {
        current.graduationDate = yearMatch[0] + '-06';
      } else if (!current.institution) {
        current.institution = line;
      } else if (line.toLowerCase().includes('gpa')) {
        const gpa = line.match(/\d+\.\d+/);
        if (gpa) current.gpa = gpa[0];
      }
    }
  }

  if (current) education.push(current);
  return education;
}

function extractSkills(text, lines) {
  const headers = /^(skills|technical skills|core competencies|technologies|tools)/i;
  const stopHeaders = /^(experience|education|certifications|awards|projects|summary)/i;

  const startIdx = lines.findIndex(l => headers.test(l));
  if (startIdx === -1) return inferSkillsFromText(text);

  const stopIdx = lines.findIndex((l, i) => i > startIdx && stopHeaders.test(l));
  const section = lines.slice(startIdx + 1, stopIdx === -1 ? Math.min(startIdx + 20, lines.length) : stopIdx);

  const skills = [];
  for (const line of section) {
    // Parse comma-separated, bullet-separated, or pipe-separated
    const parts = line.split(/[,|•·\t]/).map(s => s.replace(/^[-\s]+/, '').trim()).filter(s => s.length > 1 && s.length < 40);
    skills.push(...parts);
  }

  return [...new Set(skills)].filter(s => s);
}

function inferSkillsFromText(text) {
  // Dynamic import not available in sync context — return empty, caller should use keyword-extractor separately
  return [];
}

function extractCertifications(text, lines) {
  const headers = /^(certifications?|licenses?|credentials|professional development)/i;
  const stopHeaders = /^(experience|education|skills|awards|projects)/i;

  const startIdx = lines.findIndex(l => headers.test(l));
  if (startIdx === -1) return [];

  const stopIdx = lines.findIndex((l, i) => i > startIdx && stopHeaders.test(l));
  const section = lines.slice(startIdx + 1, stopIdx === -1 ? Math.min(startIdx + 10, lines.length) : stopIdx);

  return section
    .filter(l => l.length > 5 && l.length < 100)
    .map(name => ({ name, issuer: '', date: null }));
}

// Export alias
export function parseResumeText(text) {
  return parseLinkedIn(text);
}
