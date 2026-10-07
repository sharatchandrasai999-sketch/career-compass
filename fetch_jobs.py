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
    ("greenhouse", "nextroll", "Nextroll"),
    ("greenhouse", "cloudbeds", "Cloudbeds"),
    ("greenhouse", "fleetio", "Fleetio"),
    ("greenhouse", "axon", "Axon"),
    ("greenhouse", "tubitv", "Tubitv"),
    ("greenhouse", "eltropyinc", "Eltropyinc"),
    ("greenhouse", "cognitiv", "Cognitiv"),
    ("greenhouse", "shopmonkey", "Shopmonkey"),
    ("greenhouse", "ezcaterinc", "Ezcaterinc"),
    ("greenhouse", "trivelta", "Trivelta"),
    ("greenhouse", "appdirect", "Appdirect"),
    ("greenhouse", "hs", "Hs"),
    ("greenhouse", "betterhelpcom", "Betterhelpcom"),
    ("greenhouse", "starrez", "Starrez"),
    ("greenhouse", "engine", "Engine"),
    ("greenhouse", "headspacesourcing", "Headspacesourcing"),
    ("greenhouse", "weedmaps77", "Weedmaps77"),
    ("greenhouse", "patterndata", "Patterndata"),
    ("ashby", "higharc", "Higharc"),
    ("ashby", "mural", "Mural"),
    ("ashby", "ironcladhq", "Ironcladhq"),
    ("ashby", "wrapbook", "Wrapbook"),
    ("ashby", "tabs", "Tabs"),
    ("ashby", "vibe", "Vibe"),
    ("ashby", "unicourt", "Unicourt"),
    ("ashby", "meridianlink", "Meridianlink"),
    ("ashby", "scan-com", "Scan Com"),
    ("ashby", "virtuous", "Virtuous"),
    ("lever", "agiloft", "Agiloft"),
    ("lever", "gohighlevel", "Gohighlevel"),
    ("lever", "rover", "Rover"),
    ("lever", "redoxengine", "Redoxengine"),
    ("greenhouse", "6sense", "6sense"),    ("greenhouse", "abnormalsecurity", "Abnormal Security"),    ("greenhouse", "airship", "Airship"),    ("greenhouse", "alloy", "Alloy"),    ("greenhouse", "alpaca", "Alpaca"),    ("greenhouse", "anthropic", "Anthropic"),    ("greenhouse", "apolloio", "Apollo.io"),    ("greenhouse", "appian", "Appian"),    ("greenhouse", "arizeai", "Arize AI"),    ("greenhouse", "assemblyai", "AssemblyAI"),    ("greenhouse", "attentive", "Attentive"),    ("greenhouse", "axonius", "Axonius"),    ("greenhouse", "backblaze", "Backblaze"),    ("greenhouse", "beamtherapeutics", "Beam Therapeutics"),    ("greenhouse", "betterhelp", "BetterHelp"),    ("greenhouse", "betterment", "Betterment"),    ("greenhouse", "bigid", "BigID"),    ("greenhouse", "billcom", "Bill.com"),    ("greenhouse", "bitgo", "BitGo"),    ("greenhouse", "bitpanda", "Bitpanda"),    ("greenhouse", "bitwarden", "Bitwarden"),    ("greenhouse", "blend", "Blend"),    ("greenhouse", "bloomreach", "Bloomreach"),    ("greenhouse", "braze", "Braze"),    ("greenhouse", "bringg", "Bringg"),    ("greenhouse", "bybit", "Bybit"),    ("greenhouse", "calicolabs", "Calico Labs"),    ("greenhouse", "calm", "Calm"),    ("greenhouse", "cameo", "Cameo"),    ("greenhouse", "carta", "Carta"),    ("greenhouse", "catonetworks", "Cato Networks"),    ("greenhouse", "celigo", "Celigo"),    ("greenhouse", "censys", "Censys"),    ("greenhouse", "chainguard", "Chainguard"),    ("greenhouse", "checkr", "Checkr"),    ("greenhouse", "circleci", "CircleCI"),    ("greenhouse", "classpass", "ClassPass"),    ("greenhouse", "cleo", "Cleo"),    ("greenhouse", "cognism", "Cognism"),    ("greenhouse", "complyadvantage", "ComplyAdvantage"),    ("greenhouse", "consensys", "Consensys"),    ("greenhouse", "contentful", "Contentful"),    ("greenhouse", "coreweave", "CoreWeave"),    ("greenhouse", "coursera", "Coursera"),    ("greenhouse", "cribl", "Cribl"),    ("greenhouse", "cultureamp", "Culture Amp"),    ("greenhouse", "current", "Current"),    ("greenhouse", "customerio", "Customer.io"),    ("greenhouse", "datadog", "Datadog"),    ("greenhouse", "descope", "Descope"),    ("greenhouse", "dominodatalab", "Domino Data Lab"),    ("greenhouse", "doordashusa", "DoorDash"),    ("greenhouse", "doximity", "Doximity"),    ("greenhouse", "earnin", "Earnin"),    ("greenhouse", "epicgames", "Epic Games"),    ("greenhouse", "everlaw", "Everlaw"),    ("greenhouse", "faire", "Faire"),    ("greenhouse", "feedzai", "Feedzai"),    ("greenhouse", "figure", "Figure Technologies"),    ("greenhouse", "filecoinfoundation", "Filecoin Foundation"),    ("greenhouse", "fireblocks", "Fireblocks"),    ("greenhouse", "flatironhealth", "Flatiron Health"),    ("greenhouse", "flexe", "Flexe"),    ("greenhouse", "flexport", "Flexport"),    ("greenhouse", "forter", "Forter"),    ("greenhouse", "fourkites", "FourKites"),    ("greenhouse", "freenome", "Freenome"),    ("greenhouse", "future", "Future Fit"),    ("greenhouse", "gemini", "Gemini"),    ("greenhouse", "ginkgobioworks", "Ginkgo Bioworks"),    ("greenhouse", "gitlab", "GitLab"),    ("greenhouse", "gleanwork", "Glean"),    ("greenhouse", "globalizationpartners", "Globalization Partners"),    ("greenhouse", "gocardless", "GoCardless"),    ("greenhouse", "goguardian", "GoGuardian"),    ("greenhouse", "gomotive", "Motive"),    ("greenhouse", "grafanalabs", "Grafana Labs"),    ("greenhouse", "greenhouse", "Greenhouse Software"),    ("greenhouse", "gympass", "Gympass"),    ("greenhouse", "hackerrank", "HackerRank"),    ("greenhouse", "hellofresh", "HelloFresh"),    ("greenhouse", "highnote", "Highnote"),    ("greenhouse", "homechef", "Home Chef"),    ("greenhouse", "homelight", "Homelight"),    ("greenhouse", "homeward", "Homeward"),    ("greenhouse", "honeycomb", "Honeycomb"),    ("greenhouse", "humaninterest", "Human Interest"),    ("greenhouse", "huntress", "Huntress"),    ("greenhouse", "imbue", "Imbue"),    ("greenhouse", "imply", "Imply"),    ("greenhouse", "inflectionai", "Inflection AI"),    ("greenhouse", "instawork", "Instawork"),    ("greenhouse", "invisibletech", "Invisible Technologies"),    ("greenhouse", "ixllearning", "IXL Learning"),    ("greenhouse", "janestreet", "Jane Street"),    ("greenhouse", "jfrog", "JFrog"),    ("greenhouse", "justworks", "Justworks"),    ("greenhouse", "karat", "Karat"),    ("greenhouse", "kasa", "Kasa Living"),    ("greenhouse", "khanacademy", "Khan Academy"),    ("greenhouse", "kickstarter", "Kickstarter"),    ("greenhouse", "knock", "Knock"),    ("greenhouse", "knowbe4", "KnowBe"),    ("greenhouse", "labelbox", "Labelbox"),    ("greenhouse", "launchdarkly", "LaunchDarkly"),    ("greenhouse", "lithic", "Lithic"),    ("greenhouse", "luno", "Luno"),    ("greenhouse", "masterclass", "MasterClass"),    ("greenhouse", "mavenclinic", "Maven Clinic"),    ("greenhouse", "mercury", "Mercury"),    ("greenhouse", "mindbody", "Mindbody"),    ("greenhouse", "minio", "MinIO"),    ("greenhouse", "misfitsmarket", "Misfits Market"),    ("greenhouse", "mixpanel", "Mixpanel"),    ("greenhouse", "modernhealth", "Modern Health"),    ("greenhouse", "monzo", "Monzo"),    ("greenhouse", "movableink", "Movable Ink"),    ("greenhouse", "mozilla", "Mozilla"),    ("greenhouse", "myfitnesspal", "MyFitnessPal"),    ("greenhouse", "n26", "N"),    ("greenhouse", "narvar", "Narvar"),    ("greenhouse", "natera", "Natera"),    ("greenhouse", "netlify", "Netlify"),    ("greenhouse", "netskope", "Netskope"),    ("greenhouse", "newsela", "Newsela"),    ("greenhouse", "nextdoor", "Nextdoor"),    ("greenhouse", "novacredit", "Nova Credit"),    ("greenhouse", "nuro", "Nuro"),    ("greenhouse", "observeai", "Observe.AI"),    ("greenhouse", "offerup", "OfferUp"),    ("greenhouse", "okta", "Okta"),    ("greenhouse", "okx", "OKX"),    ("greenhouse", "omadahealth", "Omada Health"),    ("greenhouse", "onemedical", "One Medical"),    ("greenhouse", "onetrust", "OneTrust"),    ("greenhouse", "orcasecurity", "Orca Security"),    ("greenhouse", "orchard", "Orchard"),    ("greenhouse", "osano", "Osano"),    ("greenhouse", "otterai", "Otter.ai"),    ("greenhouse", "oura", "Oura"),    ("greenhouse", "parsleyhealth", "Parsley Health"),    ("greenhouse", "peloton", "Peloton"),    ("greenhouse", "pendo", "Pendo"),    ("greenhouse", "polyai", "PolyAI"),    ("greenhouse", "prismatic", "Prismatic"),    ("greenhouse", "project44", "project"),    ("greenhouse", "proton", "Proton"),    ("greenhouse", "public", "Public.com"),    ("greenhouse", "qualtrics", "Qualtrics"),    ("greenhouse", "quillbot", "QuillBot"),    ("greenhouse", "recordedfuture", "Recorded Future"),    ("greenhouse", "recursionpharmaceuticals", "Recursion Pharmaceuticals"),    ("greenhouse", "redwoodmaterials", "Redwood Materials"),    ("greenhouse", "relativity", "Relativity"),    ("greenhouse", "remote", "Remote"),    ("greenhouse", "riotgames", "Riot Games"),    ("greenhouse", "riskified", "Riskified"),    ("greenhouse", "roblox", "Roblox"),    ("greenhouse", "rocketlab", "Rocket Lab"),    ("greenhouse", "rubrik", "Rubrik"),    ("greenhouse", "sambanovasystems", "SambaNova Systems"),    ("greenhouse", "samsara", "Samsara"),    ("greenhouse", "scaleai", "Scale AI"),    ("greenhouse", "scopely", "Scopely"),    ("greenhouse", "seekout", "SeekOut"),    ("greenhouse", "sezzle", "Sezzle"),    ("greenhouse", "smartsheet", "Smartsheet"),    ("greenhouse", "snorkelai", "Snorkel AI"),    ("greenhouse", "speechmatics", "Speechmatics"),    ("greenhouse", "springboard", "Springboard"),    ("greenhouse", "stabilityai", "Stability AI"),    ("greenhouse", "starburst", "Starburst"),    ("greenhouse", "stitchfix", "StitchFix"),    ("greenhouse", "stockx", "StockX"),    ("greenhouse", "sumologic", "Sumo Logic"),    ("greenhouse", "swordhealth", "Sword Health"),    ("greenhouse", "tailscale", "Tailscale"),    ("greenhouse", "talkspace", "Talkspace"),    ("greenhouse", "taskrabbit", "TaskRabbit"),    ("greenhouse", "tempo", "Tempo Fit"),    ("greenhouse", "textio", "Textio"),    ("greenhouse", "thrivemarket", "Thrive Market"),    ("greenhouse", "toast", "Toast"),    ("greenhouse", "togetherai", "Together AI"),    ("greenhouse", "traderepublicbank", "Trade Republic"),    ("greenhouse", "tripactions", "TripActions"),    ("greenhouse", "truelayer", "TrueLayer"),    ("greenhouse", "truveta", "Truveta"),    ("greenhouse", "twitch", "Twitch"),    ("greenhouse", "udacity", "Udacity"),    ("greenhouse", "udemy", "Udemy"),    ("greenhouse", "upwork", "Upwork"),    ("greenhouse", "vardaspace", "Varda Space"),    ("greenhouse", "vectara", "Vectara"),    ("greenhouse", "vercel", "Vercel"),    ("greenhouse", "verkada", "Verkada"),    ("greenhouse", "vestwell", "Vestwell"),    ("greenhouse", "wasabi", "Wasabi Technologies"),    ("greenhouse", "weee", "Weee!"),    ("greenhouse", "wikimedia", "Wikimedia Foundation"),    ("greenhouse", "wizinc", "Wiz"),    ("greenhouse", "workato", "Workato"),    ("greenhouse", "wrike", "Wrike"),    ("greenhouse", "ziprecruiter", "ZipRecruiter"),    ("greenhouse", "zoominfo", "ZoomInfo"),    ("lever", "aircall", "Aircall"),    ("lever", "brightedge", "BrightEdge"),    ("lever", "outreach", "Outreach"),    ("lever", "palantir", "Palantir"),    ("lever", "ro", "Ro"),    ("lever", "tala", "Tala"),    ("lever", "veeva", "Veeva Systems"),    ("lever", "wattpad", "Wattpad"),    ("lever", "zoox", "Zoox"),    ("ashby", "abridge", "Abridge"),    ("ashby", "anrok", "Anrok"),    ("ashby", "attio", "Attio"),    ("ashby", "aurorasolar", "Aurora Solar"),    ("ashby", "baseten", "Baseten"),    ("ashby", "bland", "Bland"),    ("ashby", "braintrust", "Braintrust"),    ("ashby", "cedar", "Cedar"),    ("ashby", "character", "Character AI"),    ("ashby", "column", "Column"),    ("ashby", "crusoe", "Crusoe"),    ("ashby", "cursor", "Cursor (Anysphere)"),    ("ashby", "decagon", "Decagon"),    ("ashby", "drata", "Drata"),    ("ashby", "eightsleep", "Eight Sleep"),    ("ashby", "endgame", "Endgame"),    ("ashby", "gamma", "Gamma"),    ("ashby", "griffin", "Griffin"),    ("ashby", "headway", "Headway"),    ("ashby", "krea", "Krea AI"),    ("ashby", "langchain", "LangChain"),    ("ashby", "levels", "Levels"),    ("ashby", "linear", "Linear"),    ("ashby", "lovable", "Lovable"),    ("ashby", "mercor", "Mercor"),    ("ashby", "merge", "Merge"),    ("ashby", "middesk", "Middesk"),    ("ashby", "modal", "Modal"),    ("ashby", "moderntreasury", "Modern Treasury"),    ("ashby", "nango", "Nango"),    ("ashby", "notion", "Notion"),    ("ashby", "orb", "Orb"),    ("ashby", "persona", "Persona"),    ("ashby", "pinecone", "Pinecone"),    ("ashby", "poolside", "Poolside"),    ("ashby", "posthog", "PostHog"),    ("ashby", "preply", "Preply"),    ("ashby", "ramp", "Ramp"),    ("ashby", "reflectionai", "Reflection AI"),    ("ashby", "replit", "Replit"),    ("ashby", "resend", "Resend"),    ("ashby", "rho", "Rho"),    ("ashby", "rilla", "Rilla"),    ("ashby", "rula", "Rula"),    ("ashby", "runpod", "Runpod"),    ("ashby", "sardine", "Sardine"),    ("ashby", "saronic", "Saronic"),    ("ashby", "secureframe", "Secureframe"),    ("ashby", "sierra", "Sierra"),    ("ashby", "skydio", "Skydio"),    ("ashby", "snowflake", "Snowflake"),    ("ashby", "speak", "Speak"),    ("ashby", "substack", "Substack"),    ("ashby", "superpower", "Superpower"),    ("ashby", "triggerdev", "Trigger.dev"),    ("ashby", "unit", "Unit"),    ("ashby", "vanta", "Vanta"),    ("ashby", "warp", "Warp"),    ("ashby", "watershed", "Watershed"),    ("ashby", "weaviate", "Weaviate"),    ("ashby", "whoop", "Whoop"),    ("ashby", "zapier", "Zapier"),    ("ashby", "zilch", "Zilch"),    ("greenhouse", "airbnb", "Airbnb"), ("greenhouse", "stripe", "Stripe"),
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


