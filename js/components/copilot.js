/* Resumey Copilot — AI assistant with context awareness, voice input, and auto-apply */

import { ResumeRepo, JobRepo } from '../db/repositories.js';
import { aiService } from '../services/ai-service.js';
import { scoreMatch } from '../services/match-engine.js';
import { analyzeATS } from '../services/ats-analyzer.js';
import { applyOptimizations } from '../services/optimizer-service.js';
import { toast } from './toast.js';
import { events, EVENTS } from '../events.js';
import { router } from '../router.js';

// Module state
let isOpen = false;
let isListening = false;
let isSending = false;
let chatHistory = []; // { role: 'user'|'assistant', content: string }
let currentJobId = null;
let recognition = null;
let aiAvailable = false;

const QUICK_PROMPTS = [
  { label: 'Improve my resume', prompt: 'Analyze my resume and give me the top 3 specific improvements I can make right now.' },
  { label: 'Match this job', prompt: 'How well does my resume match the current job? What should I change to improve my chances?' },
  { label: 'Fix ATS issues', prompt: 'What ATS issues does my resume have and how do I fix them?' },
  { label: 'Add missing skills', prompt: 'What missing skills from the job description should I add to my resume, and where?' },
];

export function initCopilot() {
  injectHTML();
  setupEvents();
  setupVoiceInput();

  // Track current job from route
  events.on(EVENTS.ROUTE_CHANGE, (route) => {
    const m = route.path.match(/\/(match|optimize|ats|cover-letter|jobs)\/([^/]+)/);
    currentJobId = m ? m[2] : null;
    updateContextBadge();
  });

  // Check AI availability
  aiService.isAvailable().then(v => {
    aiAvailable = v;
    updateFabState();
  });
}

// ─── HTML Injection ─────────────────────────────────────────────────────────

