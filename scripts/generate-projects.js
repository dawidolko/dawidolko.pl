/*
 * Builds everything on the site that comes from data/projects.json: a static
 * detail page per project, the cards and tooltips on the listing pages,
 * sitemap.xml, llms.txt, one social image per project and data/media.json,
 * which olkodawid.dawidolko.pl reads to show the same screenshots.
 *
 * Media is discovered, never listed by hand: whatever sits in
 * src/assets/img/work/<slug>/ when this runs ends up on the page. Rerun it
 * after adding files. sharp is optional and only needed for images:
 *
 *   npm install --no-save sharp
 *   node scripts/generate-projects.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE = "https://dawidolko.pl";
const LIST_PATH = "/projects";
const WORK_DIR = "src/assets/img/work";
const OG_DIR = "src/assets/img/og";
const VIDEO_DIR = "src/assets/img/video";
const DEFAULT_OG = "src/assets/img/og-image.jpg";
const TODAY = new Date().toISOString().slice(0, 10);
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; font-src 'self'; connect-src 'self'; " +
  "frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self'";
const STATIC_PAGES = [
  ["/", "weekly", "1.0", "Home", "Who Dawid Olko is, selected projects and contact details."],
  ["/projects", "weekly", "0.9", "Projects", "Every project with its dates, stack and links."],
  ["/blog", "weekly", "0.9", "Blog", "A personal photo blog about studies, travel and programming."],
  ["/studies", "monthly", "0.8", "Studies", "Computer Science at the University of Rzeszów."],
  ["/hobbies", "monthly", "0.7", "Hobbies", "Gaming setups, hardware builds and interests outside work."],
  ["/gallery", "monthly", "0.7", "Gallery", "Personal photographs."],
  ["/contact", "monthly", "0.8", "Contact", "Email and social profiles."],
  ["/faq", "monthly", "0.6", "FAQ", "Questions about technologies, working style and interests."],
];

const file = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(file(rel), "utf8");
const exists = (rel) => fs.existsSync(file(rel));

function writeIfChanged(rel, content) {
  fs.mkdirSync(path.dirname(file(rel)), { recursive: true });
  if (exists(rel) && read(rel) === content) return false;
  fs.writeFileSync(file(rel), content);
  return true;
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const isoMonth = (label) => {
  const [month, year] = label.split(" ");
  return `${year}-${String(MONTHS.indexOf(month) + 1).padStart(2, "0")}`;
};

function dateRange(p) {
  if (!p.end || p.end === p.start) return p.start;
  return `${p.start} – ${p.end}`;
}

function dateHtml(p) {
  const stamp = (label) => (MONTHS.includes(label.split(" ")[0]) ? `<time datetime="${isoMonth(label)}">${label}</time>` : label);
  if (!p.end || p.end === p.start) return stamp(p.start);
  return `${stamp(p.start)} – ${stamp(p.end)}`;
}

/*
 * Reads the pixel size straight from the WebP header, so a page can reserve
 * the right space without sharp being installed.
 */
function webpSize(rel) {
  const b = fs.readFileSync(file(rel));
  const chunk = b.toString("latin1", 12, 16);
  if (chunk === "VP8X") return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1];
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
  }
  if (chunk === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  return [1280, 720];
}

function listMedia(slug) {
  const dir = `${WORK_DIR}/${slug}`;
  const names = exists(dir) ? fs.readdirSync(file(dir)) : [];
  const order = (name) => {
    const m = /^(desktop|mobile|shot)(?:-(\d+))?\.webp$/.exec(name);
    return m ? { desktop: 0, shot: 1, mobile: 2 }[m[1]] * 100 + Number(m[2] || 0) : null;
  };
  const gallery = names
    .filter((name) => order(name) !== null)
    .sort((a, b) => order(a) - order(b))
    .map((name) => {
      const [width, height] = webpSize(`${dir}/${name}`);
      return { file: name, url: `/${dir}/${name}`, width, height };
    });
  return {
    gallery,
    demo: names.includes("demo.webp") ? `/${dir}/demo.webp` : "",
    still: names.includes("poster.webp") ? `/${dir}/poster.webp` : gallery[0] ? gallery[0].url : "",
  };
}

