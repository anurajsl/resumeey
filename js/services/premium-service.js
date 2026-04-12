/* Premium Service - License Validation & Feature Gating */

import { SettingsRepo } from '../db/repositories.js';
import { PREMIUM_MASTER_KEY, FREE_TIER_LIMITS } from '../utils/constants.js';
import { store } from '../state.js';
import { events, EVENTS } from '../events.js';

export const PremiumService = {
  async load() {
    const premium = await SettingsRepo.getPremium();
    store.set('premium', premium);
    return premium;
  },

  async isActive() {
    const premium = store.get('premium');
    return premium?.isActive === true;
  },

  async validateKey(key) {
    if (!key || typeof key !== 'string') return false;
    return key.trim() === PREMIUM_MASTER_KEY;
  },

  async activate(licenseKey) {
    const valid = await this.validateKey(licenseKey);
    if (!valid) throw new Error('Invalid license key. Please check and try again.');

    const premium = {
      isActive: true,
      tier: 'premium',
      licenseKey: licenseKey.trim(),
      activatedAt: new Date().toISOString(),
    };

    await SettingsRepo.setPremium(premium);
    store.set('premium', premium);
    events.emit(EVENTS.PREMIUM_ACTIVATED, premium);
    return premium;
  },

  async deactivate() {
    const premium = { isActive: false, tier: 'free' };
    await SettingsRepo.setPremium(premium);
    store.set('premium', premium);
  },

  async checkFeature(feature) {
    const active = await this.isActive();
    if (active) return { allowed: true };

    const limits = {
      'multiple_resumes':   { allowed: false, message: 'Upgrade to Premium for unlimited resumes' },
      'multiple_jobs':      { allowed: true },
      'ai_optimization':    { allowed: true, message: 'Limited to 3 optimizations/month on free tier' },
      'cover_letter':       { allowed: true, message: 'Limited to 1 cover letter/month on free tier' },
      'advanced_ats':       { allowed: false, message: 'Advanced ATS analysis requires Premium' },
      'premium_templates':  { allowed: false, message: 'Premium templates require an upgrade' },
      'export_no_watermark':{ allowed: false, message: 'Clean PDF export requires Premium' },
    };

    return limits[feature] || { allowed: true };
  },

  async canCreateResume() {
    if (await this.isActive()) return true;
    const { ResumeRepo } = await import('../db/repositories.js');
    const count = await ResumeRepo.count();
    return count < FREE_TIER_LIMITS.RESUMES;
  },

  async canAddJob() {
    if (await this.isActive()) return true;
    const { JobRepo } = await import('../db/repositories.js');
    const count = await JobRepo.count();
    return count < FREE_TIER_LIMITS.JOBS;
  },
};
