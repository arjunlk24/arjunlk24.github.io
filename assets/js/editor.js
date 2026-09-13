/* ============================================================
   editor.js — powers editor.html
   ============================================================ */

let DATA = null;
let DIRTY = false;
const LOCAL_CACHE_KEY = 'portfolio_local_cache_v2';

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

/* ---------------- boot ---------------- */
async function boot() {
  if (!GH.hasToken()) { showGate(); return; }
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
      <h1>Connect to GitHub</h1>
      <p>Paste your Personal Access Token. It's stored only in this browser and is only ever sent to api.github.com.</p>
      <div class="field"><label>GitHub token</label><input type="password" id="token-input" placeholder="github_pat_..."></div>
      ${prefillError ? `<p style="color:#e06666;font-size:13px;">${esc(prefillError)}</p>` : ''}
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
      GH.clearToken();
      showGate('Your saved token no longer works. Please paste a working token.');
      return;
    }
    const cached = localStorage.getItem(LOCAL_CACHE_KEY);
    if (cached) { DATA = JSON.parse(cached); alert('Could not reach GitHub, showing your last local draft instead.\n' + e.message); }
    else { showGate('Could not load your content: ' + e.message); return; }
  }
  DATA.infoCards = DATA.infoCards || [];
  DATA.projects = DATA.projects || [];
  DATA.skills = DATA.skills || { cyberText: '', programmingText: '', techLogos: [] };
  DATA.certifications = DATA.certifications || { images: [] };
  DATA.socials = DATA.socials || {};
  setDirty(false);
  rerender();
}

/* ---------------- save / deploy ---------------- */
function handleGithubError(prefix, e) {
  const msg = String(e.message || '');
  const isAuthError = msg.includes('401') || msg.includes('403') || msg.includes('Bad credentials') || msg.includes('not accessible by personal access token');
  if (isAuthError) {
    GH.clearToken();
    alert(prefix + ' — your token isn\'t working. Please reconnect.');
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
  } catch (e) { handleGithubError('Save failed', e); }
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
  } catch (e) { handleGithubError('Deploy failed', e); }
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
}
function closeModal() { const m = document.getElementById('active-modal'); if (m) m.remove(); }
function field(label, id, value, type) {
  if (type === 'textarea') return `<div class="field"><label>${esc(label)}</label><textarea id="${id}">${esc(value||'')}</textarea></div>`;
  return `<div class="field"><label>${esc(label)}</label><input id="${id}" type="text" value="${esc(value||'')}"></div>`;
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
function slug(str) { return (str||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'item'; }

// asterisk convention: *word* -> gradient span
function parseGradientText(str) {
  const parts = [];
  const re = /\*([^*]+)\*|([^*]+)/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    if (m[1] !== undefined) parts.push({ text: m[1], gradient: true });
    else if (m[2] !== undefined) parts.push({ text: m[2] });
  }
  return parts;
}
function toGradientSource(parts) {
  return (parts||[]).map(p => p.gradient ? `*${p.text}*` : p.text).join('');
}

/* ---------------- action router ---------------- */
root.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  const entryEl = btn.closest('[data-index]');
  const idx = entryEl ? parseInt(entryEl.getAttribute('data-index'), 10) : null;

  const handlers = {
    'edit-profile': () => modalProfile(),
    'edit-socials': () => modalSocials(),
    'edit-infocard': () => modalInfoCard(idx),
    'add-project': () => modalProject(null),
    'edit-project': () => modalProject(idx),
    'edit-skills': () => modalSkills(),
    'edit-techlogos': () => modalTechLogos(),
    'add-techlogo': () => modalTechLogos(),
    'add-cert': () => modalAddCert(),
    'remove-last-cert': () => removeLastCert(),
    'edit-contact': () => modalContact(),
  };
  if (handlers[action]) handlers[action]();
});

function wireChrome() {
  document.getElementById('save-btn').onclick = saveChanges;
  document.getElementById('deploy-btn').onclick = deploy;
  document.getElementById('logout-btn').onclick = () => {
    if (confirm('Disconnect this browser from GitHub?')) { GH.clearToken(); location.reload(); }
  };
  document.getElementById('preview-btn').onclick = () => window.open('index.html', '_blank');
}

