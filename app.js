/* Career Compass — 100% client-side job radar.
   Pulls public ATS board APIs directly from the browser (all send CORS *),
   screens for visa wording, dedups against a localStorage ledger, and builds
   tailored resume PDFs. No server, no tracking, no signup. */

"use strict";

/* ---------------- Majors -> title keywords ---------------- */
const MAJORS = {
  "Artificial Intelligence": ["machine learning", "ml engineer", "ai engineer",
    "artificial intelligence", "applied scientist", "research engineer", "llm",
    "nlp", "deep learning", "generative ai", "genai", "computer vision",
    "mlops", "machine intelligence", "data scientist"],
  "Data Science": ["data scientist", "data science", "machine learning",
    "analytics", "statistician", "applied scientist", "decision scientist"],
  "Software Engineering": ["software engineer", "software developer", "backend",
    "python developer", "full stack", "platform engineer", "systems engineer"],
  "Data Engineering": ["data engineer", "etl", "data platform", "analytics engineer",
    "data infrastructure"],
};
const SENIORITY_EXCLUDE = ["senior", "sr.", "staff", "principal", "director",
  "vp ", "vice president", "lead ", "head of", "manager"];

/* ---------------- Company boards (all verified live) ---------------- */
const BOARDS = [
  ["greenhouse", "airbnb", "Airbnb"], ["greenhouse", "stripe", "Stripe"],
  ["greenhouse", "coinbase", "Coinbase"], ["greenhouse", "robinhood", "Robinhood"],
  ["greenhouse", "duolingo", "Duolingo"], ["greenhouse", "databricks", "Databricks"],
  ["greenhouse", "figma", "Figma"], ["greenhouse", "discord", "Discord"],
  ["greenhouse", "pinterest", "Pinterest"], ["greenhouse", "lyft", "Lyft"],
  ["greenhouse", "instacart", "Instacart"], ["greenhouse", "reddit", "Reddit"],
  ["greenhouse", "dropbox", "Dropbox"], ["greenhouse", "asana", "Asana"],
  ["lever", "spotify", "Spotify"],
  ["ashby", "openai", "OpenAI"], ["ashby", "perplexity", "Perplexity"],
  ["ashby", "cohere", "Cohere"], ["ashby", "runway", "Runway"],
  ["ashby", "midjourney", "Midjourney"],
];

/* ---------------- Visa screening (deterministic) ---------------- */
const BANNED_PHRASES = ["no sponsorship", "without sponsorship",
  "not provide sponsorship", "unable to sponsor", "cannot sponsor",
  "will not sponsor", "no visa sponsorship", "u.s. citizen only",
  "us citizen only", "u.s. citizens only", "must be a u.s. citizen",
  "citizenship required", "security clearance", "public trust clearance",
  "must not require sponsorship", "do not require sponsorship",
  "sponsorship is not available", "not eligible for sponsorship"];
const FRIENDLY_PHRASES = ["will sponsor", "sponsorship available", "h-1b", "h1b", "opt"];

function visaScreen(text) {
  const t = norm(text);
  for (const p of BANNED_PHRASES) if (t.includes(p)) return ["banned", p];
  for (const p of FRIENDLY_PHRASES) if (t.includes(p)) return ["likely_sponsors", p];
  return ["neutral", "no visa wording found"];
}

/* ---------------- Keyword lexicon for gap reports ---------------- */
const LEXICON = ["python", "pytorch", "scikit-learn", "pandas", "numpy", "sql",
  "hugging face", "transformers", "spacy", "llm", "genai", "generative ai",
  "prompt engineering", "rag", "agents", "agentic", "langchain", "evaluation",
  "evals", "benchmarking", "nlp", "deep learning", "machine learning",
  "tiktoken", "embeddings", "vector", "fine-tuning", "inference",
  "classification", "regression", "clustering", "docker", "aws", "rest api",
  "git", "pytest", "streamlit", "guardrails", "semantic"];

