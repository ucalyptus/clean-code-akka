import fs from "node:fs";
import path from "node:path";

const pages = [
  {
    source: "README.md",
    output: "index.html",
    title: "clean-code-akka",
    section: "Start",
    summary: "Clean Code, Clean Architecture, and Akka SDK design principles.",
  },
  {
    source: "docs/clean-akka-principles.md",
    output: "clean-akka-principles.html",
    title: "Clean Akka Principles",
    section: "Core",
    summary: "The operating constitution for clean Akka SDK services.",
  },
  {
    source: "docs/architecture-boundaries.md",
    output: "architecture-boundaries.html",
    title: "Architecture Boundaries",
    section: "Core",
    summary: "Dependency direction, package shape, and layer responsibilities.",
  },
  {
    source: "docs/component-playbook.md",
    output: "component-playbook.html",
    title: "Component Playbook",
    section: "Core",
    summary: "How to choose and shape endpoints, entities, workflows, views, consumers, timers, and agents.",
  },
  {
    source: "docs/testing-strategy.md",
    output: "testing-strategy.html",
    title: "Testing Strategy",
    section: "Practice",
    summary: "A test pyramid for Akka domain rules, components, endpoints, workflows, views, consumers, and agents.",
  },
  {
    source: "docs/anti-patterns.md",
    output: "anti-patterns.html",
    title: "Anti-Patterns",
    section: "Practice",
    summary: "Akka-specific smells and the cleaner alternatives.",
  },
  {
    source: "docs/review-checklist.md",
    output: "review-checklist.html",
    title: "Review Checklist",
    section: "Practice",
    summary: "A practical pull-request checklist for Akka SDK services.",
  },
  {
    source: "examples/shopping-cart-clean-boundaries.md",
    output: "shopping-cart-clean-boundaries.html",
    title: "Shopping Cart Boundaries",
    section: "Examples",
    summary: "A compact example showing API, application, and domain ownership.",
  },
  {
    source: "docs/source-notes.md",
    output: "source-notes.html",
    title: "Source Notes",
    section: "Reference",
    summary: "Project sources, official Akka references, and adaptation policy.",
  },
  {
    source: "CONTRIBUTING.md",
    output: "contributing.html",
    title: "Contributing",
    section: "Reference",
    summary: "Contribution standards for the documentation reference.",
  },
];