/* ---------------- modals ---------------- */
function modalProfile() {
  const p = DATA.profile;
  openModal(`
    <h3>Edit hero / profile</h3>
    ${imageField('Logo (top-left)', 'f-logo', p.logo)}
    ${field('First name', 'f-first', p.firstName)}
    ${field('Last name', 'f-last', p.lastName)}
    ${field('Tagline (pill above heading)', 'f-tagline', p.tagline)}
    <div class="field"><label>Hero heading — wrap words in *asterisks* for the gradient color</label>
      <input id="f-title" type="text" value="${esc(toGradientSource(p.heroTitle))}"></div>
    ${field('Summary paragraph', 'f-summary', p.heroSummary, 'textarea')}
    ${field('CV button text', 'f-ctatext', p.ctaText)}
    ${field('CV link (URL to your resume PDF, optional)', 'f-ctalink', p.ctaLink)}
    <div class="modal-actions"><button class="btn" id="cancel">Cancel</button><button class="btn primary" id="save">Save</button></div>
  `);
  document.getElementById('cancel').onclick = closeModal;
  document.getElementById('save').onclick = async () => {
    const img = await readImageFile(document.getElementById('f-logo'));
    if (img) {
      setBusy(true, 'uploading logo…');
      try {
        const path = `${SITE_CONFIG.imagesFolder}/profile3.png`;
        await GH.putImage(path, img.dataUrl, 'Update logo');
        p.logo = path + '?v=' + Date.now();
      } catch (e) { alert('Logo upload failed: ' + e.message); }
      setBusy(false);
    }
    p.firstName = document.getElementById('f-first').value;
    p.lastName = document.getElementById('f-last').value;
    p.tagline = document.getElementById('f-tagline').value;
    p.heroTitle = parseGradientText(document.getElementById('f-title').value);
    p.heroSummary = document.getElementById('f-summary').value;
    p.ctaText = document.getElementById('f-ctatext').value;
    p.ctaLink = document.getElementById('f-ctalink').value;
    setDirty(true); closeModal(); rerender();
  };
}

function modalSocials() {
  const s = DATA.socials;
  openModal(`
    <h3>Edit social links</h3>
    ${field('YouTube URL', 'f-yt', s.youtube)}
    ${field('GitHub URL', 'f-gh', s.github)}
    ${field('LinkedIn URL', 'f-li', s.linkedin)}
    ${field('Instagram URL', 'f-ig', s.instagram)}
    <div class="modal-actions"><button class="btn" id="cancel">Cancel</button><button class="btn primary" id="save">Save</button></div>
  `);
  document.getElementById('cancel').onclick = closeModal;
  document.getElementById('save').onclick = () => {
    s.youtube = document.getElementById('f-yt').value;
    s.github = document.getElementById('f-gh').value;
    s.linkedin = document.getElementById('f-li').value;
    s.instagram = document.getElementById('f-ig').value;
    setDirty(true); closeModal(); rerender();
  };
}

function modalInfoCard(idx) {
  const c = DATA.infoCards[idx];
  const media = c.media || { type: 'none' };
  openModal(`
    <h3>Edit card</h3>
    ${field('Heading', 'f-heading', c.heading)}
    ${field('Text', 'f-text', c.text, 'textarea')}
    <div class="field"><label>Media type</label>
      <select id="f-mtype">
        <option value="none" ${media.type==='none'?'selected':''}>None</option>
        <option value="image" ${media.type==='image'?'selected':''}>Image</option>
        <option value="video" ${media.type==='video'?'selected':''}>Video (already in repo)</option>
      </select>
    </div>
    <div id="media-fields">
      ${media.type==='image' ? imageField('Upload image', 'f-image', media.src) : ''}
      ${media.type==='video' ? field('Video path (e.g. assets/media/glob.mp4)', 'f-video', media.src) : ''}
    </div>
    ${field('Button text (optional)', 'f-btntext', c.buttonText)}
    ${field('Button link (optional, e.g. #contact)', 'f-btnhref', c.buttonHref)}
    <div class="modal-actions"><button class="btn" id="cancel">Cancel</button><button class="btn primary" id="save">Save</button></div>
  `);
  document.getElementById('f-mtype').onchange = (e) => {
    const t = e.target.value;
    const box = document.getElementById('media-fields');
    if (t === 'image') box.innerHTML = imageField('Upload image', 'f-image', media.type==='image'?media.src:'');
    else if (t === 'video') box.innerHTML = field('Video path (e.g. assets/media/glob.mp4)', 'f-video', media.type==='video'?media.src:'');
    else box.innerHTML = '';
  };
  document.getElementById('cancel').onclick = closeModal;
  document.getElementById('save').onclick = async () => {
    c.heading = document.getElementById('f-heading').value;
    c.text = document.getElementById('f-text').value;
    c.buttonText = document.getElementById('f-btntext').value;
    c.buttonHref = document.getElementById('f-btnhref').value;
    const type = document.getElementById('f-mtype').value;
    if (type === 'none') { c.media = { type: 'none' }; }
    else if (type === 'video') { c.media = { type: 'video', src: document.getElementById('f-video').value }; }
    else if (type === 'image') {
      const fileInput = document.getElementById('f-image');
      const img = fileInput ? await readImageFile(fileInput) : null;
      let src = media.type === 'image' ? media.src : '';
      if (img) {
        setBusy(true, 'uploading image…');
        try {
          const path = `${SITE_CONFIG.imagesFolder}/card-${idx}-${Date.now()}.jpg`;
          await GH.putImage(path, img.dataUrl, 'Update card image');
          src = path;
        } catch (e) { alert('Image upload failed: ' + e.message); }
        setBusy(false);
      }
      c.media = { type: 'image', src };
    }
    setDirty(true); closeModal(); rerender();
  };
}