function injectHTML() {
  // FAB
  const fab = document.createElement('button');
  fab.id = 'copilot-fab';
  fab.className = 'copilot-fab';
  fab.setAttribute('aria-label', 'Open Resumey Copilot');
  fab.title = 'Resumey Copilot';
  fab.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <circle cx="8.5" cy="10" r=".5" fill="currentColor"/>
      <circle cx="12" cy="10" r=".5" fill="currentColor"/>
      <circle cx="15.5" cy="10" r=".5" fill="currentColor"/>
    </svg>
    <span class="copilot-fab-label">Copilot</span>
    <span class="copilot-context-badge" id="copilot-context-badge" style="display:none"></span>
  `;
  document.body.appendChild(fab);

  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'copilot-backdrop';
  backdrop.className = 'copilot-backdrop';
  document.body.appendChild(backdrop);

  // Panel
  const panel = document.createElement('div');
  panel.id = 'copilot-panel';
  panel.className = 'copilot-panel';
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <div class="copilot-drag-handle"></div>

    <div class="copilot-header">
      <div class="copilot-header-left">
        <div class="copilot-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div>
          <div class="copilot-title">Resumey Copilot</div>
          <div class="copilot-subtitle" id="copilot-context-line">Loading context…</div>
        </div>
      </div>
      <button class="copilot-close btn-icon" id="copilot-close" aria-label="Close Copilot">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="copilot-messages" id="copilot-messages">
      <div class="copilot-welcome" id="copilot-welcome">
        <div class="copilot-welcome-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <p class="copilot-welcome-text">Hi! I'm your resume assistant. I can help you improve your resume, increase your match score, and fix ATS issues.</p>
        <div class="copilot-quick-prompts" id="copilot-quick-prompts">
          ${QUICK_PROMPTS.map(p => `<button class="copilot-quick-btn" data-prompt="${p.prompt}">${p.label}</button>`).join('')}
        </div>
      </div>
    </div>

    <div class="copilot-input-area">
      <div id="copilot-no-ai-banner" class="copilot-no-ai" style="display:none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        No AI key configured.
        <button class="copilot-setup-link" id="copilot-setup-ai">Set up AI →</button>
      </div>
      <div class="copilot-input-row">
        <div class="copilot-input-wrap">
          <textarea
            id="copilot-input"
            class="copilot-textarea"
            placeholder="Ask me anything about your resume…"
            rows="1"
            maxlength="1000"
          ></textarea>
        </div>
        <button class="copilot-mic-btn" id="copilot-mic" aria-label="Voice input" title="Voice input">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="copilot-mic-icon"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </button>
        <button class="copilot-send-btn" id="copilot-send" aria-label="Send message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
}

// ─── Events ─────────────────────────────────────────────────────────────────

function setupEvents() {
  const fab = document.getElementById('copilot-fab');
  const backdrop = document.getElementById('copilot-backdrop');
  const closeBtn = document.getElementById('copilot-close');
  const sendBtn = document.getElementById('copilot-send');
  const input = document.getElementById('copilot-input');
  const setupAiBtn = document.getElementById('copilot-setup-ai');

  fab.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  backdrop.addEventListener('click', closePanel);
  closeBtn.addEventListener('click', closePanel);

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  // Quick prompts
  document.getElementById('copilot-quick-prompts').addEventListener('click', (e) => {
    const btn = e.target.closest('.copilot-quick-btn');
    if (!btn) return;
    input.value = btn.dataset.prompt;
    handleSend();
  });

  setupAiBtn?.addEventListener('click', () => {
    closePanel();
    router.navigate('/onboarding/ai');
  });
}

async function openPanel() {
  isOpen = true;
  const panel = document.getElementById('copilot-panel');
  const backdrop = document.getElementById('copilot-backdrop');
  const fab = document.getElementById('copilot-fab');

  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  backdrop.classList.add('visible');
  fab.classList.add('active');

  // Load context and update header
  await refreshContextLine();

  // Check AI
  aiAvailable = await aiService.isAvailable();
  updateFabState();
  document.getElementById('copilot-no-ai-banner').style.display = aiAvailable ? 'none' : 'flex';
  document.getElementById('copilot-send').disabled = !aiAvailable;
  document.getElementById('copilot-mic').disabled = !aiAvailable;

  // Focus input
  setTimeout(() => document.getElementById('copilot-input')?.focus(), 300);
}

function closePanel() {
  isOpen = false;
  const panel = document.getElementById('copilot-panel');
  const backdrop = document.getElementById('copilot-backdrop');
  const fab = document.getElementById('copilot-fab');

  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  backdrop.classList.remove('visible');
  fab.classList.remove('active');
}

function updateFabState() {
  const fab = document.getElementById('copilot-fab');
  if (!fab) return;
  fab.classList.toggle('no-ai', !aiAvailable);
}

async function updateContextBadge() {
  const badge = document.getElementById('copilot-context-badge');
  if (!badge) return;
  if (currentJobId) {
    try {
      const job = await JobRepo.get(currentJobId);
      if (job) {
        badge.textContent = job.title?.slice(0, 12) + (job.title?.length > 12 ? '…' : '');
        badge.style.display = 'flex';
        return;
      }
    } catch (_) {}
  }
  badge.style.display = 'none';
}

async function refreshContextLine() {
  const line = document.getElementById('copilot-context-line');
  if (!line) return;

  const parts = [];
  try {
    const resume = await ResumeRepo.getMaster();
    if (resume?.sections?.contact?.name) parts.push(resume.sections.contact.name);
    else parts.push('Resume loaded');
  } catch (_) { parts.push('No resume'); }

  if (currentJobId) {
    try {
      const job = await JobRepo.get(currentJobId);
      if (job) parts.push(job.title + (job.company ? ` @ ${job.company}` : ''));
    } catch (_) {}
  }

  line.textContent = parts.join(' · ');
}

// ─── Voice Input ─────────────────────────────────────────────────────────────

function setupVoiceInput() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.getElementById('copilot-mic');
  const micIcon = document.getElementById('copilot-mic-icon');
  const input = document.getElementById('copilot-input');

  if (!SpeechRec) {
    if (micBtn) micBtn.style.display = 'none';
    return;
  }

  recognition = new SpeechRec();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    input.placeholder = 'Listening…';
  };

  recognition.onresult = (e) => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    input.value = transcript;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    input.placeholder = 'Ask me anything about your resume…';
  };

  recognition.onerror = (e) => {
    isListening = false;
    micBtn.classList.remove('listening');
    input.placeholder = 'Ask me anything about your resume…';
    if (e.error !== 'no-speech') toast.error('Voice error: ' + e.error);
  };

  micBtn.addEventListener('click', () => {
    if (isListening) { recognition.stop(); return; }
    try { recognition.start(); } catch (_) {}
  });
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

async function handleSend() {
  const input = document.getElementById('copilot-input');
  const text = input.value.trim();
  if (!text || isSending) return;
  if (!aiAvailable) { toast.warning('Set up an AI key in Settings first'); return; }

  // Clear input
  input.value = '';
  input.style.height = 'auto';

  // Hide welcome
  document.getElementById('copilot-welcome').style.display = 'none';

  // Add user bubble
  appendMessage('user', text);
  chatHistory.push({ role: 'user', content: text });

  // Thinking bubble
  const thinkingId = appendThinking();
  isSending = true;
  document.getElementById('copilot-send').disabled = true;

  try {
    const context = await buildContext();
    const systemPrompt = buildSystemPrompt(context);
    const aiResponse = await aiService.chat(systemPrompt, chatHistory.slice(-8));

    removeThinking(thinkingId);
    chatHistory.push({ role: 'assistant', content: aiResponse });

    const { message, changes } = parseResponse(aiResponse);
    appendAssistantMessage(message, changes, context);
  } catch (err) {
    removeThinking(thinkingId);
    appendMessage('error', 'Something went wrong: ' + err.message);
  } finally {
    isSending = false;
    document.getElementById('copilot-send').disabled = false;
    input.focus();
  }
}

// ─── Context Building ─────────────────────────────────────────────────────────

async function buildContext() {
  const ctx = {};

  // Resume
  try {
    ctx.resume = await ResumeRepo.getMaster();
  } catch (_) {}

  // Job
  if (currentJobId) {
    try {
      const job = await JobRepo.get(currentJobId);
      ctx.job = job;
      ctx.matchResult = job?.matchResult;
      ctx.atsResult = job?.atsResult;

      // Compute fresh if not cached
      if (ctx.resume && !ctx.matchResult) {
        ctx.matchResult = scoreMatch(ctx.resume, job?.keywords || {});
      }
      if (ctx.resume && !ctx.atsResult) {
        ctx.atsResult = analyzeATS(ctx.resume, job?.keywords || {});
      }
    } catch (_) {}
  }

  return ctx;
}

function buildSystemPrompt(ctx) {
  const lines = [
    'You are Resumey Copilot, an expert career coach and resume optimizer.',
    'You help users improve their resume to get more job interviews.',
    'Be specific, actionable, and concise. No fluff.',
    '',
  ];

  // Resume
  if (ctx.resume?.sections) {
    const s = ctx.resume.sections;
    const c = s.contact || {};
    lines.push(`== CANDIDATE: ${c.name || 'Unknown'} ==`);
    if (s.summary) lines.push(`Summary: ${s.summary}`);

    if (s.experience?.length) {
      lines.push('Experience:');
      s.experience.slice(0, 4).forEach(e => {
        lines.push(`  - ${e.role} at ${e.company} (${e.startDate || '?'} - ${e.isCurrent ? 'Present' : e.endDate || '?'})`);
        (e.bullets || []).slice(0, 3).forEach(b => lines.push(`    • ${b}`));
      });
    }

    if (s.skills?.length) {
      const skillNames = s.skills.map(sk => typeof sk === 'string' ? sk : sk.name).filter(Boolean);
      lines.push(`Skills: ${skillNames.slice(0, 20).join(', ')}`);
    }

    if (s.education?.length) {
      const edu = s.education[0];
      lines.push(`Education: ${edu.degree}${edu.field ? ' in ' + edu.field : ''} — ${edu.institution}`);
    }
  } else {
    lines.push('No resume data available yet.');
  }

  // Job
  if (ctx.job) {
    lines.push('', `== TARGET JOB: ${ctx.job.title}${ctx.job.company ? ' at ' + ctx.job.company : ''} ==`);
    if (ctx.job.description) {
      lines.push(`Description (excerpt): ${ctx.job.description.slice(0, 600)}…`);
    }
    const kw = ctx.job.keywords || {};
    if (kw.required?.length) lines.push(`Required keywords: ${kw.required.slice(0, 10).join(', ')}`);
    if (kw.skills?.length) lines.push(`Required skills: ${kw.skills.slice(0, 10).join(', ')}`);
  }

  // Scores
  if (ctx.matchResult) {
    lines.push('', `== SCORES ==`);
    lines.push(`Overall match: ${Math.round(ctx.matchResult.overallScore)}%`);
    lines.push(`Skills: ${Math.round(ctx.matchResult.skillMatch)}%, Experience: ${Math.round(ctx.matchResult.experienceMatch)}%, Keywords: ${Math.round(ctx.matchResult.keywordMatch)}%`);
    if (ctx.matchResult.missingKeywords?.length) {
      lines.push(`Missing keywords: ${ctx.matchResult.missingKeywords.slice(0, 10).join(', ')}`);
    }
  }

  if (ctx.atsResult) {
    lines.push(`ATS score: ${Math.round(ctx.atsResult.overallScore)}%`);
    const highIssues = (ctx.atsResult.issues || []).filter(i => i.severity === 'high').map(i => i.text);
    if (highIssues.length) lines.push(`Critical ATS issues: ${highIssues.join('; ')}`);
  }

  lines.push('', '== INSTRUCTIONS ==');
  lines.push('Respond conversationally but be specific. Keep total response under 250 words.');
  lines.push('When suggesting resume changes, use this format for each change (at end of response):');
  lines.push('[CHANGE:summary] new text [/CHANGE]');
  lines.push('[CHANGE:experience|role=JobTitle|company=CompanyName|bullet=original text] improved bullet [/CHANGE]');
  lines.push('[CHANGE:skills|add=Skill1,Skill2,Skill3] [/CHANGE]');
  lines.push('Only include CHANGE blocks when you have concrete text to suggest.');

  return lines.join('\n');
}

// ─── Response Parsing ─────────────────────────────────────────────────────────

function parseResponse(raw) {
  const changes = [];
  const changeRegex = /\[CHANGE:([^\]]+)\]([\s\S]*?)\[\/CHANGE\]/gi;

  let match;
  while ((match = changeRegex.exec(raw)) !== null) {
    const [, spec, content] = match;
    const params = parseSpec(spec);
    changes.push({ ...params, content: content.trim() });
  }

  // Strip change blocks from visible message
  const message = raw.replace(changeRegex, '').replace(/\n{3,}/g, '\n\n').trim();
  return { message, changes };
}

function parseSpec(spec) {
  const parts = spec.split('|');
  const type = parts[0].trim();
  const params = { type };
  parts.slice(1).forEach(p => {
    const [k, ...v] = p.split('=');
    params[k.trim()] = v.join('=').trim();
  });
  return params;
}

// ─── Rendering ─────────────────────────────────────────────────────────────────

function appendMessage(role, text) {
  const el = document.createElement('div');
  el.className = `copilot-message copilot-message--${role}`;
  el.innerHTML = `<div class="copilot-bubble">${escHtml(text)}</div>`;
  getMessagesEl().appendChild(el);
  scrollToBottom();
  return el;
}

function appendThinking(id) {
  const uid = 'think-' + Date.now();
  const el = document.createElement('div');
  el.className = 'copilot-message copilot-message--assistant';
  el.id = uid;
  el.innerHTML = `<div class="copilot-bubble copilot-thinking"><span></span><span></span><span></span></div>`;
  getMessagesEl().appendChild(el);
  scrollToBottom();
  return uid;
}

function removeThinking(id) {
  document.getElementById(id)?.remove();
}

function appendAssistantMessage(message, changes, context) {
  const el = document.createElement('div');
  el.className = 'copilot-message copilot-message--assistant';

  let html = `<div class="copilot-bubble">${formatMessage(message)}</div>`;

  if (changes.length > 0) {
    html += `<div class="copilot-changes">`;
    changes.forEach((change, i) => {
      html += renderChangeBlock(change, i);
    });
    html += `</div>`;
  }

  el.innerHTML = html;

  // Bind apply buttons
  el.querySelectorAll('.copilot-apply-btn').forEach(btn => {
    const idx = parseInt(btn.dataset.idx);
    btn.addEventListener('click', () => applyChange(changes[idx], btn, context));
  });

  getMessagesEl().appendChild(el);
  scrollToBottom();
}

function renderChangeBlock(change, idx) {
  let title = '';
  let preview = '';

  if (change.type === 'summary') {
    title = 'Update Summary';
    preview = change.content.slice(0, 120) + (change.content.length > 120 ? '…' : '');
  } else if (change.type === 'experience') {
    title = `Update Experience — ${change.role || ''}${change.company ? ' @ ' + change.company : ''}`;
    preview = change.content.slice(0, 120) + (change.content.length > 120 ? '…' : '');
  } else if (change.type === 'skills') {
    title = `Add Skills: ${change.add || ''}`;
    preview = change.add || '';
  } else {
    title = `Update ${change.type}`;
    preview = change.content?.slice(0, 100) || '';
  }

  return `
    <div class="copilot-change-block" data-idx="${idx}">
      <div class="copilot-change-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        ${escHtml(title)}
      </div>
      <div class="copilot-change-preview">${escHtml(preview)}</div>
      <button class="copilot-apply-btn btn btn-sm btn-primary" data-idx="${idx}">Apply change</button>
    </div>
  `;
}

// ─── Apply Changes ─────────────────────────────────────────────────────────────

async function applyChange(change, btn, context) {
  btn.disabled = true;
  btn.textContent = 'Applying…';

  try {
    const resume = await ResumeRepo.getMaster();
    if (!resume) throw new Error('No resume found');

    const sections = JSON.parse(JSON.stringify(resume.sections || {}));

    if (change.type === 'summary') {
      sections.summary = change.content;

    } else if (change.type === 'experience') {
      const exp = sections.experience || [];
      const target = exp.find(e =>
        (!change.role || e.role?.toLowerCase().includes(change.role.toLowerCase())) &&
        (!change.company || e.company?.toLowerCase().includes(change.company.toLowerCase()))
      );

      if (target) {
        if (change.bullet) {
          // Replace specific bullet
          const bIdx = (target.bullets || []).findIndex(b =>
            b.toLowerCase().includes((change.bullet || '').toLowerCase().slice(0, 30))
          );
          if (bIdx > -1) {
            target.bullets[bIdx] = change.content;
          } else {
            target.bullets = [...(target.bullets || []), change.content];
          }
        } else {
          // Replace all bullets with the new content (split by newlines)
          const newBullets = change.content.split('\n').map(l => l.replace(/^[•\-]\s*/, '').trim()).filter(Boolean);
          if (newBullets.length) target.bullets = newBullets;
        }
      }

    } else if (change.type === 'skills') {
      const newSkills = (change.add || '').split(',').map(s => s.trim()).filter(Boolean);
      const existing = (sections.skills || []).map(s => typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase());
      const toAdd = newSkills.filter(s => !existing.includes(s.toLowerCase()));
      sections.skills = [...(sections.skills || []), ...toAdd];
    }

    await ResumeRepo.update(resume.id, { sections });

    // Invalidate cached scores so they re-run
    if (context?.job?.id) {
      await JobRepo.update(context.job.id, { matchResult: null, atsResult: null });
    }

    btn.textContent = '✓ Applied';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-success');

    toast.success(`Applied! ${context?.job ? 'Scores will refresh on next view.' : 'Resume updated.'}`);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Apply change';
    toast.error('Failed to apply: ' + err.message);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMessagesEl() { return document.getElementById('copilot-messages'); }
function scrollToBottom() {
  const el = getMessagesEl();
  if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatMessage(text) {
  // Convert **bold**, bullet lines, newlines
  return escHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^[•\-]\s(.+)$/gm, '<li>$1</li>')
    .replace(/<li>/g, '<ul class="copilot-list"><li>')
    .replace(/<\/li>(\n|$)(?!<li>)/g, '</li></ul>')
    .replace(/\n/g, '<br>');
}
