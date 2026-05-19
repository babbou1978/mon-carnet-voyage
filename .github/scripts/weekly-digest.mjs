// Weekly parser-digest cron script.
//
// Called from .github/workflows/weekly-parse-digest.yml. Hits the
// /api/weekly-parse-digest Vercel endpoint, formats the response, and
// creates a GitHub issue with the digest. Uses pure fetch + Node 24 to
// avoid actions/github-script and its Node 20 deprecation.
//
// Env vars (required):
//   DIGEST_URL         — full URL to the Vercel endpoint
//   DIGEST_SECRET      — bearer token, matches WEEKLY_DIGEST_SECRET
//   GH_TOKEN           — GITHUB_TOKEN from the runner
//   GITHUB_REPOSITORY  — auto-injected by GitHub Actions ("owner/repo")

const DIGEST_URL = process.env.DIGEST_URL;
const DIGEST_SECRET = process.env.DIGEST_SECRET;
const GH_TOKEN = process.env.GH_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;

for (const [k, v] of Object.entries({ DIGEST_URL, DIGEST_SECRET, GH_TOKEN, REPO })) {
  if (!v) {
    console.error(`Missing env ${k}`);
    process.exit(1);
  }
}

const res = await fetch(DIGEST_URL, {
  method: "POST",
  headers: { Authorization: `Bearer ${DIGEST_SECRET}` },
});

if (!res.ok) {
  const body = await res.text();
  console.error(`Digest endpoint returned ${res.status}: ${body}`);
  process.exit(1);
}

const data = await res.json();

if (data.empty || data.count === 0) {
  console.log("No unclear terms this week — nothing to digest.");
  process.exit(0);
}

const date = new Date().toISOString().slice(0, 10);
let body = `## 🗣️ Weekly parser digest — ${date}\n\n`;
body += `**${data.count} parses with unclear terms**, **${data.uniqueTerms} unique terms**, since \`${data.rangeStart}\`.\n\n`;

if (data.error) {
  body += `> ⚠️ Claude meta-analysis failed: \`${data.error}\`. Raw data below.\n\n`;
  body += "```json\n" + JSON.stringify(data.ranked, null, 2) + "\n```\n";
} else {
  if (Array.isArray(data.suggestions) && data.suggestions.length) {
    body += `### Suggestions to validate\n\n`;
    data.suggestions.forEach((s, i) => {
      body += `**#${i + 1}. \`${s.term}\`** (×${s.count})  \n`;
      body += `> _"${s.example}"_  \n`;
      body += `- **Meaning** — ${s.meaning}  \n`;
      body += `- **Maps to** — \`${s.maps_to}\`  \n`;
      body += `- **Prompt change** — ${s.prompt_addition}\n\n`;
    });
  }
  if (Array.isArray(data.skipped) && data.skipped.length) {
    body += `### Skipped (too vague / idiomatic)\n\n`;
    data.skipped.forEach(s => {
      body += `- \`${s.term}\` — ${s.reason}\n`;
    });
    body += `\n`;
  }
}

body += `\n---\n`;
body += `_Reply with **"OK"** to accept every suggestion, or **"OK sauf #1, #3"** to skip specific ones. Then ask Claude in chat to "process le digest" — Claude will read this issue, open a PR with the validated parser changes, and auto-merge per the CLAUDE.md flow._`;

const issueRes = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${GH_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "outsy-weekly-digest",
  },
  body: JSON.stringify({
    title: `🗣️ Weekly parser digest — ${date}`,
    body,
    labels: ["parser-digest"],
  }),
});

if (!issueRes.ok) {
  console.error(`Issue creation failed ${issueRes.status}: ${await issueRes.text()}`);
  process.exit(1);
}

const issue = await issueRes.json();
console.log(`Issue created with ${data.suggestions?.length || 0} suggestions: ${issue.html_url}`);