function youtube(url) {
  if (!url) return null;
  const m = /(?:youtu\.be\/|[?&]v=|\/shorts\/)([\w-]{11})/.exec(url);
  return m ? { id: m[1], portrait: url.includes("/shorts/") } : null;
}

const describeShot = (name) => {
  if (name.startsWith("mobile")) return "phone view";
  if (name.startsWith("desktop")) return `desktop view ${name.replace(/\D/g, "")}`;
  return `screenshot ${name.replace(/\D/g, "")}`;
};

function pageTitle(p) {
  const options = [`${p.title}: ${p.kind} | Dawid Olko`, `${p.title} - ${p.kind}`, `${p.title} project | Dawid Olko`, `${p.title} by Dawid Olko`];
  return options.find((t) => t.length >= 30 && t.length <= 60);
}

function pageDescription(p) {
  if (p.metaDescription) return p.metaDescription;
  const sentences = p.summary.split(/(?<=[.!?])\s+(?=[A-Z0-9"])/);
  let text = sentences[0];
  for (const next of sentences.slice(1)) {
    if (text.length >= 70) break;
    text += ` ${next}`;
  }
  if (text.length < 70) text = `${p.tagline}. ${text}`;
  if (text.length > 160) {
    const cut = text.slice(0, 157);
    text = `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:—–-]+$/, "").trim()}...`;
  }
  return text;
}

const sectionBetween = (html, open, close) => html.slice(html.indexOf(open), html.indexOf(close) + close.length);

const externalLink = (href, cls, label) =>
  `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label}<span class="visually-hidden"> (opens in a new tab)</span></a>`;

function renderMedia(p, media, posters) {
  const blocks = [];
  if (media.gallery.length) {
    const items = media.gallery
      .map(
        (m, i) => `          <li>
            <a class="gallery__link" href="${m.url}" data-index="${i}">
              <img src="${m.url}" alt="${esc(`${p.title}, ${describeShot(m.file)}`)}" width="${m.width}" height="${m.height}" loading="lazy" decoding="async" />
            </a>
          </li>`,
      )
      .join("\n");
    blocks.push(`      <section class="project__section" aria-labelledby="gallery-heading">
        <h2 class="project__heading" id="gallery-heading">Screenshots</h2>
        <ul class="gallery">
${items}
        </ul>
      </section>`);
  }
  const video = youtube(p.video);
  if (video) {
    const poster = posters[video.id] || (media.gallery[0] && media.gallery[0].url) || "";
    const image = poster ? `<img src="${poster}" alt="" width="640" height="360" loading="lazy" decoding="async" />` : "";
    blocks.push(`      <section class="project__section" aria-labelledby="video-heading">
        <h2 class="project__heading" id="video-heading">Video</h2>
        <div class="video-frame${video.portrait ? " video-frame--portrait" : ""}">
          <button class="video-facade" type="button" data-video="${video.id}" data-title="${esc(`${p.title} video`)}" aria-label="${esc(`Play video: ${p.title}`)}">
            ${image}
            <span class="video-facade__play" aria-hidden="true"></span>
          </button>
        </div>
        <p class="project__note">${externalLink(p.video, "project__link", "Watch on YouTube")}</p>
      </section>`);
  } else if (media.demo) {
    const [width, height] = media.still ? webpSize(media.still.slice(1)) : [1280, 720];
    const source = media.still ? `src="${media.still}" ` : "";
    const poster = `<img class="demo__media" ${source}alt="${esc(`${p.title}, scrolling demo`)}" width="${width}" height="${height}" loading="lazy" decoding="async"${media.still ? "" : " hidden"} />`;
    blocks.push(`      <section class="project__section" aria-labelledby="demo-heading">
        <h2 class="project__heading" id="demo-heading">Demo</h2>
        <figure class="demo" data-demo="${media.demo}">
          ${poster}
          <button class="demo__toggle project__button" type="button">Play demo</button>
        </figure>
      </section>`);
  }
  return blocks.join("\n");
}

function renderPage(p, index, shell, media, posters, ogImage) {
  const url = `${SITE}/projects/${p.slug}/`;
  const title = pageTitle(p);
  const description = pageDescription(p);
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const video = youtube(p.video);
  const links = [
    p.live && externalLink(p.live, "project__button", "Live site"),
    p.repo && !p.private && externalLink(`https://github.com/dawidolko/${p.repo}`, "project__button project__button--ghost", "Source code"),
  ].filter(Boolean);
  const person = { "@type": "Person", name: "Dawid Olko", url: `${SITE}/` };
  const work = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#project`,
    name: p.title,
    headline: p.tagline,
    description,
    url,
    image: ogImage,
    author: person,
    dateCreated: isoMonth(p.start),
    keywords: p.stack.join(", "),
    inLanguage: "en",
  };
  /*
   * A credit with a link names the project this one was built from, not a person
   * who worked on it, so it must not reach the structured data as a contributor.
   */
  if (p.creditUrl) work.isBasedOn = p.creditUrl;
  else if (p.credit) {
    const people = p.credit.split(", ").map((name) => ({ "@type": "Person", name }));
    work.contributor = people.length === 1 ? people[0] : people;
  }
  const sameAs = [p.live, p.repo && !p.private ? `https://github.com/dawidolko/${p.repo}` : ""].filter(Boolean);
  if (sameAs.length) work.sameAs = sameAs;
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Projects", item: `${SITE}${LIST_PATH}` },
      { "@type": "ListItem", position: 3, name: p.title, item: url },
    ],
  };
  const scripts = [media.gallery.length || media.demo ? `<script src="/src/js/project.js" defer></script>` : "", video ? `<script src="/src/js/videoFacade.js" defer></script>` : ""]
    .filter(Boolean)
    .join("\n    ");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="${CSP}" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="author" content="Dawid Olko" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(`${p.title} project by Dawid Olko`)}" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:site_name" content="Dawid Olko Portfolio" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${ogImage}" />
    <link rel="icon" type="image/x-icon" href="/src/assets/img/favicon.ico" />
    <link rel="preload" as="font" type="font/woff2" href="/src/assets/fonts/web/opensans-latin.woff2" crossorigin />
    <link rel="stylesheet" href="/src/css/fonts.css?v=8" />
    <link rel="stylesheet" href="/src/css/projects.css?v=8" />
    <link rel="stylesheet" href="/src/css/project.css?v=2" />
    <script type="application/ld+json">${JSON.stringify(work)}</script>
    <script type="application/ld+json">${JSON.stringify(breadcrumbs)}</script>
    <script src="/a11y/a11y-panel.js" data-accent="#9b00c2" defer></script>
  </head>
  <body class="project-page">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    ${shell.nav}

    <header class="project__head">
      <div class="project__inner">
        <nav class="crumbs" aria-label="Breadcrumb">
          <ol>
            <li><a href="/">Home</a></li>
            <li><a href="${LIST_PATH}">Projects</a></li>
            <li aria-current="page">${esc(p.title)}</li>
          </ol>
        </nav>
        <p class="project__kind">${esc(p.kind)}</p>
        <h1 class="project__title">${esc(p.title)}</h1>
        <p class="project__dates">${dateHtml(p)}</p>
        <p class="project__tagline">${esc(p.tagline)}</p>
