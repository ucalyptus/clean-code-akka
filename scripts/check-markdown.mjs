import fs from "node:fs";
import path from "node:path";

const requiredFiles = [
  "README.md",
  "LICENSE",
  "NOTICE.md",
  "CONTRIBUTING.md",
  "docs/README.md",
  "docs/clean-akka-principles.md",
  "docs/architecture-boundaries.md",
  "docs/component-playbook.md",
  "docs/release-notes-guidance.md",
  "docs/testing-strategy.md",
  "docs/anti-patterns.md",
  "docs/review-checklist.md",
  "docs/source-notes.md",
  "examples/shopping-cart-clean-boundaries.md",
  ".github/pull_request_template.md",
  ".github/workflows/pages.yml",
  "site/assets/docs.css",
  "site/assets/docs.js",
  "site/assets/favicon.svg",
  "scripts/build-site.mjs",
];

const markdownFiles = [
  "README.md",
  "CONTRIBUTING.md",
  ".github/pull_request_template.md",
  ...fs.readdirSync("docs").filter((file) => file.endsWith(".md")).map((file) => path.join("docs", file)),
  ...fs.readdirSync("examples").filter((file) => file.endsWith(".md")).map((file) => path.join("examples", file)),
];

function slugFor(heading) {
  return heading
    .replace(/[*`]/g, "")
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function anchorsFor(markdown) {
  const anchors = new Set();

  for (const match of markdown.matchAll(/^#{1,6}\s+(.+)$/gm)) {
    anchors.add(slugFor(match[1]));
  }

  return anchors;
}

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    failures.push(`missing required file: ${file}`);
  }
}

for (const file of markdownFiles) {
  const markdown = fs.readFileSync(file, "utf8");
  const anchors = anchorsFor(markdown);

  for (const match of markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1];

    if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("mailto:")) {
      continue;
    }

    if (target.startsWith("#")) {
      const anchor = target.slice(1);
      if (!anchors.has(anchor)) {
        failures.push(`${file}: missing local anchor ${target}`);
      }
      continue;
    }

    const [relativePath, anchor] = target.split("#");
    const targetPath = path.normalize(path.join(path.dirname(file), relativePath));

    if (!fs.existsSync(targetPath)) {
      failures.push(`${file}: missing linked file ${target}`);
      continue;
    }

    if (anchor) {
      const targetMarkdown = fs.readFileSync(targetPath, "utf8");
      if (!anchorsFor(targetMarkdown).has(anchor)) {
        failures.push(`${file}: missing anchor ${anchor} in ${targetPath}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`checked ${markdownFiles.length} markdown files`);
