/* Repository Pattern for Data Access */

import { dbGet, dbGetAll, dbPut, dbDelete, dbClear, dbCount } from './database.js';
import { shortId } from '../utils/formatters.js';
import { encrypt, decrypt } from '../utils/crypto.js';

/* ============================
   Resume Repository
   ============================ */

export const ResumeRepo = {
  async create(data) {
    const resume = {
      id: data.id || shortId(),
      name: data.name || 'My Resume',
      type: data.type || 'master',
      parentId: data.parentId || null,
      sections: data.sections || {
        contact: {},
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        awards: [],
      },
      metadata: data.metadata || {
        sourceType: 'scratch',
        parseConfidence: 1,
        version: 1,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dbPut('resumes', resume);
    return resume;
  },

  async get(id) {
    return dbGet('resumes', id);
  },

  async getAll() {
    const all = await dbGetAll('resumes');
    return all.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  async getMaster() {
    const all = await dbGetAll('resumes', 'type', 'master');
    return all[0] || null;
  },

  async getTailored(parentId) {
    return dbGetAll('resumes', 'parentId', parentId);
  },

  async update(id, updates) {
    const existing = await dbGet('resumes', id);
    if (!existing) throw new Error(`Resume ${id} not found`);
    const updated = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...existing.metadata,
        ...(updates.metadata || {}),
        version: (existing.metadata?.version || 0) + 1,
      },
    };
    await dbPut('resumes', updated);
    return updated;
  },

  async updateSection(id, section, data) {
    const resume = await dbGet('resumes', id);
    if (!resume) throw new Error(`Resume ${id} not found`);
    resume.sections[section] = data;
    resume.updatedAt = new Date().toISOString();
    await dbPut('resumes', resume);
    return resume;
  },

  async delete(id) {
    return dbDelete('resumes', id);
  },

  async count() {
    return dbCount('resumes');
  },

  async clear() {
    return dbClear('resumes');
  },
};

/* ============================
   Job Repository
   ============================ */

export const JobRepo = {
  async create(data) {
    const job = {
      id: data.id || shortId(),
      title: data.title || '',
      company: data.company || '',
      location: data.location || '',
      description: data.description || '',
      keywords: data.keywords || {
        required: [],
        preferred: [],
        skills: [],
        softSkills: [],
      },
      matchResult: data.matchResult || null,
      atsResult: data.atsResult || null,
      coverLetter: data.coverLetter || null,
      optimizationResult: data.optimizationResult || null,
      notes: data.notes || '',
      status: data.status || 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dbPut('jobs', job);
    return job;
  },

  async get(id) {
    return dbGet('jobs', id);
  },

  async getAll() {
    const all = await dbGetAll('jobs');
    return all.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  async update(id, updates) {
    const existing = await dbGet('jobs', id);
    if (!existing) throw new Error(`Job ${id} not found`);
    const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await dbPut('jobs', updated);
    return updated;
  },

  async delete(id) {
    return dbDelete('jobs', id);
  },

  async count() {
    return dbCount('jobs');
  },

  async clear() {
    return dbClear('jobs');
  },
};

/* ============================
   Settings Repository
   ============================ */

export const SettingsRepo = {
  async get(key) {
    const record = await dbGet('settings', key);
    return record?.value;
  },

  async set(key, value) {
    await dbPut('settings', { key, value });
  },

  async getAll() {
    const all = await dbGetAll('settings');
    const result = {};
    all.forEach(r => { result[r.key] = r.value; });
    return result;
  },

  async getAIConfig() {
    const record = await dbGet('settings', 'ai_config');
    if (!record?.value) return null;
    const cfg = { ...record.value };
    if (cfg.encryptedKey) {
      cfg.apiKey = await decrypt(cfg.encryptedKey);
      delete cfg.encryptedKey;
    }
    return cfg;
  },

  async saveAIConfig(config) {
    const toStore = { ...config };
    if (config.apiKey) {
      toStore.encryptedKey = await encrypt(config.apiKey);
      delete toStore.apiKey;
    }
    await dbPut('settings', { key: 'ai_config', value: toStore });
  },

  async getPremium() {
    return (await dbGet('settings', 'premium'))?.value || { isActive: false, tier: 'free' };
  },

  async setPremium(data) {
    await dbPut('settings', { key: 'premium', value: data });
  },

  async getPreferences() {
    return (await dbGet('settings', 'preferences'))?.value || {
      theme: 'auto',
      onboardingComplete: false,
    };
  },

  async setPreferences(prefs) {
    const current = await this.getPreferences();
    await dbPut('settings', { key: 'preferences', value: { ...current, ...prefs } });
  },

  async clearAll() {
    return dbClear('settings');
  },
};

/* ============================
   Audit Log
   ============================ */

/* ============================
   Story Repository
   ============================ */

export const StoryRepo = {
  async create(data) {
    const story = {
      id: data.id || shortId(),
      title: data.title || '',
      situation: data.situation || '',
      task: data.task || '',
      action: data.action || '',
      result: data.result || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dbPut('stories', story);
    return story;
  },

  async get(id) {
    return dbGet('stories', id);
  },

  async getAll() {
    const all = await dbGetAll('stories');
    return all.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  async getByTags(tags = []) {
    if (!tags.length) return this.getAll();
    const all = await this.getAll();
    const lower = tags.map(t => t.toLowerCase());
    return all.filter(s => s.tags.some(t => lower.includes(t.toLowerCase())));
  },

  async update(id, updates) {
    const existing = await dbGet('stories', id);
    if (!existing) throw new Error(`Story ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await dbPut('stories', updated);
    return updated;
  },

  async delete(id) {
    return dbDelete('stories', id);
  },

  async clear() {
    return dbClear('stories');
  },
};

export const AuditRepo = {
  async log(type, data) {
    await dbPut('audit', {
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  },

  async getRecent(count = 50) {
    const all = await dbGetAll('audit');
    return all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, count);
  },

  async clear() {
    return dbClear('audit');
  },
};