${p.creditUrl ? `        <p class="project__credit"><a href="${esc(p.creditUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.credit)}</a></p>\n` : ""}${links.length ? `        <div class="project__actions">\n          ${links.join("\n          ")}\n        </div>\n` : ""}      </div>
    </header>

    <main id="main-content" class="project__inner" tabindex="-1">
      <section class="project__section" aria-labelledby="about-heading">
        <h2 class="project__heading" id="about-heading">About the project</h2>
        <p class="project__text">${esc(p.summary)}</p>
      </section>
      <section class="project__section" aria-labelledby="shows-heading">
        <h2 class="project__heading" id="shows-heading">What it demonstrates</h2>
        <ul class="project__shows">
${p.shows.map((item) => `          <li>${esc(item)}</li>`).join("\n")}
        </ul>
      </section>
      <section class="project__section" aria-labelledby="stack-heading">
        <h2 class="project__heading" id="stack-heading">Stack</h2>
        <ul class="project__stack">
${p.stack.map((item) => `          <li>${esc(item)}</li>`).join("\n")}
        </ul>
      </section>
${renderMedia(p, media, posters)}
      <nav class="pager" aria-label="Other projects">
        <a class="pager__link" href="/projects/${prev.slug}/" rel="prev"><span class="pager__label">Previous project</span>${esc(prev.title)}</a>
        <a class="pager__link pager__link--next" href="/projects/${next.slug}/" rel="next"><span class="pager__label">Next project</span>${esc(next.title)}</a>
      </nav>
    </main>

    ${shell.footer}
    <script src="/src/js/index.js" defer></script>
    ${scripts}
  </body>
