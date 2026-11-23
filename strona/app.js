// Sections and pictures switch like the pairing window; the real state of the projects comes from GitHub when it answers.
"use strict";

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- the sliding fill of a row of pills ----------
function follow(row, chosen) {
  const s = row.querySelector(".slide");
  if (!s || !chosen) return;
  s.style.width = `${chosen.offsetWidth}px`;
  s.style.transform = `translateX(${chosen.offsetLeft}px)`;
  row.classList.add("ready");
}

// ---------- sections: #projects, #studio, #rules, #join ----------
const tabs = document.querySelector(".tabs");
const pages = [...document.querySelectorAll(".page")];
function show(id, first) {
  const page = pages.find((p) => p.dataset.page === id) || pages[0];
  for (const p of pages) {
    if (p === page) continue;
    p.hidden = true;
    p.classList.remove("in");
  }
  page.hidden = false;
  enter(page);
  for (const a of tabs.querySelectorAll("a")) {
    if (a.hash === `#${page.dataset.page}`) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  follow(tabs, tabs.querySelector('[aria-current="page"]'));
  if (!first) window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
  if (page.dataset.page === "studio") countUp();
}
addEventListener("hashchange", () => show(location.hash.slice(1)));
addEventListener("resize", () => { follow(tabs, tabs.querySelector('[aria-current="page"]')); follow(pills, pills.querySelector('[aria-selected="true"]')); });

// ---------- how things come in. Everything stands where it belongs without this; it only moves it there ----------
const out = "cubic-bezier(0.16, 1, 0.3, 1)", spring = "cubic-bezier(0.2, 1.35, 0.3, 1)";
function enter(page) {
  if (still || !page.animate) return;
  // the cards like the pairing card: a little lower, then in place, one after another
  page.querySelectorAll(".card").forEach((c, i) =>
    c.animate([{ opacity: 0, transform: "translateY(14px) scale(0.985)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: i * 70, easing: out, fill: "backwards" }));
  // the stages light up one after another, like the six digits of a code
  page.querySelectorAll(".stages b").forEach((b, i) =>
    b.animate([{ opacity: 0, transform: "scale(0.4)" }, { opacity: 1, transform: "none" }], { duration: 500, delay: 350 + i * 90, easing: spring, fill: "backwards" }));
  // the circles of pairing go out from the mark
  page.querySelectorAll(".zone i").forEach((r, i) =>
    r.animate([{ opacity: 0, transform: "scale(1)" }, { opacity: 1, offset: 0.2 }, {}], { duration: 2400, delay: 200 + i * 250, easing: out, fill: "backwards" }));
}
// the mark draws its ring as the page opens, and turns once under the mouse
const arc = document.querySelector(".mark .arc"), spin = document.querySelector(".mark .spin"), dot = document.querySelector(".mark .dot");
if (!still && arc.animate) {
  arc.animate([{ strokeDashoffset: 113 }, { strokeDashoffset: 0 }], { duration: 1100, delay: 150, easing: out, fill: "backwards" });
  dot.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], { duration: 500, delay: 900, easing: spring, fill: "backwards" });
  document.querySelector(".brand").addEventListener("mouseenter", () => spin.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], { duration: 1400, easing: out }));
}

// ---------- what Pairlume does: texts, calls, pairing ----------
const pills = document.querySelector(".pills");
const shots = [...document.querySelectorAll(".stage-shots img")];
const caption = document.querySelector(".caption");
const words = [
  "Conversations from the phone, a code from a text copied with one click, a counter that says how many texts a long message will cost.",
  "When the phone rings, the call comes to the top of the screen. Answer, decline or call back, and talk through the computer over Bluetooth.",
  "Shake the phone, or scan a code, or type six digits. Both screens show the same code and both sides say yes.",
];
function pick(n) {
  pills.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-selected", String(i === n)));
  shots.forEach((s, i) => s.classList.toggle("on", i === n));
  caption.style.opacity = 0;
  setTimeout(() => { caption.textContent = words[n]; caption.style.opacity = 1; }, still ? 0 : 160);
  follow(pills, pills.querySelectorAll("button")[n]);
}
pills.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) pick(Number(b.dataset.shot)); });
pills.addEventListener("keydown", (e) => {
  const all = [...pills.querySelectorAll("button")], at = all.indexOf(document.activeElement);
  if (at < 0 || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
  const n = (at + (e.key === "ArrowRight" ? 1 : all.length - 1)) % all.length;
  all[n].focus();
  pick(n);
});

// ---------- GitHub ----------
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
  return r;
};
const repos = new Map();
const repo = (name) => { if (!repos.has(name)) repos.set(name, get(`repos/${name}`).then((r) => r.json())); return repos.get(name); };

for (const el of document.querySelectorAll("[data-repo]")) {
  repo(el.dataset.repo).then((r) => {
    if (el.dataset.show === "pushed") el.textContent = `${el.textContent}, ${ago(r.pushed_at)}`;
    if (el.dataset.show === "stars" && r.stargazers_count > 0) el.textContent = `${r.stargazers_count} ★`;
  }).catch(() => {});
}
for (const el of document.querySelectorAll("[data-pr]")) {
  const [owner, name, n] = el.dataset.pr.split("/");
  get(`repos/${owner}/${name}/pulls/${n}`).then((r) => r.json()).then((p) => {
    el.textContent = p.merged_at ? "merged" : p.state === "closed" ? "closed" : "waiting";
    if (p.merged_at) el.classList.add("merged");
  }).catch(() => {});
}
// the number of commits: the last page of a list of one commit per page
const commits = new Map();
const count = (name) => {
  if (!commits.has(name)) commits.set(name, get(`repos/${name}/commits?per_page=1`).then((r) => {
    const last = /[?&]page=(\d+)>; rel="last"/.exec(r.headers.get("Link") || "");
    return last ? Number(last[1]) : 1;
  }));
  return commits.get(name);
};
for (const el of document.querySelectorAll("[data-commits]")) count(el.dataset.commits).then((n) => { el.textContent = `${n} commits`; }).catch(() => {});

// the numbers of the studio count up when they are shown
let counted = false;
function countUp() {
  const el = document.querySelector("[data-commits-only]");
  if (!el || counted) return;
  count(el.dataset.commitsOnly).then((n) => {
    counted = true;
    if (still) { el.textContent = n; return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1100);
      el.textContent = Math.round(n * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }).catch(() => { el.textContent = "–"; });
}

show(location.hash.slice(1), true);
pick(0);
