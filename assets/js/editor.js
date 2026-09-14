/* ============================================================
   editor.js — powers editor.html: every + and pencil button,
   the Save Changes / Deploy buttons, and image uploads.
   ============================================================ */

let DATA = null;          // the in-memory content object
let DIRTY = false;        // true once something changed since last save
const LOCAL_CACHE_KEY = 'portfolio_local_cache';

const root = document.getElementById('root');
const gate = document.getElementById('gate');

function setDirty(v) {
  DIRTY = v;
  const pill = document.getElementById('status-pill');
  if (!pill) return;
  if (v) { pill.textContent = 'unsaved changes'; pill.className = 'status-pill dirty'; }
  else { pill.textContent = 'saved'; pill.className = 'status-pill saved'; }
}

function cacheLocally() {
  try { localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(DATA)); } catch (e) {}
}

function rerender() {
  renderApp(root, DATA, true);
  cacheLocally();
}

/* ---------------- boot: token gate then load data ---------------- */
async function boot() {
  if (!GH.hasToken()) { showGate(); return; }
  // We have a saved token — show the app shell right away, then load.
  gate.style.display = 'none';
  root.style.display = '';
  document.getElementById('editor-bar').style.display = '';
  await loadAndRender(true);
}

function showGate(prefillError) {
  gate.style.display = 'flex';
  root.style.display = 'none';
  document.getElementById('editor-bar').style.display = 'none';
  gate.innerHTML = `
    <div class="gate-box">
      <h1>&gt; connect to GitHub</h1>
      <p>Paste your Personal Access Token. It's stored only in this browser and is only ever sent to api.github.com.
      See the README for how to create one in under a minute.</p>
      <div class="field">
        <label>GitHub token</label>
        <input type="password" id="token-input" placeholder="github_pat_...">
      </div>
      ${prefillError ? `<p style="color:var(--danger);font-size:13px;">${esc(prefillError)}</p>` : ''}
      <button class="btn primary" id="token-submit">Connect</button>
    </div>
  `;
  document.getElementById('token-submit').onclick = async () => {
    const val = document.getElementById('token-input').value.trim();
    if (!val) return;
    GH.setToken(val);
    try {
      await GH.verify();
      gate.style.display = 'none';
      root.style.display = '';
      document.getElementById('editor-bar').style.display = '';
      await loadAndRender(true);
    } catch (e) {
      GH.clearToken();
      showGate('Could not connect: ' + e.message);
    }
  };
}

async function loadAndRender(fromRemote) {
  try {
    if (fromRemote) {
      const draft = await GH.getFile(SITE_CONFIG.draftDataPath);
      const live = draft ? null : await GH.getFile(SITE_CONFIG.liveDataPath);
      DATA = JSON.parse((draft || live).content);
    }
  } catch (e) {
    const msg = String(e.message || '');
    const isAuthError = msg.includes('401') || msg.includes('403') || msg.includes('Bad credentials');
    if (isAuthError) {
      // The saved token is dead (deleted/expired/wrong permissions) — don't
      // keep using it silently. Clear it and ask to reconnect.
      GH.clearToken();
      showGate('Your saved token no longer works (it may have been deleted, expired, or lacks "Contents: Read and write" permission). Please paste a working token.');
      return;
    }
    const cached = localStorage.getItem(LOCAL_CACHE_KEY);
    if (cached) { DATA = JSON.parse(cached); alert('Could not reach GitHub, showing your last local draft instead.\n' + e.message); }
    else { showGate('Could not load your content: ' + e.message); return; }
  }
  DATA.customSections = DATA.customSections || [];
  setDirty(false);
  rerender();
}

/* ---------------- save / deploy ---------------- */
function handleGithubError(prefix, e) {
  const msg = String(e.message || '');
  const isAuthError = msg.includes('401') || msg.includes('403') || msg.includes('Bad credentials') || msg.includes('not accessible by personal access token');
  if (isAuthError) {
    GH.clearToken();
    alert(prefix + ' — your token isn\'t working (deleted, expired, or missing "Contents: Read and write" permission). Please reconnect with a working token.');
    showGate('Please paste a working token to continue.');
  } else {
    alert(prefix + ': ' + e.message);
  }
}