</html>
`;
}

function tipMarkup(p) {
  const shows = p.shows
    .slice(0, 3)
    .map((item) => `<li>${esc(item)}</li>`)
    .join("");
  return [
    `<button class="tip-btn" type="button" aria-label="${esc(`About ${p.title}`)}" aria-describedby="tip-${p.slug}"><span aria-hidden="true">i</span></button>`,
    `<div class="tip" id="tip-${p.slug}" role="tooltip" hidden><p class="tip__title">${esc(p.title)}</p><p class="tip__date">${esc(dateRange(p))}</p><p class="tip__kind">${esc(p.kind)}</p>${p.creditUrl ? `<p class="tip__kind">${esc(p.credit)}</p>` : ""}<p class="tip__label">Demonstrates</p><ul class="tip__list">${shows}</ul></div>`,
  ];
}

function cardLinks(p, pad) {
  const github = p.repo && !p.private;
  const video = youtube(p.video);
  const items = [];
  if (github) items.push(`<a class="portfolio__link" href="https://github.com/dawidolko/${p.repo}" target="_blank" rel="noopener noreferrer" aria-label="${esc(`${p.title} source code on GitHub (opens in a new tab)`)}"><i aria-hidden="true" class="fa-brands fa-github"></i></a>`);
  if (p.live) items.push(`<a class="portfolio__link" href="${esc(p.live)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(`${p.title} live site (opens in a new tab)`)}"><i aria-hidden="true" class="portfolio__icon fa-solid fa-arrow-up-right-from-square"></i></a>`);
  else if (video) items.push(`<a class="portfolio__link" href="${esc(p.video)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(`${p.title} video on YouTube (opens in a new tab)`)}"><i aria-hidden="true" class="fa-brands fa-youtube"></i></a>`);
  items.push(`<a class="project-show" href="/projects/${p.slug}/">Show<span class="visually-hidden"> ${esc(p.title)}</span></a>`);
  return items.map((item) => pad + item).join("\n");
}

function refreshCards(html, showTitle = true) {
  let out = html;
  for (const p of projects) {
    const [button, tip] = tipMarkup(p);
    const box = new RegExp(`(<div class="portfolio__box[^"]*" data-project="${p.slug}">)[\\s\\S]*?(\\n\\s*<img class="portfolio__img")`);
    out = out.replace(box, (_, open, tail) => {
      const pad = " ".repeat(tail.indexOf("<") - 1);
      return `${open}
${pad}${button}
${pad}${tip}
${pad}<div class="portfolio__shadow">${showTitle ? `
${pad}  <p class="portfolio__shadow-title">${esc(p.title)}</p>` : ""}
${pad}  <div class="portfolio__icons">
${cardLinks(p, `${pad}    `)}
${pad}  </div>
${pad}</div>${tail}`;
    });
    const face = new RegExp(`(<div class="card[^"]*" data-project="${p.slug}">\\s*<div class="face face1">)(?:\\s*<button class="tip-btn".*\\s*<div class="tip".*)?`);
    out = out.replace(face, (_, open) => `${open}\n            ${button}\n            ${tip}`);
  }
  return out;
}