/* ---------------- Base resume (tailoring starts here) ---------------- */
const RESUME = {
  name: "SHARAT CHANDRA SAI BODDU",
  contact: "sharatchandrasai999@gmail.com | (940) 629-3865 | Denton, TX | linkedin.com/in/sharat-chandra-sai-boddu-6504673a6 | github.com/sharatchandrasai999-sketch",
  summary: "M.S. in Artificial Intelligence, University of North Texas (2026). AI engineer building LLM tooling: an extraction-evaluation framework (agentic supervisor layer) and a token-cost toolkit (budget guardrails, semantic caching). Open-source contributor.",
  skills: "LLMs and GenAI: Claude API, prompt engineering, LLM evaluation, agents, tiktoken, token-cost optimization, guardrails, semantic caching | Machine learning: PyTorch, scikit-learn, pandas, NumPy, Hugging Face Transformers, spaCy | Languages: Python, SQL, C, C++ | Engineering: Git, GitHub Actions, pytest, Docker, Streamlit, REST APIs, Linux, AWS (S3)",
  projects: [
    { title: "ExtractEval — open-source extraction-evaluation framework", bullets: [
      "Built ExtractEval, an open-source framework turning one YAML file (fields, rules, labels) into a complete extraction task with zero code changes for new tasks, type-aware scoring, and a multi-model leaderboard on accuracy, cost, and latency.",
      "Introduced an agentic supervisor layer routing extractions to auto-approve, human review, or reject by confidence; a rules engine blocks invalid results (negative totals, future dates). Auto-approved demo batch: 100% correct, zero errors escaped.",
      "Shipped as CLI and Streamlit dashboard with an offline provider (no API key needed); 19 pytest tests, CI green." ] },
    { title: "TokenLens — open-source LLM token-cost toolkit", bullets: [
      "Developed TokenLens, an open-source toolkit pricing prompts across 16+ models before sending, using exact tiktoken counts or an offline estimator with cheapest-first ranking to catch over-budget calls before money is spent.",
      "Added a three-lever optimizer (trim waste, re-route, cap output) reporting each lever's savings separately, plus a prompt linter and a budget guardrail that warns or blocks over-limit calls.",
      "Implemented semantic caching with a swappable embedder, scored on hit rate and false-hit rate; CLI, Python API, and dashboard; 46 tests, CI green." ] },
    { title: "Animal Shelter Outcome Prediction (team project)", bullets: [
      "Predicted 8 shelter-outcome classes from 174,000+ Austin Animal Center records (2013-2025): 70% accuracy and 0.68 weighted F1 with a tuned k-NN, 21 points above the majority-class baseline, via engineered temporal, demographic, and medical features with SMOTE and tuned preprocessing." ] },
  ],
  experience: "Student Assistant, University of North Texas — Denton, TX (May 2025 - May 2026): coordinated scheduling, attendance, and communications for student workers. | Android App Development Intern, Verzeo — Hyderabad, India (Jan 2022 - Jun 2022): built mobile apps with Dart in a six-month industry internship; earned official certification.",
  education: "M.S. in Artificial Intelligence, University of North Texas (May 2026) — GPA 3.8/4.0. Coursework: ML, Deep Learning, NLP, Statistics, Big Data, Data Mining, RL. | B.Tech in Computer Science, DRK Institute of Science and Technology.",
};

/* ---------------- Utils ---------------- */
const $ = (s) => document.querySelector(s);
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function norm(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function stripHtml(h) {
  const d = document.createElement("div");
  d.innerHTML = String(h || "");
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.add("hidden"), 3500);
}

/* ---------------- Ledger (localStorage, 30-day dedup) ---------------- */
const LEDGER_KEY = "cc_ledger_v1", DEDUP_DAYS = 30;
function loadLedger() {
  try { return JSON.parse(localStorage.getItem(LEDGER_KEY) || "[]"); }
  catch { return []; }
}
function saveLedger(entries) { localStorage.setItem(LEDGER_KEY, JSON.stringify(entries)); }
function isDuplicate(company, title, jobId) {
  const cutoff = Date.now() - DEDUP_DAYS * 864e5;
  const nc = norm(company), nt = norm(title);
  return loadLedger().some((e) => {
    if (new Date(e.timestamp).getTime() < cutoff) return false;
    if (norm(e.company) !== nc) return false;
    if (jobId && e.job_id) return String(e.job_id) === String(jobId);
    return norm(e.title) === nt;
  });
}
function markApplied(job) {
  const entries = loadLedger();
  entries.push({ company: job.company, title: job.title, job_id: job.job_id,
    url: job.url, timestamp: new Date().toISOString(), status: "applied" });
  saveLedger(entries);
}

