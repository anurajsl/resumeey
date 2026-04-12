/* App Constants */

export const APP_NAME = 'Resumey';
export const APP_VERSION = '1.0.0';
export const DB_NAME = 'resumey-db';
export const DB_VERSION = 1;

// Routes
export const ROUTES = {
  WELCOME: '/welcome',
  AI_SETUP: '/onboarding/ai',
  RESUME_CREATE: '/resume/create',
  RESUME: '/resume',
  RESUME_EDIT: '/resume/edit/:section',
  JOBS: '/jobs',
  JOBS_ADD: '/jobs/add',
  JOB_DETAIL: '/jobs/:id',
  MATCH: '/match',
  MATCH_DETAIL: '/match/:jobId',
  OPTIMIZE: '/optimize/:jobId',
  ATS: '/ats/:jobId',
  COVER_LETTER: '/cover-letter/:jobId',
  EXPORT: '/export',
  SETTINGS: '/settings',
  PREMIUM: '/premium',
};

// Storage keys
export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'onboarding_complete',
  CURRENT_RESUME_ID: 'current_resume_id',
  THEME: 'theme',
};

// AI Providers
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  OPENROUTER: 'openrouter',
};

export const AI_PROVIDER_LABELS = {
  [AI_PROVIDERS.OPENAI]: 'OpenAI',
  [AI_PROVIDERS.ANTHROPIC]: 'Anthropic',
  [AI_PROVIDERS.OPENROUTER]: 'OpenRouter',
};

export const AI_DEFAULT_MODELS = {
  [AI_PROVIDERS.OPENAI]: 'gpt-4o-mini',
  [AI_PROVIDERS.ANTHROPIC]: 'claude-3-haiku-20240307',
  [AI_PROVIDERS.OPENROUTER]: 'openai/gpt-4o-mini',
};

// Resume sections
export const RESUME_SECTIONS = {
  CONTACT: 'contact',
  SUMMARY: 'summary',
  EXPERIENCE: 'experience',
  EDUCATION: 'education',
  SKILLS: 'skills',
  PROJECTS: 'projects',
  CERTIFICATIONS: 'certifications',
  AWARDS: 'awards',
};

export const SECTION_LABELS = {
  [RESUME_SECTIONS.CONTACT]: 'Contact',
  [RESUME_SECTIONS.SUMMARY]: 'Summary',
  [RESUME_SECTIONS.EXPERIENCE]: 'Experience',
  [RESUME_SECTIONS.EDUCATION]: 'Education',
  [RESUME_SECTIONS.SKILLS]: 'Skills',
  [RESUME_SECTIONS.PROJECTS]: 'Projects',
  [RESUME_SECTIONS.CERTIFICATIONS]: 'Certifications',
  [RESUME_SECTIONS.AWARDS]: 'Awards',
};

// Resume types
export const RESUME_TYPES = {
  MASTER: 'master',
  TAILORED: 'tailored',
};

// Match score weights
export const MATCH_WEIGHTS = {
  SKILLS: 0.35,
  EXPERIENCE: 0.30,
  KEYWORDS: 0.25,
  EDUCATION: 0.10,
};

// Premium
export const PREMIUM_MASTER_KEY = 'aldims119';
export const FREE_TIER_LIMITS = {
  RESUMES: 1,
  JOBS: 3,
  AI_OPTIMIZATIONS: 3,
  COVER_LETTERS: 1,
};

// ATS score thresholds
export const ATS_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 70,
  FAIR: 50,
};

// Match score thresholds
export const MATCH_THRESHOLDS = {
  GREAT: 80,
  GOOD: 60,
  FAIR: 40,
};

// Skill categories dictionary (common skills)
export const SKILL_CATEGORIES = {
  'programming': ['javascript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'typescript'],
  'web': ['react', 'vue', 'angular', 'node.js', 'express', 'html', 'css', 'sass', 'webpack', 'next.js', 'svelte'],
  'data': ['sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'pandas', 'numpy', 'tableau', 'power bi'],
  'cloud': ['aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'devops'],
  'ai_ml': ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'nlp', 'computer vision'],
  'soft': ['leadership', 'communication', 'teamwork', 'problem solving', 'agile', 'scrum', 'project management'],
  'design': ['figma', 'sketch', 'photoshop', 'illustrator', 'ux', 'ui design', 'user research'],
};

// Skill synonyms for matching
export const SKILL_SYNONYMS = {
  'javascript': ['js', 'ecmascript', 'es6'],
  'typescript': ['ts'],
  'node.js': ['nodejs', 'node'],
  'react': ['reactjs', 'react.js'],
  'python': ['py'],
  'postgresql': ['postgres', 'psql'],
  'mongodb': ['mongo'],
  'kubernetes': ['k8s'],
  'ci/cd': ['continuous integration', 'continuous deployment', 'github actions', 'jenkins', 'gitlab ci'],
  'machine learning': ['ml', 'ai/ml'],
  'user experience': ['ux'],
  'user interface': ['ui'],
};

// Education degree levels (higher = better match for senior roles)
export const DEGREE_LEVELS = {
  'phd': 5,
  'doctorate': 5,
  'master': 4,
  'masters': 4,
  'mba': 4,
  'bachelor': 3,
  'bachelors': 3,
  'bs': 3,
  'ba': 3,
  'associate': 2,
  'diploma': 1,
  'certificate': 1,
};
