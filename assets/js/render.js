/* ============================================================
   render.js — turns a `data` object into the whole page.
   Used identically by index.html (editable:false) and
   editor.html (editable:true). Never edit data.json by hand
   if you can avoid it — use the editor.
   ============================================================ */

function esc(str) {
  if (str === undefined || str === null) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function fabButton(action, label) {
  return `<button class="edit-fab" data-action="${action}" title="${esc(label)}">${label === 'edit' ? '&#9998;' : '+'}</button>`;
}

const SECTION_DEFS = [
  { key: 'experience', path: '~/experience', title: 'Experience', icon: 'briefcase' },
  { key: 'skills',      path: '~/skills',     title: 'Skills', icon: 'terminal' },
  { key: 'projects',    path: '~/projects',   title: 'Projects', icon: 'folder' },
  { key: 'certifications', path: '~/certifications', title: 'Certifications', icon: 'award' },
  { key: 'education',   path: '~/education',  title: 'Education', icon: 'cap' },
];

const ICONS = {
  briefcase: '<path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 12h18"/>',
  terminal: '<polyline points="4 6 9 12 4 18"/><line x1="11" y1="18" x2="20" y2="18"/>',
  folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M9 13.5 7 22l5-3 5 3-2-8.5"/>',
  cap: '<path d="M2 9 12 4l10 5-10 5-10-5z"/><path d="M6 11.5v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4"/>',
  shield: '<path d="M12 3 4 6v6c0 4.4 3.4 8.3 8 9 4.6-.7 8-4.6 8-9V6z"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
};
function icon(name, cls) {
  const body = ICONS[name] || '';
  return `<svg class="icon ${cls||''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

const SKILL_CAT_ICONS = {
  'Tools & Platforms': 'terminal',
  'Security Domains': 'shield',
  'Frameworks': 'layers',
  'Soft Skills': 'users',
};

function renderApp(root, data, editable) {
  root.setAttribute('data-editable', editable ? 'true' : 'false');
  document.documentElement.setAttribute('data-theme', data.theme || 'console-teal');

  root.innerHTML = `
    <div class="app-shell">
      ${renderSidebar(data, editable)}
      <div>
        <main>
          ${renderHero(data, editable)}
          <section class="block editable-target reveal" id="experience" data-section="experience">
            ${sectionHeader('~/experience', 'Experience', editable, 'add-experience', 'briefcase')}
            <div id="experience-list">${renderExperience(data.experience, editable)}</div>
          </section>

          <section class="block editable-target reveal" id="skills" data-section="skills">
            ${sectionHeader('~/skills', 'Skills', editable, 'add-skill-group', 'terminal')}
            <div id="skills-list">${renderSkills(data.skills, editable)}</div>
          </section>

          <section class="block editable-target reveal" id="projects" data-section="projects">
            ${sectionHeader('~/projects', 'Projects', editable, 'add-project', 'folder')}
            <div id="projects-list">${renderProjects(data.projects, editable)}</div>
          </section>

          <section class="block editable-target reveal" id="certifications" data-section="certifications">
            ${sectionHeader('~/certifications', 'Certifications', editable, 'add-cert', 'award')}
            <div id="cert-list">${renderCerts(data.certifications, editable)}</div>
          </section>

          <section class="block editable-target reveal" id="education" data-section="education">
            ${sectionHeader('~/education', 'Education', editable, 'add-education', 'cap')}
            <div id="education-list">${renderEducation(data.education, editable)}</div>
          </section>

          ${(data.customSections || []).map((s, i) => renderCustomSection(s, i, editable)).join('')}

          ${editable ? `<div class="add-section-row"><button class="add-section-btn" data-action="add-custom-section">+ Add a new section</button></div>` : ''}

          <section class="block editable-target reveal" id="contact" data-section="contact">
            ${sectionHeader('~/contact', 'Contact', editable, 'edit-contact', 'mail')}
            ${renderContact(data.contact, editable)}
          </section>
        </main>
        <footer>&copy; ${new Date().getFullYear()} ${esc(data.profile.name)}. Built with a hand-rolled static portfolio system.</footer>
      </div>
    </div>
  `;
  initDynamics(root);
  initTyping(root, data.profile.typing_phrases);
}

function sectionHeader(path, title, editable, addAction, iconName) {
  return `<h2><span>${iconName ? icon(iconName, 'h2-icon') : ''}<span class="path">${path}</span> ${title}</span>${editable ? `<button class="section-add-btn" data-action="${addAction}" title="Add">+</button>` : ''}</h2>`;
}

function renderSidebar(data, editable) {
  const p = data.profile;
  const navItems = [
    { path: '~/about', href: '#about' },
    ...SECTION_DEFS.map(s => ({ path: s.path, href: '#' + s.key })),
    ...(data.customSections || []).map(s => ({ path: '~/' + (s.id || 'section'), href: '#custom-' + s.id })),
    { path: '~/contact', href: '#contact' },
  ];
  return `
    <aside class="sidebar">
      <div class="identity">
        <div class="avatar-wrap editable-target">
          <img src="${esc(p.photo || '')}" alt="${esc(p.name)}" onerror="this.style.opacity=0">
          ${editable ? fabButton('edit-photo', 'edit') : ''}
        </div>
        <div class="identity-text">
          <div class="name">${esc(p.name)}</div>
          <div class="role">${esc(p.role)}</div>
        </div>
      </div>
      <div class="status-line"><span class="status-dot blink"></span> online — open to opportunities</div>
      <nav class="nav-tree">
        ${navItems.map(n => `<a href="${n.href}">${n.path}</a>`).join('')}
      </nav>
      <div class="sidebar-contact">
        ${data.contact.email ? `<a href="mailto:${esc(data.contact.email)}">${esc(data.contact.email)}</a>` : ''}
        ${data.contact.github ? `<a href="${esc(data.contact.github)}" target="_blank" rel="noopener">GitHub</a>` : ''}
        ${data.contact.linkedin ? `<a href="${esc(data.contact.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ''}
      </div>
      ${editable ? `
      <div class="theme-picker">
        theme:
        <button data-theme-btn="console-teal" class="${data.theme==='console-teal'?'active':''}" title="Console — Teal"></button>
        <button data-theme-btn="console-amber" class="${data.theme==='console-amber'?'active':''}" title="Console — Amber"></button>
        <button data-theme-btn="daylight-slate" class="${data.theme==='daylight-slate'?'active':''}" title="Daylight — Slate"></button>
      </div>` : ''}
    </aside>
  `;
}

function heroArt() {
  // Decorative network graph — nodes pulse gently, evokes a SOC / network monitoring board.
  const nodes = [
    [40, 30], [140, 15], [230, 55], [90, 90], [190, 110], [30, 130], [250, 20]
  ];
  const edges = [[0,3],[3,1],[1,2],[2,4],[3,5],[1,6],[4,2]];
  const pts = nodes.map(([x,y]) => `<circle class="net-node" cx="${x}" cy="${y}" r="3.2"/>`).join('');
  const lines = edges.map(([a,b]) => `<line class="net-edge" x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}"/>`).join('');
  return `<svg class="hero-art" viewBox="0 0 270 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${lines}${pts}</svg>`;
}

function renderHero(data, editable) {
  const p = data.profile;
  const bootHtml = (p.boot_lines || []).map((l, i) =>
    `<span class="line">${i === 0 ? '<span class="prompt">$</span> ' : ''}${esc(l)}</span>`
  ).join('') + '<span class="line blink">_</span>';
  const hasTyping = Array.isArray(p.typing_phrases) && p.typing_phrases.length > 0;
  return `
    <div class="hero editable-target" id="about">
      ${heroArt()}
      <div class="boot">${bootHtml}</div>
      <h1>${esc(p.name)}</h1>
      <p class="summary">${esc(p.summary)}</p>
      ${hasTyping ? `<div class="typing-line"><span class="prompt">&gt;</span><span id="typing-text"></span><span class="blink">_</span></div>` : ''}
      ${editable ? fabButton('edit-profile', 'edit') : ''}
    </div>
  `;
}

function renderExperience(list, editable) {
  if (!list || !list.length) return emptyState('No experience logged yet.', editable);
  return list.map((e, i) => `
    <div class="entry editable-target" data-index="${i}">
      ${editable ? fabButton('edit-experience', 'edit') : ''}
      <div class="entry-head">
        <div>
          <div class="org">${esc(e.org)}</div>
          <div class="title">${esc(e.title)}</div>
        </div>
        <div class="dates">${esc(e.start)} — ${esc(e.end)}</div>
      </div>
      <ul>${(e.bullets || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
    </div>
  `).join('');
}

function renderSkills(skills, editable) {
  const cats = Object.keys(skills || {});
  if (!cats.length) return emptyState('No skills added yet.', editable);
  return cats.map(cat => `
    <div class="skill-group editable-target" data-cat="${esc(cat)}">
      ${editable ? fabButton('edit-skill-group', 'edit') : ''}
      <div class="cat">${icon(SKILL_CAT_ICONS[cat] || 'terminal', 'cat-icon')}${esc(cat)}</div>
      <div class="tag-row">${skills[cat].map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div>
    </div>
  `).join('');
}

function renderProjects(list, editable) {
  if (!list || !list.length) {
    return `<div class="empty-state">no projects logged yet${editable ? ' — click the + above to add your first one' : ''}</div>`;
  }
  return `<div class="project-grid">${list.map((p, i) => `
    <div class="project-card editable-target" data-index="${i}">
      ${editable ? fabButton('edit-project', 'edit') : ''}
      <div class="thumb">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title)}">` : 'no image'}</div>
      <div class="body">
        <div class="p-title">${esc(p.title)}</div>
        <div class="p-desc">${esc(p.description)}</div>
        ${p.link ? `<a class="p-link" href="${esc(p.link)}" target="_blank" rel="noopener">view →</a>` : ''}
      </div>
    </div>
  `).join('')}</div>`;
}