/* ---------------- Board fetchers (normalized) ---------------- */
async function fetchGreenhouse(board, company) {
  const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=false`);
  if (!r.ok) throw new Error("HTTP " + r.status);
  const d = await r.json();
  return (d.jobs || []).map((j) => ({ portal: "greenhouse", board, company,
    job_id: String(j.id), title: j.title || "", url: j.absolute_url || "",
    location: (j.location || {}).name || "", _detail: true }));
}
async function greenhouseDetail(job) {
  const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${job.board}/jobs/${job.job_id}?questions=false`);
  if (!r.ok) return "";
  const d = await r.json();
  return stripHtml(d.content || "");
}
async function fetchLever(board, company) {
  const r = await fetch(`https://api.lever.co/v0/postings/${board}?mode=json`);
  if (!r.ok) throw new Error("HTTP " + r.status);
  const d = await r.json();
  return (Array.isArray(d) ? d : []).map((j) => ({ portal: "lever", board, company,
    job_id: String(j.id), title: j.text || "", url: j.hostedUrl || "",
    location: ((j.categories || {}).location) || "",
    description: stripHtml(j.description || "") }));
}
async function fetchAshby(board, company) {
  const r = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${board}`);
  if (!r.ok) throw new Error("HTTP " + r.status);
  const d = await r.json();
  return (d.jobs || []).map((j) => ({ portal: "ashby", board, company,
    job_id: String(j.id), title: j.title || "", url: j.jobUrl || "",
    location: j.locationName || "",
    description: stripHtml(j.descriptionHtml || j.descriptionPlain || "") }));
}
async function fetchBoard([portal, board, company]) {
  if (portal === "greenhouse") return fetchGreenhouse(board, company);
  if (portal === "lever") return fetchLever(board, company);
  return fetchAshby(board, company);
}

/* small promise pool */
async function pool(items, n, fn) {
  const out = []; let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); }
  });
  await Promise.all(workers);
  return out;
}

function titleRelevant(title, major) {
  const t = norm(title);
  if (SENIORITY_EXCLUDE.some((x) => t.includes(x))) return false;
  return MAJORS[major].some((k) => t.includes(k));
}

/* ---------------- Pull flow ---------------- */
let jobsCache = [];

async function pullJobs() {
  const major = $("#major").value;
  localStorage.setItem("cc_major", major);
  const btn = $("#btn-pull"), st = $("#pull-status");
  btn.disabled = true;
  try {
    st.textContent = `Contacting ${BOARDS.length} boards…`;
    const settled = await Promise.allSettled(BOARDS.map(fetchBoard));
    let all = [], failed = 0;
    settled.forEach((s) => { if (s.status === "fulfilled") all.push(...s.value); else failed++; });
    st.textContent = `${all.length} postings scanned (${BOARDS.length - failed}/${BOARDS.length} boards ok) — filtering by ${major}…`;

    const matched = all.filter((j) => titleRelevant(j.title, major));
    // Phase 2: fetch descriptions for greenhouse matches only
    const gh = matched.filter((j) => j._detail);
    await pool(gh, 8, async (j) => { j.description = await greenhouseDetail(j); });

    jobsCache = matched.map((j) => {
      const [verdict, reason] = visaScreen(j.description || "");
      return { ...j, visa_verdict: verdict, visa_reason: reason,
               already_applied: isDuplicate(j.company, j.title, j.job_id) };
    }).sort((a, b) => (b.already_applied - a.already_applied) ||
      (a.visa_verdict === "banned") - (b.visa_verdict === "banned"));
    renderJobs(); renderStats(failed);
    st.textContent = `${jobsCache.length} ${major} roles found`;
    toast(`Found ${jobsCache.length} ${major} roles`);
  } catch (e) {
    st.textContent = "Failed: " + e.message;
  }
  btn.disabled = false;
}

/* ---------------- Render ---------------- */
function visaBadge(j) {
  const label = { banned: "visa: banned", neutral: "visa: neutral",
    likely_sponsors: "visa: likely sponsors" }[j.visa_verdict] || j.visa_verdict;
  return `<span class="badge ${j.visa_verdict}" title="${esc(j.visa_reason)}">${label}</span>`;
}
function renderStats(failed) {
  const ok = jobsCache.filter((j) => j.visa_verdict !== "banned" && !j.already_applied).length;
  const banned = jobsCache.filter((j) => j.visa_verdict === "banned").length;
  $("#stats").innerHTML = [
    [jobsCache.length, "matching roles"],
    [ok, "worth reviewing"],
    [banned, "visa-banned (skipped)"],
  ].map(([n, l]) => `<div class="stat"><div class="num">${n}</div><div class="lbl">${l}</div></div>`).join("");
}
function renderJobs() {
  const box = $("#jobs-list");
  if (!jobsCache.length) { box.innerHTML = `<div class="empty">Pick a major and hit “Pull jobs”.</div>`; return; }
  box.innerHTML = jobsCache.map((j, i) => `
    <div class="job">
      <h3><a href="${esc(j.url)}" target="_blank" rel="noopener">${esc(j.title)}</a></h3>
      <div class="meta">${esc(j.company)} · ${esc(j.location)} · ${esc(j.portal)}</div>
      <div class="badges">${visaBadge(j)}
        ${j.already_applied ? `<span class="badge dup">applied (30d)</span>` : ""}</div>
      <div class="actions">
        <button class="ghost" data-tailor="${i}" ${j.visa_verdict === "banned" || j.already_applied ? "disabled" : ""}>Tailor resume (PDF)</button>
        <button class="ghost" data-applied="${i}" ${j.already_applied ? "disabled" : ""}>Mark applied</button>
        <span class="tailor-result" id="tr-${i}"></span>
      </div>
    </div>`).join("");
  box.querySelectorAll("[data-tailor]").forEach((b) =>
    b.addEventListener("click", () => tailorJob(+b.dataset.tailor, b)));
  box.querySelectorAll("[data-applied]").forEach((b) =>
    b.addEventListener("click", () => {
      const j = jobsCache[+b.dataset.applied];
      markApplied(j); j.already_applied = true; renderJobs(); renderApps();
      toast(`Logged: ${j.title} at ${j.company}`);
    }));
}
function renderApps() {
  const box = $("#apps-list");
  const entries = loadLedger().slice().reverse();
  if (!entries.length) { box.innerHTML = `<div class="empty">Nothing logged yet.</div>`; return; }
  box.innerHTML = `<table class="log"><thead><tr><th>Date</th><th>Company</th><th>Title</th><th>Status</th><th></th></tr></thead><tbody>` +
    entries.map((e, i) => `<tr><td>${esc(e.timestamp.slice(0, 10))}</td>
      <td>${esc(e.company)}</td><td>${esc(e.title)}</td>
      <td><span class="pill">${esc(e.status)}</span></td>
      <td><button class="ghost" data-rm="${entries.length - 1 - i}">Remove</button></td></tr>`).join("") +
    `</tbody></table>`;
  box.querySelectorAll("[data-rm]").forEach((b) =>
    b.addEventListener("click", () => {
      const entries = loadLedger(); entries.splice(+b.dataset.rm, 1);
      saveLedger(entries); renderApps(); renderJobs();
    }));
}

/* ---------------- Tailoring ---------------- */
function keywordGap(jdText) {
  const t = norm(jdText), resumeText = norm(RESUME.skills + " " +
    RESUME.projects.map((p) => p.bullets.join(" ")).join(" "));
  const inJd = LEXICON.filter((k) => t.includes(k));
  return { mentioned: inJd, missing: inJd.filter((k) => !resumeText.includes(k)) };
}

async function tailorWithGemini(jdText, key) {
  const bullets = RESUME.projects.flatMap((p) => p.bullets);
  const body = { model: "gemini-2.0-flash", temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "Rewrite resume bullets for the job description. Rephrase and reprioritize only; every number, tool, and claim must already exist in the original bullets. Do not invent anything. Reply with JSON: {\"bullets\": [\"...\"]}. Keep the same number of bullets." },
      { role: "user", content: "JOB DESCRIPTION:\n" + jdText.slice(0, 6000) +
        "\n\nRESUME BULLETS:\n" + bullets.map((b) => "- " + b).join("\n") },
    ] };
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("Gemini HTTP " + r.status);
  const d = await r.json();
  const parsed = JSON.parse(d.choices[0].message.content.replace(/```json|```/g, ""));
  if (!parsed.bullets || !parsed.bullets.length) throw new Error("empty LLM response");
  return { bullets: parsed.bullets, used_llm: true };
}

async function tailorJob(idx, btn) {
  const job = jobsCache[idx], out = $("#tr-" + idx);
  btn.disabled = true; out.textContent = "Tailoring…";
  try {
    const jd = job.description || "";
    const gap = keywordGap(jd);
    let bullets = RESUME.projects.flatMap((p) => p.bullets), used_llm = false;
    const key = localStorage.getItem("cc_gemini_key") || "";
    if (key) {
      try { const r = await tailorWithGemini(jd, key); bullets = r.bullets; used_llm = true; }
      catch (e) { out.textContent = "LLM failed (" + e.message + ") — using base resume. "; }
    }
    buildPdf(job, bullets);
    out.innerHTML += `PDF downloaded · ${used_llm ? "LLM-tailored" : "base resume (no key)"}` +
      (gap.missing.length ? ` · missing keywords: ${gap.missing.slice(0, 8).map(esc).join(", ")}` : "");
  } catch (e) { out.textContent = "Failed: " + e.message; }
  btn.disabled = false;
}

function buildPdf(job, bullets) {
  if (!window.jspdf) throw new Error("PDF library still loading — try again in a moment");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = 612, M = 48; let y = M;
  const line = (text, { size = 10, bold = false, gap = 4, indent = 0 } = {}) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, W - 2 * M - indent);
    for (const l of lines) {
      if (y > 750) { doc.addPage(); y = M; }
      doc.text(l, M + indent, y); y += size * 1.28;
    }
    y += gap;
  };
  line(RESUME.name, { size: 15, bold: true, gap: 2 });
  line(RESUME.contact, { size: 8.5, gap: 8 });
  line("SUMMARY", { size: 10, bold: true, gap: 2 });
  line(`Tailored for: ${job.title} at ${job.company}`, { size: 9, gap: 2 });
  line(RESUME.summary, { gap: 6 });
  line("SKILLS", { size: 10, bold: true, gap: 2 });
  line(RESUME.skills, { gap: 6 });
  line("PROJECTS", { size: 10, bold: true, gap: 2 });
  const per = Math.ceil(bullets.length / RESUME.projects.length);
  RESUME.projects.forEach((p, pi) => {
    line(p.title, { bold: true, gap: 2 });
    bullets.slice(pi * per, pi * per + per).forEach((b) => line("•  " + b, { indent: 10 }));
  });
  line("EXPERIENCE", { size: 10, bold: true, gap: 2 });
  line(RESUME.experience, { gap: 6 });
  line("EDUCATION", { size: 10, bold: true, gap: 2 });
  line(RESUME.education, {});
  const fname = `${job.company}_${job.title}`.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 60) + "_resume.pdf";
  doc.save(fname);
}

/* ---------------- Tabs / settings / init ---------------- */
document.querySelectorAll(".tab").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    document.querySelectorAll(".panel").forEach((p) => p.classList.add("hidden"));
    $("#tab-" + b.dataset.tab).classList.remove("hidden");
    if (b.dataset.tab === "apps") renderApps();
  }));

$("#btn-pull").addEventListener("click", pullJobs);
$("#major").addEventListener("change", (e) => localStorage.setItem("cc_major", e.target.value));

$("#btn-save-key").addEventListener("click", () => {
  const k = $("#gemini-key").value.trim();
  if (k) localStorage.setItem("cc_gemini_key", k);
  else localStorage.removeItem("cc_gemini_key");
  $("#key-status").textContent = k ? "Saved in this browser." : "Cleared.";
  $("#gemini-key").value = "";
});
$("#btn-clear").addEventListener("click", () => {
  if (confirm("Clear the whole application log in this browser?")) {
    saveLedger([]); renderApps(); renderJobs(); toast("Application log cleared");
  }
});

(function init() {
  const sel = $("#major");
  Object.keys(MAJORS).forEach((m) => {
    const o = document.createElement("option"); o.value = o.textContent = m; sel.appendChild(o);
  });
  sel.value = localStorage.getItem("cc_major") || "Artificial Intelligence";
  if (localStorage.getItem("cc_gemini_key")) $("#key-status").textContent = "A key is saved in this browser.";
  $("#board-count").textContent = BOARDS.length;
  $("#board-list").textContent = BOARDS.map((b) => b[2]).join(" · ");
  renderJobs();
})();