function moreProjects(html) {
  const shown = new Set([...html.matchAll(/data-project="([^"]+)"/g)].map((m) => m[1]));
  const cards = projects
    .filter((p) => !shown.has(p.slug))
    .map((p) => {
      const [button, tip] = tipMarkup(p);
      return `          <li class="more__card">
            <h3 class="more__title">${esc(p.title)}</h3>
            <p class="more__date">${esc(dateRange(p))}</p>
            <p class="more__tagline">${esc(p.tagline)}</p>
            <div class="more__actions">
              <a class="project-show" href="/projects/${p.slug}/">Show<span class="visually-hidden"> ${esc(p.title)}</span></a>
              ${button}
              ${tip}
            </div>
          </li>`;
    })
    .join("\n");
  const start = "<!-- more-projects:start -->";
  const end = "<!-- more-projects:end -->";
  const body = `${start}
      <section class="more" aria-labelledby="more-heading">
        <h2 class="more__heading" id="more-heading">More projects</h2>
        <ul class="more__grid container">
${cards}
        </ul>
      </section>
      ${end}`;
  return html.slice(0, html.indexOf(start)) + body + html.slice(html.indexOf(end) + end.length);
}

function collectionJsonLd() {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      url: `${SITE}${LIST_PATH}`,
      name: "Projects - Dawid Olko Portfolio",
      description: "Web development projects built by Dawid Olko.",
      author: { "@type": "Person", name: "Dawid Olko", url: `${SITE}/` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: projects.length,
        itemListElement: projects.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: `${SITE}/projects/${p.slug}/` })),
      },
    },
    null,
    2,
  );
}

function renderSitemap(changed) {
  const previous = exists("sitemap.xml") ? read("sitemap.xml") : "";
  const lastmod = (loc, isChanged) => {
    const m = new RegExp(`<loc>${loc.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}</loc>\\s*<lastmod>([^<]+)`).exec(previous);
    return m && !isChanged ? m[1] : TODAY;
  };
  const entry = (loc, freq, priority, isChanged) =>
    `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod(loc, isChanged)}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  const rows = [
    ...STATIC_PAGES.map(([route, freq, priority]) => entry(SITE + route, freq, priority, route === LIST_PATH && changed.size > 0)),
    ...projects.map((p) => entry(`${SITE}/projects/${p.slug}/`, "monthly", "0.7", changed.has(p.slug))),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
}

function renderLlms() {
  const pages = STATIC_PAGES.map(([route, , , name, text]) => `- [${name}](${SITE}${route}): ${text}`).join("\n");
  const list = projects.map((p) => `- [${p.title}](${SITE}/projects/${p.slug}/): ${p.kind}, ${dateRange(p)}. ${p.tagline}.`).join("\n");
  return `# Dawid Olko

> Personal website of Dawid Olko, a Fullstack / AI Developer from Rzeszów, Poland: projects, studies, a photo blog and contact details.

## Pages

${pages}

## Projects

${list}
`;
}

function wrap(text, limit) {
  const lines = [""];
  for (const word of text.split(" ")) {
    if (`${lines[lines.length - 1]} ${word}`.trim().length > limit) lines.push(word);
    else lines[lines.length - 1] = `${lines[lines.length - 1]} ${word}`.trim();
  }
  return lines;
}

async function socialImage(sharp, p, media) {
  const size = p.title.length <= 16 ? 92 : p.title.length <= 26 ? 68 : 54;
  const kind = wrap(p.kind, 52);
  const text = [
    `<text x="72" y="${392 - (kind.length - 1) * 38}" font-size="${size}" font-weight="700" fill="#ffffff">${esc(p.title)}</text>`,
    ...kind.map((line, i) => `<text x="72" y="${460 - (kind.length - 1 - i) * 38}" font-size="32" fill="#e8e8e8">${esc(line)}</text>`),
    `<text x="72" y="526" font-size="26" fill="#d9a0f2">${esc(dateRange(p))}</text>`,
    `<text x="1128" y="568" font-size="26" fill="#bdbdbd" text-anchor="end">dawidolko.pl</text>`,
  ].join("");
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" font-family="Open Sans, Helvetica, Arial, sans-serif">
    <defs><linearGradient id="fade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d0d0d" stop-opacity="0.72"/><stop offset="1" stop-color="#1a0322" stop-opacity="0.96"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#fade)"/><rect x="0" y="0" width="12" height="630" fill="#ba00e9"/>${text}</svg>`);
  const shot = media.gallery.find((m) => !m.file.startsWith("mobile"));
  const base = shot ? sharp(file(shot.url.slice(1))).resize(1200, 630, { fit: "cover", position: "top" }) : sharp({ create: { width: 1200, height: 630, channels: 3, background: "#0d0d0d" } }).png();
  const out = await sharp(await base.composite([{ input: overlay }]).png().toBuffer()).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  fs.mkdirSync(file(OG_DIR), { recursive: true });
  const target = file(`${OG_DIR}/${p.slug}.jpg`);
  if (!fs.existsSync(target) || !fs.readFileSync(target).equals(out)) fs.writeFileSync(target, out);
}