const dist = "dist";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugFor(heading) {
  return heading
    .replace(/<[^>]+>/g, "")
    .replace(/[*`]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function inline(markdown, currentSource) {
  return escapeHtml(markdown)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
      return `<a href="${rewriteHref(href, currentSource)}">${label}</a>`;
    });
}

function rewriteHref(href, currentSource) {
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) {
    return href;
  }

  if (href.startsWith("#")) {
    return href;
  }

  const [targetPath, hash = ""] = href.split("#");
  const normalized = path.normalize(path.join(path.dirname(currentSource), targetPath));
  const page = pages.find((candidate) => candidate.source === normalized);

  if (!page) {
    return href;
  }

  return `${page.output}${hash ? `#${hash}` : ""}`;
}

function renderTable(rows, currentSource) {
  const parsed = rows.map((row) =>
    row
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim())
  );

  const [head, , ...body] = parsed;
  const th = head.map((cell) => `<th>${inline(cell, currentSource)}</th>`).join("");
  const trs = body
    .map((row) => `<tr>${row.map((cell) => `<td>${inline(cell, currentSource)}</td>`).join("")}</tr>`)
    .join("\n");

  return `<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
}

function markdownToHtml(markdown, currentSource) {
  const lines = normalizeMarkdownLines(markdown.replace(/\r\n/g, "\n").split("\n"));
  const html = [];
  let paragraph = [];
  let list = null;
  let code = null;
  let table = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      html.push(`<p>${inline(paragraph.join(" "), currentSource)}</p>`);
      paragraph = [];
    }
  }

  function flushList() {
    if (list) {
      html.push(`</${list}>`);
      list = null;
    }
  }

  function flushTable() {
    if (table.length > 0) {
      html.push(renderTable(table, currentSource));
      table = [];
    }
  }

  for (const line of lines) {
    const codeFence = line.match(/^```([a-zA-Z0-9_-]*)\s*$/);
    if (codeFence) {
      if (code) {
        html.push(
          `<div class="code-wrap"><button class="copy-button" data-copy type="button">Copy</button><pre><code>${escapeHtml(code.lines.join("\n"))}</code></pre></div>`
        );
        code = null;
      } else {
        flushParagraph();
        flushList();
        flushTable();
        code = { language: codeFence[1], lines: [] };
      }
      continue;
    }

    if (code) {
      code.lines.push(line);
      continue;
    }

    if (/^\|.+\|$/.test(line)) {
      flushParagraph();
      flushList();
      table.push(line);
      continue;
    } else {
      flushTable();
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const text = heading[2].trim();
      html.push(`<h${level} id="${slugFor(text)}">${inline(text, currentSource)}</h${level}>`);
      continue;
    }

    const unordered = line.match(/^\s*-\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      if (list !== "ul") {
        flushList();
        html.push("<ul>");
        list = "ul";
      }
      html.push(`<li>${inline(unordered[1], currentSource)}</li>`);
      continue;
    }

    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (list !== "ol") {
        flushList();
        html.push("<ol>");
        list = "ol";
      }
      html.push(`<li>${inline(ordered[1], currentSource)}</li>`);
      continue;
    }

    const quote = line.match(/^>\s+(.+)$/);
    if (quote) {
      flushParagraph();
      flushList();
      html.push(`<blockquote>${inline(quote[1], currentSource)}</blockquote>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushTable();

  return html.join("\n");
}

function normalizeMarkdownLines(lines) {
  const normalized = [];
  let inCode = false;
  let previousWasList = false;

  for (const line of lines) {
    if (/^```/.test(line)) {
      normalized.push(line);
      inCode = !inCode;
      previousWasList = false;
      continue;
    }

    if (inCode) {
      normalized.push(line);
      continue;
    }

    const startsListItem = /^\s*(?:-|\d+\.)\s+/.test(line);
    const isIndentedContinuation = previousWasList && /^\s{2,}\S/.test(line);

    if (isIndentedContinuation && normalized.length > 0) {
      normalized[normalized.length - 1] += ` ${line.trim()}`;
      previousWasList = true;
      continue;
    }

    normalized.push(line);
    previousWasList = startsListItem;
  }

  return normalized;
}

function navFor(activeOutput) {
  const sections = new Map();
  for (const page of pages) {
    if (!sections.has(page.section)) sections.set(page.section, []);
    sections.get(page.section).push(page);
  }

  return [...sections.entries()]
    .map(([section, sectionPages]) => {
      const links = sectionPages
        .map(
          (page) =>
            `<a data-nav-link href="${page.output}" ${page.output === activeOutput ? 'aria-current="page"' : ""}>${page.title}</a>`
        )
        .join("\n");

      return `<div class="nav-section">${section}</div>\n${links}`;
    })
    .join("\n");
}

function quickCards() {
  return pages
    .filter((page) => ["clean-akka-principles.html", "architecture-boundaries.html", "component-playbook.html"].includes(page.output))
    .map(
      (page) =>
        `<a class="quick-card" href="${page.output}"><strong>${page.title}</strong><span>${page.summary}</span></a>`
    )
    .join("\n");
}

function layout(page, content) {
  const isHome = page.output === "index.html";
  const hero = isHome
    ? `<section class="hero"><p class="eyebrow">Akka SDK design reference</p><h2>Clean code for services that remember, react, and recover.</h2><p>Principles, boundaries, component playbooks, anti-patterns, and review checklists for maintainable Akka SDK systems.</p></section><section class="quick-grid">${quickCards()}</section>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(page.summary)}">
  <title>${escapeHtml(page.title)} | clean-code-akka</title>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/docs.css">
</head>
<body>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="mark">Ak</div>
        <h1>clean-code-akka</h1>
        <p>Clean Code, Clean Architecture, and Akka SDK design principles.</p>
      </div>
      <input class="search" data-search type="search" placeholder="Search pages">
      <nav class="nav" aria-label="Documentation navigation">
        ${navFor(page.output)}
        <p class="search-empty">No matching pages.</p>
      </nav>
    </aside>
    <main class="content">
      <div class="topbar">
        <button class="menu-button" data-menu-button type="button">Menu</button>
        <span class="topbar-title">${escapeHtml(page.title)}</span>
      </div>
      <article class="doc">
        ${hero}
        <div class="markdown">${content}</div>
        <footer class="page-footer">
          <span>MIT licensed.</span>
          <a href="https://github.com/ucalyptus/clean-code-akka">GitHub</a>
        </footer>
      </article>
    </main>
  </div>
  <script src="assets/docs.js"></script>
</body>
</html>`;
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, "assets"), { recursive: true });
fs.copyFileSync("site/assets/docs.css", path.join(dist, "assets/docs.css"));
fs.copyFileSync("site/assets/docs.js", path.join(dist, "assets/docs.js"));
fs.copyFileSync("site/assets/favicon.svg", path.join(dist, "assets/favicon.svg"));
fs.writeFileSync(path.join(dist, ".nojekyll"), "");

for (const page of pages) {
  const markdown = fs.readFileSync(page.source, "utf8");
  const content = markdownToHtml(markdown, page.source);
  fs.writeFileSync(path.join(dist, page.output), layout(page, content));
}

console.log(`built ${pages.length} pages in ${dist}/`);