async function saveChanges() {
  setBusy(true, 'saving…');
  try {
    await GH.putFile(SITE_CONFIG.draftDataPath, JSON.stringify(DATA, null, 2), 'Save draft from editor');
    setDirty(false);
  } catch (e) {
    handleGithubError('Save failed', e);
  }
  setBusy(false);
}

async function deploy() {
  if (!confirm('Publish these changes to your live portfolio now?')) return;
  setBusy(true, 'deploying…');
  try {
    await GH.putFile(SITE_CONFIG.liveDataPath, JSON.stringify(DATA, null, 2), 'Deploy portfolio update');
    await GH.putFile(SITE_CONFIG.draftDataPath, JSON.stringify(DATA, null, 2), 'Sync draft after deploy');
    setDirty(false);
    alert('Deployed! Your live site will update within about a minute.');
  } catch (e) {
    handleGithubError('Deploy failed', e);
  }
  setBusy(false);
}

function setBusy(isBusy, label) {
  document.querySelectorAll('#editor-bar .btn').forEach(b => b.disabled = isBusy);
  const pill = document.getElementById('status-pill');
  if (isBusy && pill) { pill.textContent = label; pill.className = 'status-pill'; }
}

/* ---------------- modal helpers ---------------- */
function openModal(html) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'active-modal';
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  return overlay;
}
function closeModal() {
  const m = document.getElementById('active-modal');
  if (m) m.remove();
}

function field(label, id, value, type) {
  if (type === 'textarea') {
    return `<div class="field"><label>${esc(label)}</label><textarea id="${id}">${esc(value || '')}</textarea></div>`;
  }
  return `<div class="field"><label>${esc(label)}</label><input id="${id}" type="text" value="${esc(value || '')}"></div>`;
}

function imageField(label, id, currentSrc) {
  return `<div class="field"><label>${esc(label)}</label>
    ${currentSrc ? `<img src="${esc(currentSrc)}" style="max-width:100px;border-radius:6px;margin-bottom:8px;display:block;">` : ''}
    <input id="${id}" type="file" accept="image/*"></div>`;
}

async function readImageFile(inputEl) {
  const f = inputEl.files && inputEl.files[0];
  if (!f) return null;
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ dataUrl: r.result, name: f.name });
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}

function slug(str) {
  return (str || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item';
}

/* ---------------- action router (event delegation) ---------------- */
root.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  const entryEl = btn.closest('[data-index], [data-cat]');
  const idx = (entryEl && entryEl.hasAttribute('data-index')) ? parseInt(entryEl.getAttribute('data-index'), 10) : null;
  const custIdx = btn.getAttribute('data-custom-index') !== null
    ? parseInt(btn.getAttribute('data-custom-index'), 10) : null;

  const handlers = {
    'edit-profile': () => modalProfile(),
    'edit-photo': () => modalProfile(),
    'add-experience': () => modalExperience(null),
    'edit-experience': () => modalExperience(idx),
    'add-skill-group': () => modalSkillGroup(null),
    'edit-skill-group': () => modalSkillGroup(entryEl.getAttribute('data-cat')),
    'add-project': () => modalProject(null),
    'edit-project': () => modalProject(idx),
    'add-cert': () => modalCert(null),
    'edit-cert': () => modalCert(idx),
    'add-education': () => modalEducation(null),
    'edit-education': () => modalEducation(idx),
    'edit-contact': () => modalContact(),
    'add-custom-section': () => modalCustomSection(),
    'remove-custom-section': () => removeCustomSection(custIdx),
    'add-custom-item': () => modalCustomItem(custIdx, null),
    'edit-custom-item': () => modalCustomItem(custIdx, parseInt(btn.closest('[data-item-index]').getAttribute('data-item-index'), 10)),
  };
  if (handlers[action]) handlers[action]();
});

/* theme picker + top bar wiring done once on init */
function wireChrome() {
  document.getElementById('save-btn').onclick = saveChanges;
  document.getElementById('deploy-btn').onclick = deploy;
  document.getElementById('logout-btn').onclick = () => {
    if (confirm('Disconnect this browser from GitHub? (your saved draft on GitHub is unaffected)')) {
      GH.clearToken();
      location.reload();
    }
  };
  document.getElementById('preview-btn').onclick = () => window.open('index.html', '_blank');

  root.addEventListener('click', (e) => {
    const tbtn = e.target.closest('[data-theme-btn]');
    if (!tbtn) return;
    DATA.theme = tbtn.getAttribute('data-theme-btn');
    setDirty(true);
    rerender();
  });
}