async function videoPosters(sharp) {
  const posters = {};
  for (const p of projects) {
    const video = youtube(p.video);
    if (!video || posters[video.id]) continue;
    const rel = `${VIDEO_DIR}/${video.id}.webp`;
    if (!exists(rel) && sharp) {
      const res = await fetch(`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`).catch(() => null);
      if (res && res.ok) {
        fs.mkdirSync(file(VIDEO_DIR), { recursive: true });
        const crop = await sharp(Buffer.from(await res.arrayBuffer()))
          .resize(640, 360, { fit: "cover" })
          .webp({ quality: 74 })
          .toBuffer();
        fs.writeFileSync(file(rel), crop);
      }
    }
    if (exists(rel)) posters[video.id] = `/${rel}`;
  }
  return posters;
}

function audit(rows) {
  const problems = [];
  const banned = /\bCMS\b/;
  const seen = new Set();
  for (const p of projects) {
    if (banned.test(JSON.stringify(p))) problems.push(`${p.slug}: banned word`);
    if (p.private && p.repo) problems.push(`${p.slug}: private repository name in public data`);
  }
  for (const { slug, title, description } of rows) {
    if (!title || title.length < 30 || title.length > 60) problems.push(`${slug}: title "${title}"`);
    if (description.length < 70 || description.length > 160) problems.push(`${slug}: description ${description.length}`);
    for (const value of [title, description]) {
      if (seen.has(value)) problems.push(`${slug}: duplicate "${value}"`);
      seen.add(value);
    }
  }
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
}

const projects = JSON.parse(read("data/projects.json"));

async function main() {
  let sharp = null;
  try {
    sharp = require("sharp");
  } catch {
    console.warn("sharp is not installed: social images and video posters stay as they are.");
  }
  audit(projects.map((p) => ({ slug: p.slug, title: pageTitle(p), description: pageDescription(p) })));

  const posters = await videoPosters(sharp);
  const list = read("projects.html");
  const refreshedList = moreProjects(refreshCards(list)).replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${collectionJsonLd()}\n    </script>`,
  );
  writeIfChanged("projects.html", refreshedList);
  writeIfChanged("index.html", refreshCards(read("index.html"), false));

  const shell = {
    nav: sectionBetween(refreshedList, '<nav class="nav">', "</nav>").replace(/src="src\//g, 'src="/src/').replace(' aria-current="page"', ""),
    footer: sectionBetween(refreshedList, '<footer class="footer">', "</footer>"),
  };

  const manifest = {};
  const changed = new Set();
  for (const [index, p] of projects.entries()) {
    const media = listMedia(p.slug);
    if (sharp) await socialImage(sharp, p, media);
    const ogRel = exists(`${OG_DIR}/${p.slug}.jpg`) ? `${OG_DIR}/${p.slug}.jpg` : DEFAULT_OG;
    const html = renderPage(p, index, shell, media, posters, `${SITE}/${ogRel}`);
    if (writeIfChanged(`projects/${p.slug}/index.html`, html)) changed.add(p.slug);
    const video = youtube(p.video);
    manifest[p.slug] = {
      gallery: media.gallery.map(({ file: name, width, height }) => ({ file: name, width, height })),
      demo: Boolean(media.demo),
      still: media.still,
      videoPoster: video && posters[video.id] ? posters[video.id] : "",
    };
  }

  writeIfChanged("data/media.json", `${JSON.stringify(manifest, null, 2)}\n`);
  writeIfChanged("sitemap.xml", renderSitemap(changed));
  writeIfChanged("llms.txt", renderLlms());

  const withMedia = Object.values(manifest).filter((m) => m.gallery.length).length;
  console.log(`${projects.length} project pages, ${changed.size} changed, ${withMedia} with screenshots.`);
}

main();
