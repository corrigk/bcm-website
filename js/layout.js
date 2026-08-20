/* ===========================================================
   Shared header + footer, injected into #site-header / #site-footer.
   Editing the nav or footer links? Do it here, once, for the
   whole site.
   =========================================================== */

const BCM_NAV = [
  { href: "index.html", label: "Home" },
  { href: "calendar.html", label: "Calendar" },
  { href: "announcements.html", label: "Announcements" },
  { href: "reflections.html", label: "Reflections" },
  { href: "directory/login.html", label: "Directory" },
  { label: "More", children: [
      { href: "prayer.html", label: "Prayer Wall" },
      { href: "gallery.html", label: "Gallery" },
      { href: "team.html", label: "Who to Contact" },
      { href: "connect.html", label: "Connect" }
  ] }
];

function bcmBasePath(){
  return (location.pathname.includes('/admin/') || location.pathname.includes('/directory/')) ? '../' : '';
}

function bcmRenderHeader(){
  const header = document.getElementById('site-header');
  if (!header) return;
  const base = bcmBasePath();
  const parts = location.pathname.split('/').filter(Boolean);
  const here = base ? parts.slice(-2).join('/') : (parts.pop() || 'index.html');

  const links = BCM_NAV.map(item => {
    if (item.children){
      const isActiveGroup = item.children.some(c => c.href === here);
      const childLinks = item.children.map(c => {
        const active = c.href === here ? ' class="active"' : '';
        return `<a href="${base}${c.href}"${active}>${c.label}</a>`;
      }).join('');
      return `
        <li class="nav-more">
          <button type="button" class="nav-more-toggle${isActiveGroup ? ' active' : ''}">${item.label} ▾</button>
          <div class="nav-more-menu">${childLinks}</div>
        </li>`;
    }
    const active = item.href === here ? ' class="active"' : '';
    return `<li><a href="${base}${item.href}"${active}>${item.label}</a></li>`;
  }).join('');

  header.innerHTML = `
    <div id="urgent-bar"><div class="urgent-inner container" id="urgent-bar-inner"></div></div>
    <div class="nav-row">
      <a href="${base}index.html" class="brand">
        <div class="brand-mark">BCM</div>
        <div class="brand-text">
          <div class="b1">Boiler Catholic Men</div>
          <div class="b2">Purdue University</div>
        </div>
      </a>
      <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu" aria-expanded="false">MENU</button>
      <ul class="nav-links" id="nav-links">${links}</ul>
    </div>
  `;

  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  toggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // "More" dropdown: click to open/close, click outside to close
  document.querySelectorAll('.nav-more-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = btn.nextElementSibling;
      const isOpen = menu.classList.contains('open');
      document.querySelectorAll('.nav-more-menu.open').forEach(m => m.classList.remove('open'));
      if (!isOpen) menu.classList.add('open');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-more-menu.open').forEach(m => m.classList.remove('open'));
  });
}

function bcmRenderFooter(){
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  const links = (typeof BCM_CONFIG !== 'undefined' && BCM_CONFIG.LINKS) || {};
  const base = bcmBasePath();
  footer.innerHTML = `
    <div class="footer-grid">
      <div>
        <h4>Boiler Catholic Men</h4>
        <p style="opacity:.85; font-size:.92rem; max-width:34ch;">
          A brotherhood of Purdue men pursuing Christ together — through prayer,
          formation, and fellowship. All are welcome.
        </p>
      </div>
      <div>
        <h4>Pages</h4>
        <a href="${base}calendar.html">Calendar</a>
        <a href="${base}announcements.html">Announcements</a>
        <a href="${base}reflections.html">Weekly Reflections</a>
        <a href="${base}prayer.html">Prayer Wall</a>
        <a href="${base}gallery.html">Gallery</a>
        <a href="${base}team.html">Who to Contact</a>
        <a href="${base}directory/login.html">Member Directory</a>
        <a href="${base}connect.html">Connect</a>
      </div>
      <div>
        <h4>Stay in the loop</h4>
        <a href="${links.groupme || '#'}" target="_blank" rel="noopener">GroupMe</a>
        <a href="${links.flocknote || '#'}" target="_blank" rel="noopener">Flocknote</a>
        <a href="${links.instagram || '#'}" target="_blank" rel="noopener">Instagram</a>
        <a href="${links.email || '#'}">Email Us</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; ${new Date().getFullYear()} BOILER CATHOLIC MEN — PURDUE UNIVERSITY</span>
      <a href="${base}admin/login.html" style="color:inherit; opacity:.7;">ADMIN</a>
    </div>
  `;
}

async function bcmRenderUrgentBar(){
  const bar = document.getElementById('urgent-bar');
  const inner = document.getElementById('urgent-bar-inner');
  if (!bar || !inner || typeof BCMData === 'undefined') return;
  try{
    const all = await BCMData.getAnnouncements();
    const now = new Date();
    const pinned = all.filter(a => a.pinned && (!a.expires_at || new Date(a.expires_at) > now));
    if (pinned.length === 0) return;
    inner.innerHTML = pinned.map(a => `
      <span class="urgent-tag">Last-Minute</span>
      <span><strong>${bcmEscape(a.title)}</strong> — ${bcmEscape(bcmTruncate(a.body, 110))}
      <a href="announcements.html" style="color:#fff; text-decoration:underline; margin-left:6px;">Read more</a></span>
    `).join('<span style="width:100%; height:1px;"></span>');
    bar.classList.add('show');
  }catch(e){ console.error('urgent bar', e); }
}

function bcmEscape(str=''){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function bcmTruncate(str='', n=140){
  return str.length > n ? str.slice(0, n).trim() + '…' : str;
}
function bcmFormatDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

document.addEventListener('DOMContentLoaded', () => {
  bcmRenderHeader();
  bcmRenderFooter();
  bcmRenderUrgentBar();
});
