/* JobCompass - shared helpers used by every page */
const API = '/api';

// Escape text before putting it in HTML (prevents XSS)
function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function logout() {
  localStorage.removeItem('jc_token');
  localStorage.removeItem('jc_user');
  window.location.href = 'index.html';
}

// Pages call this first: no token = go to login page
function requireAuth() {
  if (!localStorage.getItem('jc_token')) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function currentUser() {
  try { return JSON.parse(localStorage.getItem('jc_user')) || {}; } catch (e) { return {}; }
}

// Wrapper around fetch(): adds the JWT header, parses JSON, throws on errors
async function api(path, method = 'GET', body) {
  const headers = { 'Content-Type': 'application/json' };
  const t = localStorage.getItem('jc_token');
  if (t) headers.Authorization = 'Bearer ' + t;

  const res = await fetch(API + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* empty body */ }

  const isAuthCall = path.startsWith('/auth/login') || path.startsWith('/auth/register');
  if (res.status === 401 && !isAuthCall) { logout(); throw new Error('Session expired'); }
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

function toast(message, type = 'success') {
  let box = document.getElementById('toast-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast-box';
    document.body.appendChild(box);
  }
  const el = document.createElement('div');
  el.className = 'alert alert-' + type + ' shadow-sm py-2 px-3 mb-2';
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

const NAV_PAGES = [
  ['dashboard', 'Dashboard', 'dashboard.html'],
  ['companies', 'Companies', 'companies.html'],
  ['applications', 'Applications', 'applications.html'],
  ['deadlines', 'Deadlines', 'deadlines.html'],
  ['followups', 'Follow-ups', 'follow-ups.html'],
  ['interviews', 'Interviews', 'interviews.html'],
  ['calendar', 'Calendar', 'calendar.html'],
  ['profile', 'Profile', 'profile.html'],
];

function renderNav(active) {
  const user = currentUser();
  document.getElementById('nav').innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark jc-nav">
      <div class="container">
        <a class="navbar-brand fw-bold" href="dashboard.html">JobCompass</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav me-auto">
            ${NAV_PAGES.map(([key, label, href]) =>
              `<li class="nav-item"><a class="nav-link ${key === active ? 'active' : ''}" href="${href}">${label}</a></li>`
            ).join('')}
          </ul>
          <span class="navbar-text me-3">${esc(user.name || '')}</span>
          <button class="btn btn-sm btn-light" id="logoutBtn">Logout</button>
        </div>
      </div>
    </nav>`;
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Coloured status labels
function badge(text) {
  const map = {
    Applied: 'bg-primary', Interview: 'bg-info text-dark', Selected: 'bg-success',
    Rejected: 'bg-danger', Pending: 'bg-secondary', Cleared: 'bg-success',
  };
  return `<span class="badge ${map[text] || 'bg-secondary'}">${esc(text)}</span>`;
}

function doneBadge(isDone) {
  return Number(isDone)
    ? '<span class="badge bg-success">Done</span>'
    : '<span class="badge bg-warning text-dark">Pending</span>';
}

function fmtDateTime(s) {
  return s ? String(s).slice(0, 16).replace('T', ' ') : '';
}

/*
 * crudPage(): ONE reusable component that builds a full "table + add/edit
 * form + delete" page from a small config object. Companies, Applications,
 * Deadlines, Follow-ups and Interviews pages all use it.
 */
async function crudPage(cfg) {
  const root = document.getElementById('app');
  const fields = cfg.fields;
  let rows = [];
  let editingId = null;

  try {
    // Dropdowns that depend on other tables (e.g. company list) are loaded first
    for (const f of fields) {
      if (f.optionsFrom) {
        const list = await api(f.optionsFrom.endpoint);
        f.options = list.map((r) => ({ value: r.id, label: f.optionsFrom.label(r) }));
      }
    }

    const fieldHtml = (f) => {
      const id = 'f_' + f.name;
      const req = f.required ? 'required' : '';
      const label = `<label for="${id}" class="form-label">${esc(f.label)}${f.required ? ' *' : ''}</label>`;
      if (f.type === 'select') {
        const opts = (f.options || []).map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
        const blank = !f.required || f.optionsFrom ? '<option value="">Select...</option>' : '';
        return `<div class="mb-3">${label}<select id="${id}" class="form-select" ${req}>${blank}${opts
          .map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('')}</select></div>`;
      }
      if (f.type === 'textarea')
        return `<div class="mb-3">${label}<textarea id="${id}" class="form-control" rows="3" ${req}></textarea></div>`;
      if (f.type === 'checkbox')
        return `<div class="form-check mb-3"><input class="form-check-input" type="checkbox" id="${id}">
                <label class="form-check-label" for="${id}">${esc(f.label)}</label></div>`;
      return `<div class="mb-3">${label}<input id="${id}" type="${f.type || 'text'}" class="form-control" ${req}></div>`;
    };

    root.innerHTML = `
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h2 class="page-title mb-0">${esc(cfg.title)}</h2>
        <div class="d-flex gap-2">
          ${cfg.filterField ? `<select id="filter" class="form-select"><option value="">All ${esc(cfg.filterField)}</option>
            ${cfg.filterOptions.map((o) => `<option>${esc(o)}</option>`).join('')}</select>` : ''}
          <button id="addBtn" class="btn btn-primary">+ Add ${esc(cfg.noun)}</button>
        </div>
      </div>
      <div class="card jc-card"><div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead><tr>${cfg.columns.map((c) => `<th>${esc(c.label)}</th>`).join('')}<th class="text-end">Actions</th></tr></thead>
          <tbody id="rows"></tbody>
        </table>
      </div></div>
      <div class="modal fade" id="formModal" tabindex="-1">
        <div class="modal-dialog"><form class="modal-content" id="crudForm">
          <div class="modal-header"><h5 class="modal-title" id="modalTitle"></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">${fields.map(fieldHtml).join('')}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form></div>
      </div>`;

    const modal = new bootstrap.Modal(document.getElementById('formModal'));
    const tbody = document.getElementById('rows');

    function renderRows() {
      const fv = cfg.filterField ? document.getElementById('filter').value : '';
      const shown = fv ? rows.filter((r) => r[cfg.filterField] === fv) : rows;
      if (!shown.length) {
        tbody.innerHTML = `<tr><td colspan="${cfg.columns.length + 1}" class="text-center text-muted py-4">
          Nothing here yet. Click "+ Add ${esc(cfg.noun)}" to create one.</td></tr>`;
        return;
      }
      tbody.innerHTML = shown.map((r) => `<tr>
        ${cfg.columns.map((c) => `<td>${c.render(r)}</td>`).join('')}
        <td class="text-end text-nowrap">${cfg.extraActions ? cfg.extraActions(r) : ''}
          <button class="btn btn-sm btn-outline-primary me-1" data-edit="${r.id}">Edit</button>
          <button class="btn btn-sm btn-outline-danger" data-del="${r.id}">Delete</button></td></tr>`).join('');
    }

    async function load() {
      rows = await api(cfg.endpoint);
      renderRows();
    }

    function openModal(row) {
      editingId = row ? row.id : null;
      document.getElementById('modalTitle').textContent = (row ? 'Edit ' : 'Add ') + cfg.noun;
      for (const f of fields) {
        const el = document.getElementById('f_' + f.name);
        const v = row ? row[f.name] : f.default;
        if (f.type === 'checkbox') el.checked = !!Number(v);
        else if (f.type === 'datetime-local') el.value = v ? String(v).replace(' ', 'T').slice(0, 16) : '';
        else el.value = v === undefined || v === null ? '' : v;
        if (el.tagName === 'SELECT' && el.selectedIndex === -1) el.selectedIndex = 0;
        el.disabled = !!(row && f.createOnly); // e.g. cannot move a deadline to another application
      }
      modal.show();
    }

    document.getElementById('addBtn').addEventListener('click', () => {
      for (const f of fields) {
        if (f.optionsFrom && !f.options.length) {
          toast(f.emptyMsg || 'Add the required data first.', 'warning');
          return;
        }
      }
      openModal(null);
    });

    if (cfg.filterField) document.getElementById('filter').addEventListener('change', renderRows);

    tbody.addEventListener('click', async (e) => {
      const editId = e.target.getAttribute('data-edit');
      const delId = e.target.getAttribute('data-del');
      if (editId) openModal(rows.find((r) => String(r.id) === editId));
      if (delId && confirm('Delete this ' + cfg.noun.toLowerCase() + '? This cannot be undone.')) {
        try {
          await api(`${cfg.endpoint}/${delId}`, 'DELETE');
          toast(cfg.noun + ' deleted.');
          await load();
        } catch (err) { toast(err.message, 'danger'); }
      }
    });

    document.getElementById('crudForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {};
      for (const f of fields) {
        if (f.createOnly && editingId) continue;
        const el = document.getElementById('f_' + f.name);
        let v;
        if (f.type === 'checkbox') v = el.checked;
        else {
          v = el.value.trim();
          if (v === '') v = null;
          else if (f.type === 'datetime-local') v = v.replace('T', ' ') + (v.length === 16 ? ':00' : '');
          else if (f.name.endsWith('_id')) v = Number(v);
        }
        body[f.name] = v;
      }
      try {
        if (editingId) await api(`${cfg.endpoint}/${editingId}`, 'PUT', body);
        else await api(cfg.endpoint, 'POST', body);
        modal.hide();
        toast(cfg.noun + (editingId ? ' updated.' : ' added.'));
        await load();
      } catch (err) { toast(err.message, 'danger'); }
    });

    await load();
  } catch (err) {
    root.innerHTML = `<div class="alert alert-danger">Could not load data: ${esc(err.message)}</div>`;
  }
}