/* ---------------- individual modals ---------------- */
function modalProfile() {
  const p = DATA.profile;
  openModal(`
    <h3>Edit profile</h3>
    ${imageField('Photo', 'f-photo', p.photo)}
    ${field('Name', 'f-name', p.name)}
    ${field('Role / headline', 'f-role', p.role)}
    ${field('Summary', 'f-summary', p.summary, 'textarea')}
    <div class="field"><label>Intro lines (one per line — shown as the typing intro)</label>
      <textarea id="f-boot">${esc((p.boot_lines||[]).join('\n'))}</textarea></div>
    <div class="field"><label>Typing effect phrases (one per line — cycles continuously under your summary)</label>
      <textarea id="f-typing">${esc((p.typing_phrases||[]).join('\n'))}</textarea></div>
    <div class="modal-actions">
      <button class="btn" id="cancel">Cancel</button>
      <button class="btn primary" id="save">Save</button>
    </div>
  `);
  document.getElementById('cancel').onclick = closeModal;
  document.getElementById('save').onclick = async () => {
    const fileInput = document.getElementById('f-photo');
    const img = await readImageFile(fileInput);
    if (img) {
      setBusy(true, 'uploading photo…');
      try {
        const path = `${SITE_CONFIG.imagesFolder}/profile.jpg`;
        await GH.putImage(path, img.dataUrl, 'Update profile photo');
        p.photo = path + '?v=' + Date.now();
      } catch (e) { alert('Photo upload failed: ' + e.message); }
      setBusy(false);
    }
    p.name = document.getElementById('f-name').value;
    p.role = document.getElementById('f-role').value;
    p.summary = document.getElementById('f-summary').value;
    p.boot_lines = document.getElementById('f-boot').value.split('\n').map(s=>s.trim()).filter(Boolean);
    p.typing_phrases = document.getElementById('f-typing').value.split('\n').map(s=>s.trim()).filter(Boolean);
    setDirty(true); closeModal(); rerender();
  };
}

function modalExperience(idx) {
  const isNew = idx === null;
  const e = isNew ? { org:'', title:'', start:'', end:'', bullets:[] } : DATA.experience[idx];
  openModal(`
    <h3>${isNew ? 'Add experience' : 'Edit experience'}</h3>
    ${field('Organization', 'f-org', e.org)}
    ${field('Title', 'f-title', e.title)}
    ${field('Start', 'f-start', e.start)}
    ${field('End', 'f-end', e.end)}
    <div class="field"><label>Bullet points (one per line)</label><textarea id="f-bullets">${esc((e.bullets||[]).join('\n'))}</textarea></div>
    <div class="modal-actions">
      ${!isNew ? '<button class="btn danger" id="del" style="margin-right:auto;">Delete</button>' : ''}
      <button class="btn" id="cancel">Cancel</button>
      <button class="btn primary" id="save">Save</button>
    </div>
  `);
  document.getElementById('cancel').onclick = closeModal;
  if (!isNew) document.getElementById('del').onclick = () => {
    if (confirm('Delete this experience entry?')) { DATA.experience.splice(idx,1); setDirty(true); closeModal(); rerender(); }
  };
  document.getElementById('save').onclick = () => {
    const obj = {
      org: document.getElementById('f-org').value,
      title: document.getElementById('f-title').value,
      start: document.getElementById('f-start').value,
      end: document.getElementById('f-end').value,
      bullets: document.getElementById('f-bullets').value.split('\n').map(s=>s.trim()).filter(Boolean),
    };
    if (isNew) DATA.experience.push(obj); else DATA.experience[idx] = obj;
    setDirty(true); closeModal(); rerender();
  };
}