PORTAL_RANK = {"greenhouse": 0, "lever": 0, "ashby": 0, "smartrecruiters": 0,
               "workday": 0, "recruitee": 0, "personio": 0,
               "remoteok": 1, "hackernews": 1, "wwr": 1, "remotive": 1, "rippling": 1}

# Workday is per-tenant: (tenant, datacenter, site, company). No CORS headers,
# so these are snapshot-only (the Actions runner calls them server-side).
WORKDAY = [
    ("nvidia", "wd5", "NVIDIAExternalCareerSite", "NVIDIA"),
    ("intel", "wd1", "External", "Intel"),
    ("salesforce", "wd12", "External_Career_Site", "Salesforce"),
    ("adobe", "wd5", "external_experienced", "Adobe"),
    ("accenture", "wd103", "AccentureCareers", "Accenture"),
    ("redhat", "wd5", "Jobs", "Red Hat"),
    ("target", "wd5", "targetcareers", "Target"),
    ("paypal", "wd1", "jobs", "PayPal"),
    ("autodesk", "wd1", "Ext", "Autodesk"),
    ("vanguard", "wd5", "Vanguard_External", "Vanguard"),
    ("cvshealth", "wd1", "CVS_Health_Careers", "CVS Health"),
    ("proofpoint", "wd5", "proofpointcareers", "Proofpoint"),
    ("browserstack", "wd3", "External", "BrowserStack"),
    ("sprinklr", "wd1", "Careers", "Sprinklr"),
    ("workday", "wd5", "Workday", "Workday Inc"),
]
WORKDAY_SEARCHES = ["machine learning", "artificial intelligence",
                    "data scientist", "data engineer"]
