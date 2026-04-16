/* Story Bank Screen — list of STAR interview stories */

import { router } from '../../router.js';
import { StoryRepo } from '../../db/repositories.js';
import { createEmptyState } from '../../components/empty-state.js';

export async function renderStoryBank() {
  const container = document.getElementById('screen-container');
  const nav = document.getElementById('bottom-nav'); if (nav) nav.style.display = '';

  const headerTitle = document.getElementById('header-screen-title');
  const back = document.getElementById('header-back');
  if (headerTitle) { headerTitle.textContent = 'Story Bank'; headerTitle.classList.add('visible'); }
  if (back) {
    back.style.display = 'flex';
    back.onclick = () => {
      headerTitle?.classList.remove('visible');
      back.style.display = 'none';
      router.navigate('/settings');
    };
  }

  const stories = await StoryRepo.getAll();

  // Collect all unique tags for the filter bar
  const allTags = [...new Set(stories.flatMap(s => s.tags))].sort();
  let activeTag = 'all';

  const renderList = () => {
    const filtered = activeTag === 'all'
      ? stories
      : stories.filter(s => s.tags.map(t => t.toLowerCase()).includes(activeTag));

    const listEl = document.getElementById('stories-list');
    if (!listEl) return;

    if (filtered.length === 0) {
      listEl.innerHTML = `<div style="padding:40px 16px;text-align:center;color:var(--color-text-tertiary);font-size:14px">${activeTag === 'all' ? 'No stories yet' : 'No stories with this tag'}</div>`;
      return;
    }

    listEl.innerHTML = filtered.map(story => renderStoryCard(story)).join('');
  };

  container.innerHTML = `
    <div class="animate-fade-up" style="padding-bottom:24px">
      <div style="padding:24px 16px 12px;display:flex;align-items:flex-start;justify-content:space-between">
        <div>
          <h2 class="page-title">Story Bank</h2>
          <p class="page-subtitle">${stories.length} STAR stor${stories.length === 1 ? 'y' : 'ies'}</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-add-story">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Story
        </button>
      </div>

      <!-- What is this -->
      <div class="story-bank-intro">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>STAR stories are reusable answers to behavioural interview questions. Tag them by skill to surface relevant ones per job.</span>
      </div>

      ${allTags.length > 0 ? `
      <!-- Tag filter -->
      <div class="story-tag-filter" id="story-tag-filter">
        <button class="story-tag-btn active" data-tag="all">All</button>
        ${allTags.map(t => `<button class="story-tag-btn" data-tag="${t}">${t}</button>`).join('')}
      </div>` : ''}

      <div id="stories-list"></div>
    </div>
  `;

  renderList();

  if (stories.length === 0) {
    document.getElementById('stories-list').appendChild(createEmptyState({
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
      title: 'No stories yet',
      description: 'Add STAR-format stories to reuse in interviews. Tag by skill to find them quickly.',
      action: { label: '+ Add First Story', onClick: () => router.navigate('/stories/add') },
    }));
  }

  document.getElementById('btn-add-story').addEventListener('click', () => router.navigate('/stories/add'));

  document.getElementById('story-tag-filter')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.story-tag-btn');
    if (!btn) return;
    activeTag = btn.dataset.tag;
    document.querySelectorAll('.story-tag-btn').forEach(b => b.classList.toggle('active', b.dataset.tag === activeTag));
    renderList();
  });

  container.addEventListener('click', (e) => {
    const card = e.target.closest('.story-card');
    if (!card) return;
    router.navigate(`/stories/${card.dataset.storyId}`);
  });
}

function renderStoryCard(story) {
  const preview = story.result || story.action || story.situation || '';
  return `
    <div class="story-card" data-story-id="${story.id}">
      <div class="story-card-header">
        <div class="story-card-title">${story.title || 'Untitled story'}</div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-text-tertiary);flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      ${preview ? `<p class="story-card-preview">${preview.slice(0, 100)}${preview.length > 100 ? '…' : ''}</p>` : ''}
      ${story.tags.length > 0 ? `
      <div class="story-card-tags">
        ${story.tags.map(t => `<span class="tag tag-neutral" style="font-size:10px">${t}</span>`).join('')}
      </div>` : ''}
    </div>
  `;
}
