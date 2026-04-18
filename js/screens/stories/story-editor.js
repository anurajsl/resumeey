/* Story Editor — add / edit a STAR story */

import { router } from '../../router.js';
import { StoryRepo } from '../../db/repositories.js';
import { confirmModal } from '../../components/modal.js';
import { toast } from '../../components/toast.js';
import { debounce } from '../../utils/debounce.js';

const STAR_FIELDS = [
  {
    key: 'situation',
    label: 'Situation',
    hint: 'Set the scene — what was the context or background?',
    placeholder: 'e.g. Our team was facing a critical production outage affecting 10k users…',
  },
  {
    key: 'task',
    label: 'Task',
    hint: 'What was your specific responsibility or challenge?',
    placeholder: 'e.g. I was tasked with identifying the root cause and coordinating a fix within 2 hours…',
  },
  {
    key: 'action',
    label: 'Action',
    hint: 'What steps did YOU take? Use "I", not "we".',
    placeholder: 'e.g. I analysed the error logs, identified a memory leak in the caching layer, and deployed a hotfix…',
  },
  {
    key: 'result',
    label: 'Result',
    hint: 'What was the measurable outcome?',
    placeholder: 'e.g. Restored service in 90 minutes, zero data loss. Reduced recurrence by 80% through improved monitoring.',
  },
];

export async function renderStoryEditor({ id } = {}) {
  const container = document.getElementById('screen-container');
  const nav = document.getElementById('bottom-nav'); if (nav) nav.style.display = '';

  const isEdit = Boolean(id);
  let story = isEdit ? await StoryRepo.get(id) : null;

  if (isEdit && !story) {
    toast.error('Story not found');
    router.navigate('/stories');
    return;
  }

  const headerTitle = document.getElementById('header-screen-title');
  const back = document.getElementById('header-back');
  if (headerTitle) { headerTitle.textContent = isEdit ? 'Edit Story' : 'New Story'; headerTitle.classList.add('visible'); }
  if (back) {
    back.style.display = 'flex';
    back.onclick = () => {
      headerTitle?.classList.remove('visible');
      back.style.display = 'none';
      router.navigate('/stories');
    };
  }

  const headerActions = document.getElementById('header-actions');
  if (headerActions) {
    headerActions.innerHTML = `
      <button class="btn btn-primary btn-sm" id="btn-save-story">Save</button>
    `;
  }

  container.innerHTML = `
    <div class="animate-fade-up" style="padding-bottom:32px">
      <div style="padding:20px 16px 8px">
        <div class="form-group">
          <label class="form-label">Story title</label>
          <input type="text" id="story-title" class="form-input" placeholder="e.g. Led migration to microservices" value="${escHtml(story?.title || '')}">
          <p class="form-hint">A short label to find this story quickly.</p>
        </div>
      </div>

      <!-- STAR fields -->
      ${STAR_FIELDS.map(f => `
      <div style="padding:0 16px 16px">
        <div class="card">
          <div class="card-header">
            <div>
              <span class="star-field-label">${f.label}</span>
              <span class="star-field-hint">${f.hint}</span>
            </div>
          </div>
          <div class="card-body" style="padding-top:0">
            <textarea
              id="story-${f.key}"
              class="form-textarea"
              placeholder="${f.placeholder}"
              style="min-height:90px;font-size:13px;border:none;padding:0;resize:vertical;box-shadow:none"
            >${escHtml(story?.[f.key] || '')}</textarea>
          </div>
        </div>
      </div>`).join('')}

      <!-- Tags -->
      <div style="padding:0 16px 16px">
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              Tags
            </span>
          </div>
          <div class="card-body" style="padding-top:0">
            <input
              type="text"
              id="story-tags-input"
              class="form-input"
              placeholder="leadership, python, problem-solving  (comma-separated)"
              value="${escHtml((story?.tags || []).join(', '))}"
              style="font-size:13px"
            >
            <p class="form-hint">Tags match against job keywords to surface relevant stories.</p>
            <div id="story-tags-preview" class="story-tags-preview">${renderTagChips(story?.tags || [])}</div>
          </div>
        </div>
      </div>

      ${isEdit ? `
      <div style="padding:0 16px">
        <button class="btn btn-ghost" id="btn-delete-story" style="color:var(--color-error);width:100%">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Delete Story
        </button>
      </div>` : ''}
    </div>
  `;

  // Live tag preview
  document.getElementById('story-tags-input').addEventListener('input', (e) => {
    const tags = parseTags(e.target.value);
    document.getElementById('story-tags-preview').innerHTML = renderTagChips(tags);
  });

  // Save (header button + auto-save)
  const collectData = () => ({
    title:     document.getElementById('story-title')?.value.trim() || '',
    situation: document.getElementById('story-situation')?.value.trim() || '',
    task:      document.getElementById('story-task')?.value.trim() || '',
    action:    document.getElementById('story-action')?.value.trim() || '',
    result:    document.getElementById('story-result')?.value.trim() || '',
    tags:      parseTags(document.getElementById('story-tags-input')?.value || ''),
  });

  document.getElementById('btn-save-story').addEventListener('click', async () => {
    const data = collectData();
    if (!data.title && !data.situation && !data.action) {
      toast.error('Add at least a title or some content');
      return;
    }
    try {
      if (isEdit) {
        await StoryRepo.update(id, data);
        toast.success('Story updated');
      } else {
        await StoryRepo.create(data);
        toast.success('Story saved');
      }
      headerTitle?.classList.remove('visible');
      back.style.display = 'none';
      router.navigate('/stories');
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    }
  });

  if (isEdit) {
    document.getElementById('btn-delete-story').addEventListener('click', async () => {
      const confirmed = await confirmModal({
        title: 'Delete Story',
        message: 'Permanently delete this story?',
        confirmText: 'Delete',
        danger: true,
      });
      if (confirmed) {
        await StoryRepo.delete(id);
        toast.success('Story deleted');
        headerTitle?.classList.remove('visible');
        back.style.display = 'none';
        router.navigate('/stories');
      }
    });
  }
}

function parseTags(value) {
  return value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
}

function renderTagChips(tags) {
  if (!tags.length) return '';
  return tags.map(t => `<span class="tag tag-neutral" style="font-size:11px">${escHtml(t)}</span>`).join('');
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