WORKDAY_PAGES = 3  # 20 postings per page
WD_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
         "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

SMARTRECRUITERS = [
    ("BoschGroup", "Bosch Group"),
    ("Equinox", "Equinox"),
    ("TheWonderfulCompany", "The Wonderful Company"),
    ("Version1", "Version 1"),
    ("DeliveryHero", "Delivery Hero"),
]

RECRUITEE = [
    ("helloprint", "Helloprint"),
    ("channable", "Channable"),
    ("trustedshops", "Trusted Shops"),
    ("bunq", "bunq"),
    ("cmcom", "CM.com"),
]

PERSONIO = [
    ("personio", "Personio"),
    ("clark", "Clark"),
]

RIPPLING = [
    ("rippling", "Rippling"),
    ("smokeballcareers", "Smokeball"),
    ("celerdataopenroles", "CelerData"),
    ("ias-careers", "IAS"),
]


def fetch_rippling(slug, company) -> list[dict]:
    jobs = []
    try:
        r = requests.get(
            f"https://api.rippling.com/platform/api/ats/v1/board/{slug}/jobs",
            headers=HEADERS, timeout=TIMEOUT)
        if not r.ok:
            return []
        d = r.json()
        items = d if isinstance(d, list) else d.get("jobs", [])
        for j in items:
            loc = j.get("workLocation") or {}
            loc_s = loc.get("label", "") if isinstance(loc, dict) else str(loc)
            jobs.append({
                "portal": "rippling", "board": slug, "company": company,
                "job_id": f"rippling-{j.get('uuid', '')}",
                "title": j.get("name", ""),
                "url": j.get("url", "") or f"https://ats.rippling.com/{slug}/jobs",
                "location": loc_s, "description": "", "posted_at": None})
    except Exception:
        pass
    return jobs