function renderCerts(list, editable) {
  if (!list || !list.length) return emptyState('No certifications yet.', editable);
  return `<div class="badge-row">${list.map((c, i) => `
    <div class="badge editable-target" data-index="${i}">
      ${editable ? fabButton('edit-cert', 'edit') : ''}
      <span class="dot"></span>
      ${c.link ? `<a href="${esc(c.link)}" target="_blank" rel="noopener">${esc(c.name)}</a>` : esc(c.name)}
      ${c.date ? `<span style="color:var(--muted)">— ${esc(c.date)}</span>` : ''}
    </div>
  `).join('')}</div>`;
}

function renderEducation(list, editable) {
  if (!list || !list.length) return emptyState('No education added yet.', editable);
  return list.map((e, i) => `
    <div class="edu-item editable-target" data-index="${i}">
      ${editable ? fabButton('edit-education', 'edit') : ''}
      <div class="school">${esc(e.school)}${e.location ? ' — ' + esc(e.location) : ''}</div>
      <div class="degree">${esc(e.degree)}</div>
      <div class="years">${esc(e.start)} – ${esc(e.end)}</div>
    </div>
  `).join('');
}

function renderCustomSection(section, index, editable) {
  return `
    <section class="block editable-target" data-section="custom-${section.id}" id="custom-${section.id}">
      ${sectionHeader('~/' + (section.id || 'section'), section.title || 'Section', editable, 'add-custom-item')}
      <div class="custom-items" data-custom-index="${index}">
        ${(section.items || []).map((it, i) => `
          <div class="entry editable-target" data-custom-index="${index}" data-item-index="${i}">
            ${editable ? fabButton('edit-custom-item', 'edit') : ''}
            <div class="entry-head">
              <div>
                <div class="org">${esc(it.heading)}</div>
                <div class="title">${esc(it.subheading || '')}</div>
              </div>
            </div>
            ${it.body ? `<p style="color:var(--muted);font-size:14.5px;margin:8px 0 0;">${esc(it.body)}</p>` : ''}
          </div>
        `).join('') || emptyState('Nothing here yet.', editable)}
      </div>
      ${editable ? `<div style="margin-top:10px;"><button class="btn danger" data-action="remove-custom-section" data-custom-index="${index}">Remove this section</button></div>` : ''}
    </section>
  `;
}