function modalSkillGroup(catName) {
  const isNew = catName === null;
  const current = isNew ? [] : DATA.skills[catName];
  openModal(`
    <h3>${isNew ? 'Add skill category' : 'Edit skill category'}</h3>
    ${field('Category name', 'f-cat', catName || '')}
    <div class="field"><label>Skills (one per line)</label><textarea id="f-skills">${esc((current||[]).join('\n'))}</textarea></div>
    <div class="modal-actions">
      ${!isNew ? '<button class="btn danger" id="del" style="margin-right:auto;">Delete category</button>' : ''}
      <button class="btn" id="cancel">Cancel</button>
      <button class="btn primary" id="save">Save</button>
    </div>
  `);
  document.getElementById('cancel').onclick = closeModal;
  if (!isNew) document.getElementById('del').onclick = () => {
    if (confirm('Delete this skill category?')) { delete DATA.skills[catName]; setDirty(true); closeModal(); rerender(); }
  };
  document.getElementById('save').onclick = () => {
    const newName = document.getElementById('f-cat').value.trim();
    const list = document.getElementById('f-skills').value.split('\n').map(s=>s.trim()).filter(Boolean);
    if (!newName) return alert('Category name is required.');
    if (!isNew && newName !== catName) delete DATA.skills[catName];
    DATA.skills[newName] = list;
    setDirty(true); closeModal(); rerender();
  };
}

function modalProject(idx) {
  const isNew = idx === null;
  const p = isNew ? { title:'', description:'', link:'', image:'' } : DATA.projects[idx];
  openModal(`
    <h3>${isNew ? 'Add project' : 'Edit project'}</h3>
    ${imageField('Screenshot', 'f-image', p.image)}
    ${field('Title', 'f-title', p.title)}
    ${field('Description', 'f-desc', p.description, 'textarea')}
    ${field('Link (optional)', 'f-link', p.link)}
    <div class="modal-actions">
      ${!isNew ? '<button class="btn danger" id="del" style="margin-right:auto;">Delete</button>' : ''}
      <button class="btn" id="cancel">Cancel</button>
      <button class="btn primary" id="save">Save</button>
    </div>
  `);
  document.getElementById('cancel').onclick = closeModal;
  if (!isNew) document.getElementById('del').onclick = () => {
    if (confirm('Delete this project?')) { DATA.projects.splice(idx,1); setDirty(true); closeModal(); rerender(); }
  };
  document.getElementById('save').onclick = async () => {
    const title = document.getElementById('f-title').value;
    let image = p.image;
    const fileInput = document.getElementById('f-image');
    const img = await readImageFile(fileInput);
    if (img) {
      setBusy(true, 'uploading image…');
      try {
        const path = `${SITE_CONFIG.imagesFolder}/${slug(title)}-${Date.now()}.jpg`;
        await GH.putImage(path, img.dataUrl, 'Add project image: ' + title);
        image = path;
      } catch (e) { alert('Image upload failed: ' + e.message); }
      setBusy(false);
    }
    const obj = {
      title,
      description: document.getElementById('f-desc').value,
      link: document.getElementById('f-link').value,
      image,
    };
    if (isNew) DATA.projects.push(obj); else DATA.projects[idx] = obj;
    setDirty(true); closeModal(); rerender();
  };
}

function modalCert(idx) {
  const isNew = idx === null;
  const c = isNew ? { name:'', issuer:'', date:'', link:'' } : DATA.certifications[idx];
  openModal(`
    <h3>${isNew ? 'Add certification' : 'Edit certification'}</h3>
    ${field('Name', 'f-name', c.name)}
    ${field('Date (optional)', 'f-date', c.date)}
    ${field('Link (optional)', 'f-link', c.link)}
    <div class="modal-actions">
      ${!isNew ? '<button class="btn danger" id="del" style="margin-right:auto;">Delete</button>' : ''}
      <button class="btn" id="cancel">Cancel</button>
      <button class="btn primary" id="save">Save</button>
    </div>
  `);
  document.getElementById('cancel').onclick = closeModal;
  if (!isNew) document.getElementById('del').onclick = () => {
    if (confirm('Delete this certification?')) { DATA.certifications.splice(idx,1); setDirty(true); closeModal(); rerender(); }
  };
  document.getElementById('save').onclick = () => {
    const obj = { name: document.getElementById('f-name').value, date: document.getElementById('f-date').value, link: document.getElementById('f-link').value };
    if (isNew) DATA.certifications.push(obj); else DATA.certifications[idx] = obj;
    setDirty(true); closeModal(); rerender();
  };
}