def fetch_recruitee(slug, company) -> list[dict]:
    jobs = []
    try:
        r = requests.get(f"https://{slug}.recruitee.com/api/offers/",
                         headers=HEADERS, timeout=TIMEOUT)
        if not r.ok:
            return []
        d = r.json()
        offers = d.get("offers", d if isinstance(d, list) else [])
        for o in offers:
            jobs.append({
                "portal": "recruitee", "board": slug, "company": company,
                "job_id": f"recruitee-{o.get('id', '')}",
                "title": o.get("title", ""),
                "url": o.get("careers_url") or o.get("careers_apply_url", ""),
                "location": o.get("location", ""),
                "description": strip_html(o.get("description", ""))[:DESC_CHARS],
                "posted_at": o.get("created_at")})
    except Exception:
        pass
    return jobs


def fetch_personio(slug, company) -> list[dict]:
    jobs = []
    try:
        r = requests.get(f"https://{slug}.jobs.personio.de/xml",
                         headers=HEADERS, timeout=TIMEOUT)
        if not r.ok:
            return []
        for m in re.finditer(r"<position>(.*?)</position>", r.text, re.S):
            p = m.group(1)
            def tag(t):
                x = re.search(rf"<{t}>(.*?)</{t}>", p, re.S)
                return html.unescape(x.group(1).strip()) if x else ""
            desc = " ".join(re.findall(
                r"<jobDescription>.*?<value>(.*?)</value>", p, re.S))
            jobs.append({
                "portal": "personio", "board": slug, "company": company,
                "job_id": f"personio-{tag('id')}",
                "title": tag("name"),
                "url": f"https://{slug}.jobs.personio.de/job/{tag('id')}",
                "location": tag("office"),
                "description": strip_html(desc)[:DESC_CHARS],
                "posted_at": None})
    except Exception:
        pass
    return jobs


