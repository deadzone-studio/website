// The real state of the projects, from GitHub, when it answers; the page says something sensible without it too.
"use strict";

const ago = (iso) => {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 864e5);
  if (days < 1) return "changed today";
  if (days === 1) return "changed yesterday";
  if (days < 45) return `changed ${days} days ago`;
  const months = Math.round(days / 30);
  return months < 18 ? `changed ${months} months ago` : `changed ${Math.round(days / 365)} years ago`;
};

const get = async (path) => {
  const r = await fetch(`https://api.github.com/${path}`, { headers: { Accept: "application/vnd.github+json" } });
  if (!r.ok) throw new Error(r.status);
  return r.json();
};

const repos = new Map();
for (const el of document.querySelectorAll("[data-repo]")) {
  const name = el.dataset.repo;
  if (!repos.has(name)) repos.set(name, get(`repos/${name}`));
  repos.get(name).then((r) => {
    if (el.dataset.show === "pushed") el.textContent = `${el.textContent}, ${ago(r.pushed_at)}`;
    if (el.dataset.show === "stars" && r.stargazers_count > 0) el.textContent = `${r.stargazers_count} ★`;
  }).catch(() => {});
}

for (const el of document.querySelectorAll("[data-pr]")) {
  const [owner, repo, n] = el.dataset.pr.split("/");
  get(`repos/${owner}/${repo}/pulls/${n}`).then((p) => {
    el.textContent = p.merged_at ? "merged" : p.state === "closed" ? "closed" : "waiting";
    if (p.merged_at) el.classList.add("merged");
  }).catch(() => {});
}