function modalProject(idx) {
  const isNew = idx === null;
  const p = isNew ? { title:'', titleHighlight:'', titleRest:'', description:'', media:{type:'none'}, link:'' } : DATA.projects[idx];
  const media = p.media || { type: 'none' };
  openModal(`
    <h3>${isNew ? 'Add project' : 'Edit project'}</h3>
    <div class="field"><label>Title — wrap the first part in *asterisks* for the gradient color</label>
      <input id="f-title" type="text" value="${esc((p.titleHighlight?`*${p.titleHighlight}*`:'') + (p.titleRest||(!p.titleHighlight?p.title:'')))}"></div>
    ${field('Description', 'f-desc', p.description, 'textarea')}
    <div class="field"><label>Media type</label>
      <select id="f-mtype">
        <option value="none" ${media.type==='none'?'selected':''}>None</option>
        <option value="image" ${media.type==='image'?'selected':''}>Image</option>
        <option value="video" ${media.type==='video'?'selected':''}>Video (already in repo)</option>
      </select>
    </div>
    <div id="media-fields">
      ${media.type==='image' ? imageField('Upload image', 'f-image', media.src) : ''}
      ${media.type==='video' ? field('Video path (e.g. assets/media/project1.mp4)', 'f-video', media.src) : ''}
    </div>
    ${field('Link (optional)', 'f-link', p.link)}
    <div class="modal-actions">
      ${!isNew ? '<button class="btn danger" id="del" style="margin-right:auto;">Delete</button>' : ''}
      <button class="btn" id="cancel">Cancel</button><button class="btn primary" id="save">Save</button>
    </div>
  `);
  document.getElementById('f-mtype').onchange = (e) => {
    const t = e.target.value;
    const box = document.getElementById('media-fields');
    if (t === 'image') box.innerHTML = imageField('Upload image', 'f-image', media.type==='image'?media.src:'');
    else if (t === 'video') box.innerHTML = field('Video path', 'f-video', media.type==='video'?media.src:'');
    else box.innerHTML = '';
  };
  document.getElementById('cancel').onclick = closeModal;
  if (!isNew) document.getElementById('del').onclick = () => {
    if (confirm('Delete this project?')) { DATA.projects.splice(idx,1); setDirty(true); closeModal(); rerender(); }
  };
  document.getElementById('save').onclick = async () => {
    const parts = parseGradientText(document.getElementById('f-title').value);
    const highlight = parts.find(x=>x.gradient);
    const obj = {
      title: parts.map(x=>x.text).join(''),
      titleHighlight: highlight ? highlight.text : '',
      titleRest: parts.filter(x=>!x.gradient).map(x=>x.text).join(''),
      description: document.getElementById('f-desc').value,
      link: document.getElementById('f-link').value,
      media: { type: 'none' },
    };
    const type = document.getElementById('f-mtype').value;
    if (type === 'video') obj.media = { type: 'video', src: document.getElementById('f-video').value };
    else if (type === 'image') {
      const fileInput = document.getElementById('f-image');
      const img = fileInput ? await readImageFile(fileInput) : null;
      let src = media.type === 'image' ? media.src : '';
      if (img) {
        setBusy(true, 'uploading image…');
        try {
          const path = `${SITE_CONFIG.imagesFolder}/project-${slug(obj.title)}-${Date.now()}.jpg`;
          await GH.putImage(path, img.dataUrl, 'Add project image');
          src = path;
        } catch (e) { alert('Image upload failed: ' + e.message); }
        setBusy(false);
      }
      obj.media = { type: 'image', src };
    }
    if (isNew) DATA.projects.push(obj); else DATA.projects[idx] = obj;
    setDirty(true); closeModal(); rerender();
  };
}

