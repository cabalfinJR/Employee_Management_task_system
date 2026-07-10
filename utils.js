// ── SHARED UTILITIES ──────────────────────────────────────────────────
// Used by admin-dashboard.html, employee-dashboard.html,
// employee-management.html, completed-tasks.html
// Centralizing these avoids drift (e.g. mismatched animation speeds)
// and makes sure every page escapes user-generated content the same way.

// ── XSS-SAFE ESCAPING ──
// Always run task titles/descriptions, employee names, link labels, etc.
// through this before inserting into innerHTML.
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── DATES ──
export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isOverdue(task, today = startOfToday()) {
  if (!task.dueDate || task.status === 'Completed') return false;
  const d = new Date(task.dueDate);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

export function isDueTomorrow(task, today = startOfToday()) {
  if (!task.dueDate || task.status === 'Completed') return false;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(task.dueDate);
  d.setHours(0, 0, 0, 0);
  return d.getTime() === tomorrow.getTime();
}

export function isDueSoon(task, today = startOfToday()) {
  if (!task.dueDate || task.status === 'Completed') return false;
  const d = new Date(task.dueDate);
  d.setHours(0, 0, 0, 0);
  const diff = (d - today) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 2;
}

// opts.showTomorrow: if true, shows a distinct "Due tomorrow!" chip
// (used by the employee dashboard, not the admin one)
export function dueBadge(task, opts = {}) {
  if (!task.dueDate) return '';
  const today = startOfToday();
  if (isOverdue(task, today)) {
    return `<span class="due due-overdue"><i class="ti ti-alert-circle" style="font-size:11px;"></i> Overdue · ${formatDate(task.dueDate)}</span>`;
  }
  if (opts.showTomorrow && isDueTomorrow(task, today)) {
    return `<span class="due due-soon"><i class="ti ti-clock" style="font-size:11px;"></i> Due tomorrow!</span>`;
  }
  if (isDueSoon(task, today)) {
    return `<span class="due due-soon"><i class="ti ti-clock" style="font-size:11px;"></i> Due soon · ${formatDate(task.dueDate)}</span>`;
  }
  return `<span class="due due-ok"><i class="ti ti-calendar" style="font-size:11px;"></i> Due ${formatDate(task.dueDate)}</span>`;
}

// ── PRIORITY ──
export function priBadge(p) {
  const map   = { low: 'pri-low', medium: 'pri-medium', high: 'pri-high', urgent: 'pri-urgent' };
  const label = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
  const icon  = { low: '🟢', medium: '🔵', high: '🟠', urgent: '🔴' };
  return `<span class="pri ${map[p] || 'pri-medium'}">${icon[p] || '🔵'} ${label[p] || 'Medium'}</span>`;
}

// ── OUTPUT LINK PLATFORM DETECTION ──
export function detectPlatform(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (h.includes('drive.google')) return { name: 'Google Drive', icon: 'ti ti-brand-google-drive', color: '#1FA463', bg: '#E6F4EA' };
    if (h.includes('docs.google'))  return { name: 'Google Docs',  icon: 'ti ti-file-text',           color: '#1A73E8', bg: '#E8F0FE' };
    if (h.includes('onedrive') || h.includes('1drv')) return { name: 'OneDrive', icon: 'ti ti-brand-onedrive', color: '#0078D4', bg: '#E3F2FD' };
    if (h.includes('dropbox'))      return { name: 'Dropbox',      icon: 'ti ti-brand-dropbox',       color: '#0061FF', bg: '#E8F0FF' };
    if (h.includes('github'))       return { name: 'GitHub',       icon: 'ti ti-brand-github',        color: '#24292E', bg: '#F0F0F0' };
    if (h.includes('figma'))        return { name: 'Figma',        icon: 'ti ti-brand-figma',         color: '#F24E1E', bg: '#FEF0EC' };
    if (h.includes('notion'))       return { name: 'Notion',       icon: 'ti ti-notebook',            color: '#191919', bg: '#F5F5F5' };
    if (h.includes('youtube') || h.includes('youtu.be')) return { name: 'YouTube', icon: 'ti ti-brand-youtube', color: '#FF0000', bg: '#FEE2E2' };
  } catch (e) { /* invalid URL, fall through */ }
  return { name: 'Link', icon: 'ti ti-link', color: '#4F46E5', bg: '#EEF2FF' };
}

// ── SUBMISSION TIMING (early / late / on-time vs due date) ──
export function calcTiming(dueDate, submittedAt) {
  if (!dueDate || !submittedAt) return null;

  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999); // due date = end of that day

  const submitted = submittedAt.toDate ? submittedAt.toDate() : new Date(submittedAt);
  const diffMs = submitted - due; // positive = late, negative = early
  const absDiffMs = Math.abs(diffMs);

  const days    = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));

  let timeStr = '';
  if (days > 0)  timeStr += `${days}d `;
  if (hours > 0) timeStr += `${hours}h `;
  timeStr += `${minutes}m`;
  timeStr = timeStr.trim() || '< 1m';

  if (diffMs > 0)  return { type: 'late',   label: `Submitted ${timeStr} late`,  cls: 'sub-late',   icon: 'ti-clock-x' };
  if (diffMs < 0)  return { type: 'early',  label: `Submitted ${timeStr} early`, cls: 'sub-early',  icon: 'ti-clock-check' };
  return { type: 'ontime', label: 'Submitted on time', cls: 'sub-ontime', icon: 'ti-check' };
}

export function timingBadge(timing) {
  if (!timing) return '';
  return `<span class="sub-timing ${timing.cls}"><i class="ti ${timing.icon}" style="font-size:11px;"></i> ${timing.label}</span>`;
}

// ── AVATARS ──
const AVATAR_COLORS = ['#4F46E5', '#059669', '#D97706', '#DC2626', '#0891B2', '#7C3AED', '#DB2777', '#065F46'];

export function getAvatarColor(seed) {
  let h = 0;
  for (const c of String(seed || '')) h = c.charCodeAt(0) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function initials(name) {
  const cleaned = String(name || '').trim();
  if (!cleaned) return '??';
  return cleaned.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── ANIMATED COUNTERS ──
// Single shared step interval (50ms) so every dashboard's numbers animate
// at the same speed instead of three different speeds across pages.
export function animateNum(id, target, stepMs = 50) {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = parseInt(el.textContent) || 0;
  if (cur === target) { el.textContent = target; return; }
  const step = target > cur ? 1 : -1;
  const iv = setInterval(() => {
    cur += step;
    el.textContent = cur;
    if (cur === target) clearInterval(iv);
  }, stepMs);
}

// ── TOASTS ──
export function showToast(msg, type = 'success', wrapId = 'toastWrap', duration = 3500) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.background = type === 'success' ? '#059669' : type === 'danger' ? '#DC2626' : '#D97706';
  toast.textContent = msg;
  wrap.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}