def parse_posted_on(s):
    """Workday relative dates -> ISO, e.g. 'Posted 5 Days Ago'."""
    now = dt.datetime.now(dt.timezone.utc)
    t = (s or "").lower()
    if "today" in t:
        return now.isoformat()
    if "yesterday" in t:
        return (now - dt.timedelta(days=1)).isoformat()
    m = re.search(r"(\d+)\+?\s*days?\s*ago", t)
    if m:
        try:
            return (now - dt.timedelta(days=int(m.group(1)))).isoformat()
        except ValueError:
            return None
    return None


def fetch_workday(tenant, dc, site, company):
    jobs, seen = [], set()
    base = f"https://{tenant}.{dc}.myworkdayjobs.com"
    headers = {"User-Agent": WD_UA, "Content-Type": "application/json",
               "Accept": "application/json", "Origin": base,
               "Referer": f"{base}/{site}/"}
    url = f"{base}/wday/cxs/{tenant}/{site}/jobs"
    for q in WORKDAY_SEARCHES:
        for page in range(WORKDAY_PAGES):
            try:
                r = requests.post(url, headers=headers,
                    json={"appliedFacets": {}, "limit": 20,
                          "offset": page * 20, "searchText": q},
                    timeout=TIMEOUT)
                if not r.ok:
                    break
                postings = r.json().get("jobPostings", [])
                if not postings:
                    break
                for p in postings:
                    jid = p.get("externalPath", "")
                    if not jid or jid in seen:
                        continue
                    seen.add(jid)
                    jobs.append({
                        "portal": "workday", "board": tenant, "company": company,
                        "job_id": jid, "title": p.get("title", ""),
                        "url": f"{base}/{site}{jid}",
                        "location": p.get("locationsText", ""),
                        "description": "",  # list API has no JD text
                        "posted_at": parse_posted_on(p.get("postedOn", ""))})
            except Exception:
                break
    return jobs


