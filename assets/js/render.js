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
  { key: 'experience', path: '~/experience', title: 'Experience' },
  { key: 'skills',      path: '~/skills',     title: 'Skills' },
  { key: 'projects',    path: '~/projects',   title: 'Projects' },
  { key: 'certifications', path: '~/certifications', title: 'Certifications' },
  { key: 'education',   path: '~/education',  title: 'Education' },
];

function renderApp(root, data, editable) {
  root.setAttribute('data-editable', editable ? 'true' : 'false');
  document.documentElement.setAttribute('data-theme', data.theme || 'console-teal');

  root.innerHTML = `
    <div class="app-shell">
      ${renderSidebar(data, editable)}
      <div>
        <main>
          ${renderHero(data, editable)}
          <section class="block editable-target" data-section="experience">
            ${sectionHeader('~/experience', 'Experience', editable, 'add-experience')}
            <div id="experience-list">${renderExperience(data.experience, editable)}</div>
          </section>

          <section class="block editable-target" data-section="skills">
            ${sectionHeader('~/skills', 'Skills', editable, 'add-skill-group')}
            <div id="skills-list">${renderSkills(data.skills, editable)}</div>
          </section>

          <section class="block editable-target" data-section="projects">
            ${sectionHeader('~/projects', 'Projects', editable, 'add-project')}
            <div id="projects-list">${renderProjects(data.projects, editable)}</div>
          </section>

          <section class="block editable-target" data-section="certifications">
            ${sectionHeader('~/certifications', 'Certifications', editable, 'add-cert')}
            <div id="cert-list">${renderCerts(data.certifications, editable)}</div>
          </section>

          <section class="block editable-target" data-section="education">
            ${sectionHeader('~/education', 'Education', editable, 'add-education')}
            <div id="education-list">${renderEducation(data.education, editable)}</div>
          </section>

          ${(data.customSections || []).map((s, i) => renderCustomSection(s, i, editable)).join('')}

          ${editable ? `<div class="add-section-row"><button class="add-section-btn" data-action="add-custom-section">+ Add a new section</button></div>` : ''}

          <section class="block editable-target" data-section="contact">
            ${sectionHeader('~/contact', 'Contact', editable, 'edit-contact')}
            ${renderContact(data.contact, editable)}
          </section>
        </main>
        <footer>&copy; ${new Date().getFullYear()} ${esc(data.profile.name)}. Built with a hand-rolled static portfolio system.</footer>
      </div>
    </div>
  `;
}

function sectionHeader(path, title, editable, addAction) {
  return `<h2><span><span class="path">${path}</span> ${title}</span>${editable ? `<button class="section-add-btn" data-action="${addAction}" title="Add">+</button>` : ''}</h2>`;
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

function renderHero(data, editable) {
  const p = data.profile;
  const bootHtml = (p.boot_lines || []).map((l, i) =>
    `<span class="line">${i === 0 ? '<span class="prompt">$</span> ' : ''}${esc(l)}</span>`
  ).join('') + '<span class="line blink">_</span>';
  return `
    <div class="hero editable-target" id="about">
      <div class="boot">${bootHtml}</div>
      <h1>${esc(p.name)}</h1>
      <p class="summary">${esc(p.summary)}</p>
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
      <div class="cat">${esc(cat)}</div>
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
  return `
    <div class="contact-block editable-target">
      ${editable ? fabButton('edit-contact', 'edit') : ''}
      ${contact.email ? `<a class="contact-pill" href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>` : ''}
      ${contact.phone ? `<span class="contact-pill">${esc(contact.phone)}</span>` : ''}
      ${contact.linkedin ? `<a class="contact-pill" href="${esc(contact.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ''}
      ${contact.github ? `<a class="contact-pill" href="${esc(contact.github)}" target="_blank" rel="noopener">GitHub</a>` : ''}
    </div>
  `;
}

function emptyState(msg, editable) {
  return `<div class="empty-state">${esc(msg)}${editable ? ' — use the + above to add one' : ''}</div>`;
}
