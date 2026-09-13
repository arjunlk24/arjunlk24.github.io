/* ============================================================
   render.js — builds the whole page (original galaxy design)
   from data.json. Used by both index.html and editor.html.
   ============================================================ */

function esc(str) {
  if (str === undefined || str === null) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function fab(action, extra) {
  return `<button class="edit-fab" data-action="${action}" ${extra||''} title="edit">&#9998;</button>`;
}
function addBtn(action, extra) {
  return `<button class="section-add-btn" data-action="${action}" ${extra||''} title="add">+</button>`;
}

function renderApp(root, data, editable) {
  root.setAttribute('data-editable', editable ? 'true' : 'false');
  root.innerHTML = `
    <div class="container">
      <video class="back-vid" preload loop autoplay muted playsinline>
        <source src="assets/media/galaxy.webm" type="video/webm">
        <source src="assets/media/galaxy.mp4" type="video/mp4">
      </video>
      <header>
        <div class="left editable-target">
          <img src="${esc(data.profile.logo)}" alt="logo">
          <h1><span style="color:#72a1de;">${esc(data.profile.firstName)} </span>${esc(data.profile.lastName)}</h1>
          ${editable ? fab('edit-profile') : ''}
        </div>
        <button id="nav-toggle" aria-label="Menu">&#9776;</button>
        <ul id="nav-list">
          <li><a href="#about">About</a></li>
          <li><a href="#skills">Skills</a></li>
          <li><a href="#projects">Projects</a></li>
        </ul>
        <div class="box-icons editable-target">
          ${data.socials.youtube ? `<a href="${esc(data.socials.youtube)}" target="_blank" rel="noopener"><i class='bx bxl-youtube'></i></a>` : ''}
          ${data.socials.github ? `<a href="${esc(data.socials.github)}" target="_blank" rel="noopener"><i class='bx bxl-github'></i></a>` : ''}
          ${data.socials.linkedin ? `<a href="${esc(data.socials.linkedin)}" target="_blank" rel="noopener"><i class='bx bxl-linkedin-square'></i></a>` : ''}
          ${data.socials.instagram ? `<a href="${esc(data.socials.instagram)}" target="_blank" rel="noopener"><i class='bx bxl-instagram-alt'></i></a>` : ''}
          ${editable ? fab('edit-socials') : ''}
        </div>
      </header>

      <div class="blackhole-box">
        <video preload loop autoplay muted playsinline>
          <source src="assets/media/blackhole.webm" type="video/webm">
          <source src="assets/media/blackhole.mp4" type="video/mp4">
        </video>
      </div>

      <section class="hero" id="about">
        <div class="hero-info editable-target">
          <div class="hero-info-title"><i class='bx bxl-sketch'></i> ${esc(data.profile.tagline)}</div>
          <h1>${(data.profile.heroTitle||[]).map(p => p.gradient ? `<span class="gradient">${esc(p.text)}</span>` : esc(p.text)).join('')}</h1>
          <p>${esc(data.profile.heroSummary)}</p>
          ${data.profile.ctaLink ? `<a href="${esc(data.profile.ctaLink)}" target="_blank" rel="noopener"><button><i class='bx bx-send'></i> ${esc(data.profile.ctaText)}</button></a>` : `<button disabled title="Add a CV link in the editor"><i class='bx bx-send'></i> ${esc(data.profile.ctaText)}</button>`}
          ${editable ? fab('edit-profile') : ''}
        </div>
        <div class="scroll-down"></div>
      </section>

      <section class="info-section">
        <h1 class="section-title editable-target">Hello, There &#128075;${editable ? '' : ''}</h1>
        <div class="info-cards" id="info-cards">
          ${(data.infoCards||[]).map((c,i) => renderInfoCard(c,i,editable)).join('')}
        </div>
      </section>

      <section class="my-projects" id="projects">
        <h1 class="section-title editable-target">My Projects &#128187;${editable ? addBtn('add-project') : ''}</h1>
        <div id="projects-list">
          ${(data.projects||[]).map((p,i) => renderProject(p,i,editable)).join('') || (editable ? '<div class="empty-state">No projects yet — use the + above to add one</div>' : '')}
        </div>
      </section>

      <section class="skills-section" id="skills">
        <h1 class="section-title">My Skills &#128170;</h1>
        <div class="skills-box editable-target">
          ${editable ? fab('edit-skills') : ''}
          <img class="skills-image" src="${esc(data.profile.brainImage || 'images/digital_brain.png')}" alt="skills-image">
          <div class="designer">
            <h1 class="gradient">Cyber Security<i class='bx bx-laptop'></i></h1>
            <p>${esc(data.skills.cyberText)}</p>
          </div>
          <div class="coder">
            <h1 class="gradient">Programming<i class='bx bx-code-block'></i></h1>
            <p>${esc(data.skills.programmingText)}</p>
          </div>
          ${renderTechSlider(data.skills.techLogos, editable)}
        </div>
      </section>

      <section class="certificate-container editable-target" id="certificates">
        <div class="slider-wrapper">
          <h1>Certificates ${editable ? addBtn('add-cert') : ''}</h1>
          ${renderCertSlider(data.certifications.images, editable)}
        </div>
      </section>

      <section class="contact-section" id="contact">
         <h1 class="section-title">Let's talk &#128522;</h1>
         <div class="social-box editable-target">
          ${editable ? fab('edit-contact') : ''}
          ${data.contact.phone ? `<a href="tel:${esc(data.contact.phone)}"><i class='bx bx-phone'></i>${esc(data.contact.phone)}</a>` : ''}
          ${data.contact.email ? `<a href="mailto:${esc(data.contact.email)}"><i class='bx bxl-telegram'></i>${esc(data.contact.email)}</a>` : ''}
          ${data.contact.linkedin ? `<a href="${esc(data.contact.linkedin)}" target="_blank" rel="noopener"><i class='bx bxl-linkedin-square'></i>LinkedIn</a>` : ''}
          <div class="social-icons">
            ${data.contact.github ? `<a href="${esc(data.contact.github)}" target="_blank" rel="noopener"><i class='bx bxl-github'></i>GitHub</a>` : ''}
          </div>
         </div>
         ${renderContactForm(data.contact)}
      </section>

      <footer>
        <h1>Copyright &copy; ${new Date().getFullYear()} ${esc(data.profile.firstName)} ${esc(data.profile.lastName)}, made with &#10084;&#65039;</h1>
      </footer>
    </div>
  `;
  initDynamics(root, data);
}

function renderInfoCard(c, i, editable) {
  let mediaHtml = '';
  if (c.media && c.media.type === 'image' && c.media.src) {
    mediaHtml = `<img src="${esc(c.media.src)}" alt="card-image">`;
  } else if (c.media && c.media.type === 'video' && c.media.src) {
    mediaHtml = `<video autoplay muted loop playsinline src="${esc(c.media.src)}"></video>`;
  }
  return `
    <div class="card editable-target" data-index="${i}">
      ${editable ? fab('edit-infocard') : ''}
      <h1>${esc(c.heading)}</h1>
      ${c.text ? `<p>${esc(c.text)}</p>` : ''}
      ${mediaHtml}
      ${c.buttonText ? `<a href="${esc(c.buttonHref||'#')}"><button><i class='bx bx-link-external'></i>${esc(c.buttonText)}</button></a>` : ''}
    </div>
  `;
}

function renderProject(p, i, editable) {
  let vidbox;
  if (p.media && p.media.type === 'video' && p.media.src) {
    vidbox = `<video class="project-video" data-idx="${i}" src="${esc(p.media.src)}"></video>`;
  } else if (p.media && p.media.type === 'image' && p.media.src) {
    vidbox = `<img src="${esc(p.media.src)}" alt="${esc(p.title)}" style="width:100%;border-radius:20px;box-shadow:0 0 10px lightgray;">`;
  } else {
    vidbox = `<div style="width:100%;min-height:220px;border-radius:20px;border:1px dashed #555;display:flex;align-items:center;justify-content:center;color:#888;font-size:13px;"><i class='bx bx-code-curly' style="font-size:32px;margin-right:8px;"></i>${editable ? 'add an image or video' : ''}</div>`;
  }
  return `
    <div class="project-card editable-target" data-index="${i}">
      ${editable ? fab('edit-project') : ''}
      <div class="project-vidbox">${vidbox}</div>
      <div class="project-info">
        <h1><span class="gradient">${esc(p.titleHighlight||p.title)}</span>${esc(p.titleRest||'')}</h1>
        <p>${esc(p.description)}</p>
        ${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener"><button><i class='bx bx-link-external'></i>View</button></a>` : ''}
      </div>
    </div>
  `;
}

function renderTechSlider(logos, editable) {
  if (!logos || !logos.length) {
    return editable
      ? `<div class="empty-state" style="position:absolute;bottom:5%;width:60%;left:20%;">No tech icons yet — add some from the Skills editor${addBtn('add-techlogo')}</div>`
      : '';
  }
  const q = logos.length;
  const items = logos.map((src, i) => `<div class="item" style="--position:${i+1}"><img src="${esc(src)}" alt="tech logo"></div>`).join('');
  return `
    <div class="slider editable-target" style="--width:100px;--height:100px;--quantity:${q};">
      ${editable ? fab('edit-techlogos') : ''}
      <div class="list">${items}</div>
    </div>
  `;
}

function renderCertSlider(images, editable) {
  if (!images || !images.length) {
    return `<div class="empty-state">No certificates uploaded yet${editable ? ' — use the + above to add one' : ''}</div>`;
  }
  const slides = images.map((src, i) => `<img data-idx="${i}" src="${esc(src)}" alt="certificate ${i+1}">`).join('');
  const dots = images.map((_, i) => `<a data-idx="${i}" class="${i===0?'active':''}"></a>`).join('');
  return `
    <div class="slide" id="cert-slide">${slides}</div>
    <div class="slider-nav" id="cert-nav">${dots}</div>
    ${editable ? `<div style="margin-top:14px;display:flex;gap:10px;justify-content:center;"><button class="btn danger" data-action="remove-last-cert">Remove last certificate</button></div>` : ''}
  `;
}

function renderContactForm(contact) {
  const sent = typeof location !== 'undefined' && location.search.includes('sent=true');
  const nextUrl = typeof location !== 'undefined' ? location.href.split('?')[0] + '?sent=true' : '';
  if (!contact.email) return '';
  return `
    <form class="contact-box" action="https://formsubmit.co/${esc(contact.email)}" method="POST">
      <input type="hidden" name="_subject" value="New message from your portfolio site">
      <input type="hidden" name="_captcha" value="false">
      <input type="hidden" name="_next" value="${esc(nextUrl)}">
      <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
      ${sent ? `<div class="form-success">&#10003; Message sent — thanks for reaching out.</div>` : ''}
      <p>Full name</p>
      <input type="text" name="name" placeholder="Your Full Name" required>
      <p>Email Address</p>
      <input type="email" name="email" placeholder="Your Email" required>
      <p>Your Message</p>
      <textarea name="message" placeholder="share your thoughts...." required></textarea>
      <button type="submit"><i class='bx bxl-whatsapp'></i>Send</button>
    </form>
  `;
}

/* ---------------- dynamics: video hover, cert nav, scroll chrome ---------------- */
let _revealSet = false;
function initDynamics(root, data) {
  // project video hover-to-play (from original app.js)
  root.querySelectorAll('.project-video').forEach(v => {
    v.addEventListener('mouseover', () => v.play());
    v.addEventListener('mouseout', () => v.pause());
  });

  // certificate slider nav dots
  const slide = root.querySelector('#cert-slide');
  const nav = root.querySelector('#cert-nav');
  if (slide && nav) {
    const dots = Array.from(nav.querySelectorAll('a'));
    const imgs = Array.from(slide.querySelectorAll('img'));
    dots.forEach((dot, i) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        if (imgs[i]) imgs[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      });
    });
    slide.addEventListener('scroll', () => {
      const idx = Math.round(slide.scrollLeft / slide.clientWidth);
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    }, { passive: true });
  }

  initMobileNav();
  initChrome();
}

function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const list = document.getElementById('nav-list');
  if (!toggle || !list) return;
  toggle.onclick = () => list.classList.toggle('open');
  list.querySelectorAll('a').forEach(a => a.addEventListener('click', () => list.classList.remove('open')));
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
}