def fetch_sr(slug, company):
    jobs = []
    try:
        r = requests.get(
            f"https://api.smartrecruiters.com/v1/companies/{slug}/postings?limit=100",
            headers=HEADERS, timeout=TIMEOUT)
        if not r.ok:
            return []
        for c in r.json().get("content", []):
            loc = c.get("location") or {}
            full = loc.get("fullLocation", "") or ", ".join(
                x for x in (loc.get("city"), loc.get("country")) if x)
            jobs.append({
                "portal": "smartrecruiters", "board": slug, "company": company,
                "job_id": str(c.get("id", "")), "title": c.get("name", ""),
                "url": f"https://jobs.smartrecruiters.com/{slug}/{c.get('id', '')}",
                "location": full, "description": None,  # detail fetched later
                "posted_at": c.get("releasedDate"), "_slug": slug})
    except Exception:
        pass
    return jobs


def sr_detail(job):
    try:
        r = requests.get(
            f"https://api.smartrecruiters.com/v1/companies/{job['_slug']}/postings/{job['job_id']}",
            headers=HEADERS, timeout=TIMEOUT)
        if r.ok:
            d = r.json()
            secs = (d.get("jobAd") or {}).get("sections") or {}
            job["description"] = " ".join(
                strip_html(secs.get(k, "")) for k in
                ("jobDescription", "qualifications", "additionalInformation"))
            if d.get("postingUrl"):
                job["url"] = d["postingUrl"]
    except Exception:
        pass
    if not job["description"]:
        job["description"] = ""