function renderContact(contact, editable) {
  const sent = typeof location !== 'undefined' && location.search.includes('sent=true');
  const nextUrl = typeof location !== 'undefined' ? location.href.split('?')[0] + '?sent=true' : '';
  return `
    <div class="contact-block editable-target">
      ${editable ? fabButton('edit-contact', 'edit') : ''}
      ${contact.email ? `<a class="contact-pill" href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>` : ''}
      ${contact.phone ? `<span class="contact-pill">${esc(contact.phone)}</span>` : ''}
      ${contact.linkedin ? `<a class="contact-pill" href="${esc(contact.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ''}
      ${contact.github ? `<a class="contact-pill" href="${esc(contact.github)}" target="_blank" rel="noopener">GitHub</a>` : ''}
    </div>
    ${contact.email ? `
    <form class="contact-form" action="https://formsubmit.co/${esc(contact.email)}" method="POST">
      <input type="hidden" name="_subject" value="New message from your portfolio site">
      <input type="hidden" name="_captcha" value="false">
      <input type="hidden" name="_next" value="${esc(nextUrl)}">
      <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
      ${sent ? `<div class="form-success">✓ Message sent — thanks for reaching out.</div>` : ''}
      <div class="field"><label>Name</label><input type="text" name="name" required></div>
      <div class="field"><label>Email</label><input type="email" name="email" required></div>
      <div class="field"><label>Message</label><textarea name="message" required></textarea></div>
      <button class="btn primary" type="submit">Send message</button>
    </form>` : ''}
  `;
}

function emptyState(msg, editable) {
  return `<div class="empty-state">${esc(msg)}${editable ? ' — use the + above to add one' : ''}</div>`;
}

/* ============================================================
   dynamics — scroll-reveal, scrollspy nav highlighting,
   progress bar, back-to-top. Re-initialised after every render
   since editor.html rebuilds the DOM on every edit.
   ============================================================ */
let _revealObserver = null;
let _spyObserver = null;

function initDynamics(root) {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reveal-on-scroll
  if (_revealObserver) _revealObserver.disconnect();
  const revealEls = root.querySelectorAll('.reveal');
  if (reduceMotion) {
    revealEls.forEach(el => el.classList.add('in-view'));
  } else {
    _revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          _revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => _revealObserver.observe(el));
  }

  // scrollspy — highlight the nav-tree link for whichever section is in view
  if (_spyObserver) _spyObserver.disconnect();
  const navLinks = root.querySelectorAll('.nav-tree a');
  const sections = Array.from(navLinks).map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  if (sections.length) {
    _spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
        }
      });
    }, { rootMargin: '0px 0px -72% 0px', threshold: 0 });
    sections.forEach(sec => _spyObserver.observe(sec));
  }

  initChrome();
  document.querySelector('.sidebar')?.classList.toggle('open', _sidebarOpen);
}

function initChrome() {
  if (window.__chromeInit) return;
  window.__chromeInit = true;
  const bar = document.getElementById('scroll-progress');
  const topBtn = document.getElementById('back-to-top');
  const onScroll = () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (scrolled / max) * 100 : 0;
    if (bar) bar.style.width = pct + '%';
    if (topBtn) topBtn.classList.toggle('show', scrolled > 500);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  if (topBtn) topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  onScroll();
  initMobileMenu();
}

/* ---------- mobile drawer sidebar ---------- */
let _sidebarOpen = false;
function initMobileMenu() {
  const btn = document.getElementById('menu-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!btn || window.__menuInit) return;
  window.__menuInit = true;
  function setOpen(v) {
    _sidebarOpen = v;
    document.querySelector('.sidebar')?.classList.toggle('open', v);
    backdrop?.classList.toggle('show', v);
  }
  btn.addEventListener('click', () => setOpen(!_sidebarOpen));
  backdrop?.addEventListener('click', () => setOpen(false));
  document.addEventListener('click', (e) => {
    if (e.target.closest('.nav-tree a')) setOpen(false);
  });
}

/* ---------- typing effect ---------- */
let _typingTimer = null;
function initTyping(root, phrases) {
  if (_typingTimer) { clearTimeout(_typingTimer); _typingTimer = null; }
  const el = root.querySelector('#typing-text');
  if (!el || !Array.isArray(phrases) || !phrases.length) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = phrases[0];
    return;
  }
  let phraseIdx = 0, charIdx = 0, deleting = false;
  function tick() {
    const current = phrases[phraseIdx % phrases.length];
    if (!deleting) {
      charIdx++;
      el.textContent = current.slice(0, charIdx);
      if (charIdx >= current.length) { deleting = true; _typingTimer = setTimeout(tick, 1400); return; }
      _typingTimer = setTimeout(tick, 65);
    } else {
      charIdx--;
      el.textContent = current.slice(0, charIdx);
      if (charIdx <= 0) { deleting = false; phraseIdx++; _typingTimer = setTimeout(tick, 400); return; }
      _typingTimer = setTimeout(tick, 35);
    }
  }
  tick();
}