function modalEducation(idx) {
  const isNew = idx === null;
  const e = isNew ? { school:'', location:'', degree:'', start:'', end:'' } : DATA.education[idx];
  openModal(`
    <h3>${isNew ? 'Add education' : 'Edit education'}</h3>
    ${field('School', 'f-school', e.school)}
    ${field('Location', 'f-loc', e.location)}
    ${field('Degree', 'f-degree', e.degree)}
    ${field('Start year', 'f-start', e.start)}
    ${field('End year', 'f-end', e.end)}
    <div class="modal-actions">
      ${!isNew ? '<button class="btn danger" id="del" style="margin-right:auto;">Delete</button>' : ''}
      <button class="btn" id="cancel">Cancel</button>
      <button class="btn primary" id="save">Save</button>
    </div>
  `);
  document.getElementById('cancel').onclick = closeModal;
  if (!isNew) document.getElementById('del').onclick = () => {
    if (confirm('Delete this education entry?')) { DATA.education.splice(idx,1); setDirty(true); closeModal(); rerender(); }
  };
  document.getElementById('save').onclick = () => {
    const obj = {
      school: document.getElementById('f-school').value,
      location: document.getElementById('f-loc').value,
      degree: document.getElementById('f-degree').value,
      start: document.getElementById('f-start').value,
      end: document.getElementById('f-end').value,
    };
    if (isNew) DATA.education.push(obj); else DATA.education[idx] = obj;
    setDirty(true); closeModal(); rerender();
  };
}

function modalContact() {
  const c = DATA.contact;
  openModal(`
    <h3>Edit contact</h3>
    ${field('Email', 'f-email', c.email)}
    ${field('Phone', 'f-phone', c.phone)}
    ${field('LinkedIn URL', 'f-linkedin', c.linkedin)}
    ${field('GitHub URL', 'f-github', c.github)}
    <div class="modal-actions">
      <button class="btn" id="cancel">Cancel</button>
      <button class="btn primary" id="save">Save</button>
    </div>
  `);
  document.getElementById('cancel').onclick = closeModal;
  document.getElementById('save').onclick = () => {
    c.email = document.getElementById('f-email').value;
    c.phone = document.getElementById('f-phone').value;
    c.linkedin = document.getElementById('f-linkedin').value;
    c.github = document.getElementById('f-github').value;
    setDirty(true); closeModal(); rerender();
  };
}

function modalCustomSection() {
  openModal(`
    <h3>Add a new section</h3>
    ${field('Section title (e.g. "Publications", "Volunteering")', 'f-title', '')}
    <div class="modal-actions">
      <button class="btn" id="cancel">Cancel</button>
      <button class="btn primary" id="save">Create section</button>
    </div>
  `);
  document.getElementById('cancel').onclick = closeModal;
  document.getElementById('save').onclick = () => {
    const title = document.getElementById('f-title').value.trim();
    if (!title) return alert('Give the section a title.');
    DATA.customSections.push({ id: slug(title), title, items: [] });
    setDirty(true); closeModal(); rerender();
  };
}

function removeCustomSection(custIdx) {
  if (!confirm('Remove this entire section and everything in it?')) return;
  DATA.customSections.splice(custIdx, 1);
  setDirty(true); rerender();
}

function modalCustomItem(custIdx, itemIdx) {
  const section = DATA.customSections[custIdx];
  const isNew = itemIdx === null;
  const it = isNew ? { heading:'', subheading:'', body:'' } : section.items[itemIdx];
  openModal(`
    <h3>${isNew ? 'Add item to "' + esc(section.title) + '"' : 'Edit item'}</h3>
    ${field('Heading', 'f-heading', it.heading)}
    ${field('Subheading (optional)', 'f-sub', it.subheading)}
    ${field('Details (optional)', 'f-body', it.body, 'textarea')}
    <div class="modal-actions">
      ${!isNew ? '<button class="btn danger" id="del" style="margin-right:auto;">Delete</button>' : ''}
      <button class="btn" id="cancel">Cancel</button>
      <button class="btn primary" id="save">Save</button>
    </div>
  `);
  document.getElementById('cancel').onclick = closeModal;
  if (!isNew) document.getElementById('del').onclick = () => {
    if (confirm('Delete this item?')) { section.items.splice(itemIdx,1); setDirty(true); closeModal(); rerender(); }
  };
  document.getElementById('save').onclick = () => {
    const obj = { heading: document.getElementById('f-heading').value, subheading: document.getElementById('f-sub').value, body: document.getElementById('f-body').value };
    if (isNew) section.items.push(obj); else section.items[itemIdx] = obj;
    setDirty(true); closeModal(); rerender();
  };
}

wireChrome();
boot();