def fetch_remoteok() -> list[dict]:
    """RemoteOK: startup-heavy remote tech jobs, public JSON API."""
    jobs = []
    try:
        r = requests.get("https://remoteok.com/api", headers=HEADERS, timeout=TIMEOUT)
        if not r.ok:
            return []
        for it in r.json()[1:]:  # [0] is a legal notice
            jobs.append({
                "portal": "remoteok", "board": "", "company": it.get("company", ""),
                "job_id": f"remoteok-{it.get('id', '')}",
                "title": it.get("position", ""),
                "url": it.get("apply_url") or it.get("url", ""),
                "location": (it.get("location") or "") + " (remote)",
                "description": strip_html(it.get("description", "")),
                "posted_at": it.get("date")})
    except Exception:
        pass
    return jobs


def fetch_hn() -> list[dict]:
    """Hacker News job stories: YC startup hiring posts, public Firebase API."""
    jobs = []
    try:
        r = requests.get("https://hacker-news.firebaseio.com/v0/jobstories.json",
                         headers=HEADERS, timeout=TIMEOUT)
        if not r.ok:
            return []
        ids = r.json()[:31]
        with cf.ThreadPoolExecutor(max_workers=8) as ex:
            items = list(ex.map(
                lambda i: requests.get(
                    f"https://hacker-news.firebaseio.com/v0/item/{i}.json",
                    headers=HEADERS, timeout=TIMEOUT).json(), ids))
        for it in items:
            if not isinstance(it, dict) or not it.get("title"):
                continue
            raw = it["title"]
            company = re.split(r"\s*\(YC|\s+is\s+hiring|\s+[–—-]\s+", raw, maxsplit=1)[0].strip()
            clean = re.sub(r"\s*\(YC[^)]*\)\s*", " ", raw)
            clean = re.sub(r"(?i)^\s*" + re.escape(company) + r"\s*", "", clean)
            clean = re.sub(r"(?i)is hiring\s*", "", clean).strip(" -–—")
            jobs.append({
                "portal": "hackernews", "board": "", "company": company or "YC startup",
                "job_id": f"hn-{it.get('id', '')}",
                "title": clean or raw,
                "url": it.get("url") or f"https://news.ycombinator.com/item?id={it.get('id', '')}",
                "location": "", "description": "",
                "posted_at": _iso_ms((it.get("time") or 0) * 1000)})
    except Exception:
        pass
    return jobs


