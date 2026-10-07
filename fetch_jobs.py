#!/usr/bin/env python3
"""Build jobs.json snapshot for the Career Compass static site.

Run by .github/workflows/update-jobs.yml every 30 minutes, and locally to
seed the first snapshot. Fetches all boards, title-filters across every
major, visa-screens deterministically, and writes a compact snapshot the
site loads instantly (no 56 live fetches on page open).

Usage: python scripts/fetch_jobs.py [--out jobs.json]
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import datetime as dt
import html
import json
import os
import re
import sys

import requests

HERE = os.path.dirname(os.path.abspath(__file__))
HEADERS = {"User-Agent": "career-compass/1.0 (scheduled snapshot)"}
TIMEOUT = 15
DESC_CHARS = 2000  # truncate descriptions to keep jobs.json lean

MAJORS = {
    "Artificial Intelligence": ["machine learning", "ml engineer", "ai engineer",
        "artificial intelligence", "applied scientist", "research engineer", "llm",
        "nlp", "deep learning", "generative ai", "genai", "computer vision",
        "mlops", "machine intelligence", "data scientist"],
    "Data Science": ["data scientist", "data science", "machine learning",
        "analytics", "statistician", "applied scientist", "decision scientist"],
    "Software Engineering": ["software engineer", "software developer", "backend",
        "python developer", "full stack", "platform engineer", "systems engineer"],
    "Data Engineering": ["data engineer", "etl", "data platform",
        "analytics engineer", "data infrastructure"],
}
SENIORITY_EXCLUDE = ["senior", "sr.", "staff", "principal", "director",
                     "vp ", "vice president", "lead ", "head of", "manager"]

BOARDS = [
    ("greenhouse", "airbnb", "Airbnb"), ("greenhouse", "stripe", "Stripe"),
    ("greenhouse", "coinbase", "Coinbase"), ("greenhouse", "robinhood", "Robinhood"),
    ("greenhouse", "duolingo", "Duolingo"), ("greenhouse", "databricks", "Databricks"),
    ("greenhouse", "figma", "Figma"), ("greenhouse", "discord", "Discord"),
    ("greenhouse", "pinterest", "Pinterest"), ("greenhouse", "lyft", "Lyft"),
    ("greenhouse", "instacart", "Instacart"), ("greenhouse", "reddit", "Reddit"),
    ("greenhouse", "dropbox", "Dropbox"), ("greenhouse", "asana", "Asana"),
    ("greenhouse", "brex", "Brex"), ("greenhouse", "chime", "Chime"),
    ("greenhouse", "webflow", "Webflow"), ("greenhouse", "gusto", "Gusto"),
    ("greenhouse", "intercom", "Intercom"), ("greenhouse", "klaviyo", "Klaviyo"),
    ("greenhouse", "twilio", "Twilio"), ("greenhouse", "affirm", "Affirm"),
    ("greenhouse", "sofi", "SoFi"), ("greenhouse", "upstart", "Upstart"),
    ("greenhouse", "airtable", "Airtable"), ("greenhouse", "lattice", "Lattice"),
    ("greenhouse", "turing", "Turing"), ("greenhouse", "calendly", "Calendly"),
    ("greenhouse", "typeform", "Typeform"), ("greenhouse", "cresta", "Cresta"),
    ("greenhouse", "algolia", "Algolia"), ("greenhouse", "planetscale", "PlanetScale"),
    ("greenhouse", "fastly", "Fastly"), ("greenhouse", "cloudflare", "Cloudflare"),
    ("greenhouse", "zscaler", "Zscaler"), ("greenhouse", "pagerduty", "PagerDuty"),
    ("greenhouse", "newrelic", "New Relic"), ("greenhouse", "elastic", "Elastic"),
    ("greenhouse", "mongodb", "MongoDB"), ("greenhouse", "squarespace", "Squarespace"),
    ("greenhouse", "carvana", "Carvana"), ("greenhouse", "coupang", "Coupang"),
    ("lever", "spotify", "Spotify"),
    ("ashby", "openai", "OpenAI"), ("ashby", "perplexity", "Perplexity"),
    ("ashby", "cohere", "Cohere"), ("ashby", "runway", "Runway"),
    ("ashby", "midjourney", "Midjourney"), ("ashby", "elevenlabs", "ElevenLabs"),
    ("ashby", "synthesia", "Synthesia"), ("ashby", "pika", "Pika"),
    ("ashby", "suno", "Suno"), ("ashby", "harvey", "Harvey"),
    ("ashby", "legora", "Legora"),
    ("remotive", "software-dev", "Remotive · remote"),
    ("remotive", "data", "Remotive · remote"),
]

BANNED_PHRASES = ["no sponsorship", "without sponsorship",
    "not provide sponsorship", "unable to sponsor", "cannot sponsor",
    "will not sponsor", "no visa sponsorship", "u.s. citizen only",
    "us citizen only", "u.s. citizens only", "must be a u.s. citizen",
    "citizenship required", "security clearance", "public trust clearance",
    "must not require sponsorship", "do not require sponsorship",
    "sponsorship is not available", "not eligible for sponsorship"]
FRIENDLY_PHRASES = ["will sponsor", "sponsorship available", "h-1b", "h1b", "opt"]


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", (s or "").lower())).strip()


def strip_html(h: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", h or ""))).strip()


def visa_screen(text: str):
    t = norm(text)
    for p in BANNED_PHRASES:
        if p in t:
            return "banned", p
    for p in FRIENDLY_PHRASES:
        if p in t:
            return "likely_sponsors", p
    return "neutral", "no visa wording found"


def match_majors(title: str) -> list[str]:
    t = norm(title)
    if any(x in t for x in SENIORITY_EXCLUDE):
        return []
    return [m for m, kws in MAJORS.items() if any(k in t for k in kws)]


def _iso_ms(ms):
    try:
        return dt.datetime.fromtimestamp(int(ms) / 1000, dt.timezone.utc).isoformat()
    except (TypeError, ValueError):
        return None


def fetch_board(portal: str, board: str, company: str) -> list[dict]:
    if portal == "greenhouse":
        r = requests.get(f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs?content=false",
                         headers=HEADERS, timeout=TIMEOUT)
        r.raise_for_status()
        return [{"portal": portal, "board": board, "company": company,
                 "job_id": str(j.get("id")), "title": j.get("title", ""),
                 "url": j.get("absolute_url", ""),
                 "location": (j.get("location") or {}).get("name", ""),
                 "description": None,  # detail fetched later
                 "posted_at": None}
                for j in r.json().get("jobs", [])]
    if portal == "lever":
        r = requests.get(f"https://api.lever.co/v0/postings/{board}?mode=json",
                         headers=HEADERS, timeout=TIMEOUT)
        r.raise_for_status()
        data = r.json()
        return [{"portal": portal, "board": board, "company": company,
                 "job_id": str(j.get("id")), "title": j.get("text", ""),
                 "url": j.get("hostedUrl", ""),
                 "location": (j.get("categories") or {}).get("location", ""),
                 "description": strip_html(j.get("description", "")),
                 "posted_at": _iso_ms(j.get("createdAt"))}
                for j in (data if isinstance(data, list) else [])]
    if portal == "ashby":
        r = requests.get(f"https://api.ashbyhq.com/posting-api/job-board/{board}",
                         headers=HEADERS, timeout=TIMEOUT)
        r.raise_for_status()
        return [{"portal": portal, "board": board, "company": company,
                 "job_id": str(j.get("id")), "title": j.get("title", ""),
                 "url": j.get("jobUrl", ""), "location": j.get("locationName", ""),
                 "posted_at": j.get("publishedAt"),
                 "description": strip_html(j.get("descriptionHtml") or j.get("descriptionPlain", ""))}
                for j in r.json().get("jobs", [])]
    if portal == "remotive":
        r = requests.get(f"https://remotive.com/api/remote-jobs?category={board}&limit=100",
                         headers=HEADERS, timeout=TIMEOUT)
        r.raise_for_status()
        return [{"portal": portal, "board": board, "company": j.get("company_name", ""),
                 "job_id": "remotive-" + str(j.get("id")), "title": j.get("title", ""),
                 "url": j.get("url", ""),
                 "location": (j.get("candidate_required_location") or "") + " (remote)",
                 "posted_at": j.get("publication_date"),
                 "description": strip_html(j.get("description", ""))}
                for j in r.json().get("jobs", [])]
    return []


def greenhouse_detail(job: dict) -> None:
    try:
        r = requests.get(
            f"https://boards-api.greenhouse.io/v1/boards/{job['board']}/jobs/{job['job_id']}?questions=false",
            headers=HEADERS, timeout=TIMEOUT)
        if r.ok:
            job["description"] = strip_html(r.json().get("content", ""))
    except Exception:
        pass
    if not job["description"]:
        job["description"] = ""


PORTAL_RANK = {"greenhouse": 0, "lever": 0, "ashby": 0, "remotive": 1}


def dedup_key(j: dict) -> tuple[str, str]:
    company = re.sub(r"\s+(inc|llc|corp|co|ltd)$", "", norm(j["company"]))
    return (company, norm(j["title"]))


def dedupe(jobs: list[dict]) -> list[dict]:
    """Collapse duplicate postings so each (company, title) appears once.

    Keep-best order: direct ATS board beats aggregator, then the posting
    with a description, then first seen.
    """
    best: dict[tuple[str, str], dict] = {}
    for j in jobs:
        k = dedup_key(j)
        cur = best.get(k)
        if cur is None:
            best[k] = j
            continue
        if PORTAL_RANK.get(j["portal"], 2) < PORTAL_RANK.get(cur["portal"], 2):
            best[k] = j
        elif not cur.get("description") and j.get("description"):
            best[k] = j
    return list(best.values())


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(HERE, "jobs.json"))
    args = ap.parse_args()

    all_jobs: list[dict] = []
    ok_boards = 0
    with cf.ThreadPoolExecutor(max_workers=16) as ex:
        futs = {ex.submit(fetch_board, p, b, c): (p, b) for p, b, c in BOARDS}
        for f in cf.as_completed(futs):
            try:
                all_jobs.extend(f.result())
                ok_boards += 1
            except Exception as e:
                print(f"board {futs[f]} failed: {e}", file=sys.stderr)
    print(f"boards ok: {ok_boards}/{len(BOARDS)}, postings scanned: {len(all_jobs)}")

    matched = []
    for j in all_jobs:
        majors = match_majors(j["title"])
        if majors:
            j["majors"] = majors
            matched.append(j)
    print(f"title-matched: {len(matched)}")

    gh = [j for j in matched if j["description"] is None]
    with cf.ThreadPoolExecutor(max_workers=16) as ex:
        list(ex.map(greenhouse_detail, gh))
    print(f"greenhouse details fetched: {len(gh)}")

    jobs = []
    for j in matched:
        verdict, reason = visa_screen(j["description"] or "")
        jobs.append({
            "portal": j["portal"], "company": j["company"], "job_id": j["job_id"],
            "title": j["title"], "url": j["url"], "location": j["location"],
            "majors": j["majors"], "visa_verdict": verdict, "visa_reason": reason,
            "posted_at": j.get("posted_at"),
            "description": (j["description"] or "")[:DESC_CHARS],
        })
    jobs.sort(key=lambda j: (j["visa_verdict"] == "banned", j["company"], j["title"]))

    before = len(jobs)
    jobs = dedupe(jobs)
    print(f"deduped: {before} -> {len(jobs)} (removed {before - len(jobs)} duplicates)")

    snapshot = {"updated_at": dt.datetime.now(dt.timezone.utc).isoformat(), "jobs": jobs}
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, separators=(",", ":"))
    size_kb = os.path.getsize(args.out) // 1024
    print(f"wrote {args.out}: {len(jobs)} jobs, {size_kb} KB")


if __name__ == "__main__":
    main()
