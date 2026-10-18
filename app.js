const appRoot = document.getElementById('app');
const navRoot = document.getElementById('nav');

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const toSafeUrl = (value = '#') => {
  if (!value) return '#';
  return /^(https?:|mailto:|#|\/)/i.test(value) ? value : '#';
};

const renderNav = (blocks = []) => {
  const links = blocks
    .filter((block) => !block.hidden && (block.nav || block.id))
    .map((block) => `
      <a href="#${escapeHtml(block.id)}">${escapeHtml(block.nav || block.title || block.id)}</a>
    `)
    .join('');

  navRoot.innerHTML = links;
};

const renderHero = (block) => `
  <section id="${escapeHtml(block.id || 'hero')}" class="hero">
    <div class="hero-inner">
      <span class="eyebrow">${escapeHtml(block.eyebrow || '')}</span>
      <h1>${escapeHtml(block.title || 'Snowman')}</h1>
      <p class="sub">${escapeHtml(block.text || '')}</p>
      ${block.btn1 && block.btn1.label ? `<a class="btn" href="${toSafeUrl(block.btn1.url || '#')}">${escapeHtml(block.btn1.label)}</a>` : ''}
      ${block.btn2 && block.btn2.label ? `<a class="btn secondary" href="${toSafeUrl(block.btn2.url || '#')}">${escapeHtml(block.btn2.label)}</a>` : ''}
    </div>
  </section>
`;

const renderMarquee = (block) => `
  <section id="${escapeHtml(block.id || 'ticker')}" class="marquee">
    <h2>${escapeHtml(block.label || '')}</h2>
    <p>${escapeHtml(block.items || '')}</p>
  </section>
`;

const renderText = (block) => `
  <section id="${escapeHtml(block.id || 'about')}" class="text">
    <h2>${escapeHtml(block.title || block.nav || 'About')}</h2>
    <div>${escapeHtml(block.text || '')}</div>
  </section>
`;

const renderStats = (block) => {
  const items = Array.isArray(block.items) ? block.items : [];
  return `
    <section id="${escapeHtml(block.id || 'stats')}" class="stats">
      <div class="grid">
        ${items.map((item) => `
          <div class="card">
            <h3>${escapeHtml(item.value || '')}</h3>
            <p class="mut">${escapeHtml(item.label || '')}</p>
          </div>
        `).join('')}
      </div>
    </section>
  `;
};

const renderCards = (block) => {
  const items = Array.isArray(block.items) ? block.items : [];
  return `
    <section id="${escapeHtml(block.id || 'cards')}" class="cards">
      <h2>${escapeHtml(block.title || block.nav || '')}</h2>
      <div class="grid">
        ${items.map((item) => `
          <article class="card">
            ${item.eyebrow ? `<div class="eyebrow">${escapeHtml(item.eyebrow)}</div>` : ''}
            <h3>${escapeHtml(item.title || '')}</h3>
            <p>${escapeHtml(item.text || item.role || '')}</p>
            ${item.badge ? `<span class="badge">${escapeHtml(item.badge)}</span>` : ''}
            ${item.link ? `<a href="${toSafeUrl(item.link)}">${escapeHtml(item.link)}</a>` : ''}
          </article>
        `).join('')}
      </div>
    </section>
  `;
};

const renderContact = (block) => {
  const rows = Array.isArray(block.rows) ? block.rows : [];
  const listItems = rows.map((row) => `
    <li>
      <a href="${toSafeUrl(row.url || '#')}" target="_blank" rel="noopener">${escapeHtml(row.label || row.value || row.title || '')}</a>
    </li>
  `).join('');

  return `
    <section id="${escapeHtml(block.id || 'contact')}" class="contact">
      <h2>${escapeHtml(block.title || 'Contact')}</h2>
      <p>${escapeHtml(block.text || '')}</p>
      ${block.email ? `<p><a href="mailto:${escapeHtml(block.email)}">${escapeHtml(block.email)}</a></p>` : ''}
      ${listItems ? `<ul class="list">${listItems}</ul>` : ''}
    </section>
  `;
};

const renderNotice = (block) => `
  <section id="${escapeHtml(block.id || 'notice')}" class="notice">
    <p>${escapeHtml(block.text || '')}</p>
  </section>
`;

const renderBlock = (block) => {
  if (!block || typeof block !== 'object') return '';

  switch (block.type) {
    case 'hero':
      return renderHero(block);
    case 'marquee':
      return renderMarquee(block);
    case 'text':
      return renderText(block);
    case 'stats':
      return renderStats(block);
    case 'cards':
      return renderCards(block);
    case 'contact':
      return renderContact(block);
    case 'notice':
      return renderNotice(block);
    default:
      return renderText(block);
  }
};

const renderPage = (data) => {
  const blocks = Array.isArray(data.blocks) ? data.blocks : [];

  document.title = 'Snowman — Portfolio';
  if (data.site && data.site.brand) {
    document.title = `${data.site.brand} — Portfolio`;
  }

  document.documentElement.style.setProperty('--accent', data.accent || '#2b8c5a');
  document.documentElement.dataset.theme = data.theme || 'dark';

  renderNav(blocks);
  appRoot.innerHTML = blocks.map(renderBlock).join('');
};

async function init() {
  try {
    const response = await fetch('content.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Failed to load content.json');
    }

    const data = await response.json();
    renderPage(data);
  } catch (error) {
    appRoot.innerHTML = `
      <section class="text">
        <h2>Portfolio unavailable</h2>
        <p>content.json could not be loaded.</p>
      </section>
    `;
    console.error(error);
  }
}

init();