WWR_CATS = {"Full-Stack Programming", "Front-End Programming",
            "Back-End Programming", "DevOps and Sysadmin"}


def fetch_wwr() -> list[dict]:
    """We Work Remotely programming RSS (no CORS -> snapshot-only)."""
    jobs = []
    try:
        r = requests.get("https://weworkremotely.com/remote-jobs.rss",
                         headers=HEADERS, timeout=TIMEOUT)
        if not r.ok:
            return []
        for m in re.finditer(r"<item>(.*?)</item>", r.text, re.S):
            im = m.group(1)
            def tag(t):
                x = re.search(rf"<{t}>(.*?)</{t}>", im, re.S)
                return html.unescape(x.group(1).strip()) if x else ""
            if tag("category") not in WWR_CATS:
                continue
            pub = tag("pubDate")
            try:
                posted = dt.datetime.strptime(pub, "%a, %d %b %Y %H:%M:%S %z").isoformat()
            except ValueError:
                posted = None
            link = re.sub(r"<!\[CDATA\[(.*?)\]\]>", r"\1", tag("link"))
            raw_title = re.sub(r"<!\[CDATA\[(.*?)\]\]>", r"\1", tag("title"))
            company, _, title = raw_title.partition(":")
            title, company = title.strip(), company.strip()
            jobs.append({
                "portal": "wwr", "board": "", "company": company,
                "job_id": f"wwr-{abs(hash(link)) % 10**10}",
                "title": title or raw_title,
                "url": link, "location": "Remote",
                "description": strip_html(tag("description"))[:4000],
                "posted_at": posted})
    except Exception:
        pass
    return jobs


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
        futs.update({ex.submit(fetch_workday, t, d, s, c): ("workday", t)
                     for t, d, s, c in WORKDAY})
        futs.update({ex.submit(fetch_sr, s, c): ("smartrecruiters", s)
                     for s, c in SMARTRECRUITERS})
        futs.update({ex.submit(fetch_remoteok): ("remoteok", ""),
                     ex.submit(fetch_hn): ("hackernews", ""),
                     ex.submit(fetch_wwr): ("wwr", "")})
        futs.update({ex.submit(fetch_recruitee, s, c): ("recruitee", s)
                     for s, c in RECRUITEE})
        futs.update({ex.submit(fetch_personio, s, c): ("personio", s)
                     for s, c in PERSONIO})
        futs.update({ex.submit(fetch_rippling, s, c): ("rippling", s)
                     for s, c in RIPPLING})
        for f in cf.as_completed(futs):
            try:
                all_jobs.extend(f.result())
                ok_boards += 1
            except Exception as e:
                print(f"board {futs[f]} failed: {e}", file=sys.stderr)
    total_sources = len(BOARDS) + len(WORKDAY) + len(SMARTRECRUITERS) + len(RECRUITEE) + len(PERSONIO) + len(RIPPLING) + 3
    print(f"boards ok: {ok_boards}/{total_sources}, postings scanned: {len(all_jobs)}")

    matched = []
    for j in all_jobs:
        majors = match_majors(j["title"])
        if majors:
            j["majors"] = majors
            matched.append(j)
    print(f"title-matched: {len(matched)}")

    gh = [j for j in matched if j["description"] is None]
    with cf.ThreadPoolExecutor(max_workers=16) as ex:
        list(ex.map(greenhouse_detail,
                    [j for j in gh if j["portal"] == "greenhouse"]))
        list(ex.map(sr_detail,
                    [j for j in gh if j["portal"] == "smartrecruiters"]))
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