function modalSkills() {
  const s = DATA.skills;
  openModal(`
    <h3>Edit skills text</h3>
    ${imageField('Brain graphic', 'f-brain', DATA.profile.brainImage || 'images/digital_brain.png')}
    ${field('Cyber Security description', 'f-cyber', s.cyberText, 'textarea')}
    ${field('Programming description', 'f-prog', s.programmingText, 'textarea')}
    <div class="modal-actions"><button class="btn" id="cancel">Cancel</button><button class="btn primary" id="save">Save</button></div>
  `);
  document.getElementById('cancel').onclick = closeModal;
  document.getElementById('save').onclick = async () => {
    const img = await readImageFile(document.getElementById('f-brain'));
    if (img) {
      setBusy(true, 'uploading image…');
      try {
        const path = `${SITE_CONFIG.imagesFolder}/digital_brain.png`;
        await GH.putImage(path, img.dataUrl, 'Update brain graphic');
        DATA.profile.brainImage = path + '?v=' + Date.now();
      } catch (e) { alert('Upload failed: ' + e.message); }
      setBusy(false);
    }
    s.cyberText = document.getElementById('f-cyber').value;
    s.programmingText = document.getElementById('f-prog').value;
    setDirty(true); closeModal(); rerender();
  };
}

function modalTechLogos() {
  const logos = DATA.skills.techLogos || [];
  openModal(`
    <h3>Tech stack icons</h3>
    <div id="logo-list" style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
      ${logos.map((src,i) => `<div style="position:relative;"><img src="${esc(src)}" style="width:56px;height:56px;object-fit:contain;border:1px solid #333;border-radius:8px;background:#111;">
        <button data-i="${i}" class="btn danger remove-logo" style="position:absolute;top:-8px;right:-8px;width:22px;height:22px;padding:0;border-radius:50%;font-size:11px;">x</button></div>`).join('') || '<span style="color:#888;font-size:13px;">None yet</span>'}
    </div>
    ${imageField('Add a new icon', 'f-newlogo', null)}
    <div class="modal-actions"><button class="btn" id="cancel">Cancel</button><button class="btn primary" id="save">Add & Save</button></div>
  `);
  document.getElementById('cancel').onclick = closeModal;
  document.querySelectorAll('.remove-logo').forEach(b => b.onclick = () => {
    const i = parseInt(b.getAttribute('data-i'), 10);
    logos.splice(i, 1);
    setDirty(true); closeModal(); rerender();
  });
  document.getElementById('save').onclick = async () => {
    const img = await readImageFile(document.getElementById('f-newlogo'));
    if (img) {
      setBusy(true, 'uploading icon…');
      try {
        const path = `${SITE_CONFIG.imagesFolder}/logo-${Date.now()}.png`;
        await GH.putImage(path, img.dataUrl, 'Add tech logo');
        logos.push(path);
      } catch (e) { alert('Upload failed: ' + e.message); }
      setBusy(false);
    }
    DATA.skills.techLogos = logos;
    setDirty(true); closeModal(); rerender();
  };
}

function modalAddCert() {
  openModal(`
    <h3>Add certificate</h3>
    ${imageField('Certificate image', 'f-cert', null)}
    <div class="modal-actions"><button class="btn" id="cancel">Cancel</button><button class="btn primary" id="save">Add</button></div>
  `);
  document.getElementById('cancel').onclick = closeModal;
  document.getElementById('save').onclick = async () => {
    const img = await readImageFile(document.getElementById('f-cert'));
    if (!img) return closeModal();
    setBusy(true, 'uploading certificate…');
    try {
      const path = `${SITE_CONFIG.imagesFolder}/cert-${Date.now()}.jpg`;
      await GH.putImage(path, img.dataUrl, 'Add certificate');
      DATA.certifications.images.push(path);
    } catch (e) { alert('Upload failed: ' + e.message); }
    setBusy(false);
    setDirty(true); closeModal(); rerender();
  };
}
function removeLastCert() {
  if (!DATA.certifications.images.length) return;
  if (!confirm('Remove the most recently added certificate?')) return;
  DATA.certifications.images.pop();
  setDirty(true); rerender();
}

function modalContact() {
  const c = DATA.contact;
  openModal(`
    <h3>Edit contact</h3>
    ${field('Phone', 'f-phone', c.phone)}
    ${field('Email (also used for the contact form)', 'f-email', c.email)}
    ${field('LinkedIn URL', 'f-li', c.linkedin)}
    ${field('GitHub URL', 'f-gh', c.github)}
    <div class="modal-actions"><button class="btn" id="cancel">Cancel</button><button class="btn primary" id="save">Save</button></div>
  `);
  document.getElementById('cancel').onclick = closeModal;
  document.getElementById('save').onclick = () => {
    c.phone = document.getElementById('f-phone').value;
    c.email = document.getElementById('f-email').value;
    c.linkedin = document.getElementById('f-li').value;
    c.github = document.getElementById('f-gh').value;
    setDirty(true); closeModal(); rerender();
  };
}

wireChrome();
boot();
