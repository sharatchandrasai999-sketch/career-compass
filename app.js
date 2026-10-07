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
  ["greenhouse", "brex", "Brex"], ["greenhouse", "chime", "Chime"],
  ["greenhouse", "webflow", "Webflow"], ["greenhouse", "gusto", "Gusto"],
  ["greenhouse", "intercom", "Intercom"], ["greenhouse", "klaviyo", "Klaviyo"],
  ["greenhouse", "twilio", "Twilio"], ["greenhouse", "affirm", "Affirm"],
  ["greenhouse", "sofi", "SoFi"], ["greenhouse", "upstart", "Upstart"],
  ["greenhouse", "airtable", "Airtable"], ["greenhouse", "lattice", "Lattice"],
  ["greenhouse", "turing", "Turing"], ["greenhouse", "calendly", "Calendly"],
  ["greenhouse", "typeform", "Typeform"], ["greenhouse", "cresta", "Cresta"],
  ["greenhouse", "algolia", "Algolia"], ["greenhouse", "planetscale", "PlanetScale"],
  ["greenhouse", "fastly", "Fastly"], ["greenhouse", "cloudflare", "Cloudflare"],
  ["greenhouse", "zscaler", "Zscaler"], ["greenhouse", "pagerduty", "PagerDuty"],
  ["greenhouse", "newrelic", "New Relic"], ["greenhouse", "elastic", "Elastic"],
  ["greenhouse", "mongodb", "MongoDB"], ["greenhouse", "squarespace", "Squarespace"],
  ["greenhouse", "carvana", "Carvana"], ["greenhouse", "coupang", "Coupang"],
  ["lever", "spotify", "Spotify"],
  ["ashby", "openai", "OpenAI"], ["ashby", "perplexity", "Perplexity"],
  ["ashby", "cohere", "Cohere"], ["ashby", "runway", "Runway"],
  ["ashby", "midjourney", "Midjourney"], ["ashby", "elevenlabs", "ElevenLabs"],
  ["ashby", "synthesia", "Synthesia"], ["ashby", "pika", "Pika"],
  ["ashby", "suno", "Suno"], ["ashby", "harvey", "Harvey"],
  ["ashby", "legora", "Legora"],
  // Remotive: remote-jobs aggregator (free API, link back as source per their terms)
{ portal: "greenhouse", board: "6sense", company: "6sense" },
  { portal: "greenhouse", board: "abnormalsecurity", company: "Abnormal Security" },
  { portal: "greenhouse", board: "airship", company: "Airship" },
  { portal: "greenhouse", board: "alloy", company: "Alloy" },
  { portal: "greenhouse", board: "alpaca", company: "Alpaca" },
  { portal: "greenhouse", board: "anthropic", company: "Anthropic" },
  { portal: "greenhouse", board: "apolloio", company: "Apollo.io" },
  { portal: "greenhouse", board: "appian", company: "Appian" },
  { portal: "greenhouse", board: "arizeai", company: "Arize AI" },
  { portal: "greenhouse", board: "assemblyai", company: "AssemblyAI" },
  { portal: "greenhouse", board: "attentive", company: "Attentive" },
  { portal: "greenhouse", board: "axonius", company: "Axonius" },
  { portal: "greenhouse", board: "backblaze", company: "Backblaze" },
  { portal: "greenhouse", board: "beamtherapeutics", company: "Beam Therapeutics" },
  { portal: "greenhouse", board: "betterhelp", company: "BetterHelp" },
  { portal: "greenhouse", board: "betterment", company: "Betterment" },
  { portal: "greenhouse", board: "bigid", company: "BigID" },
  { portal: "greenhouse", board: "billcom", company: "Bill.com" },
  { portal: "greenhouse", board: "bitgo", company: "BitGo" },
  { portal: "greenhouse", board: "bitpanda", company: "Bitpanda" },
  { portal: "greenhouse", board: "bitwarden", company: "Bitwarden" },
  { portal: "greenhouse", board: "blend", company: "Blend" },
  { portal: "greenhouse", board: "bloomreach", company: "Bloomreach" },
  { portal: "greenhouse", board: "braze", company: "Braze" },
  { portal: "greenhouse", board: "bringg", company: "Bringg" },
  { portal: "greenhouse", board: "bybit", company: "Bybit" },
  { portal: "greenhouse", board: "calicolabs", company: "Calico Labs" },
  { portal: "greenhouse", board: "calm", company: "Calm" },
  { portal: "greenhouse", board: "cameo", company: "Cameo" },
  { portal: "greenhouse", board: "carta", company: "Carta" },
  { portal: "greenhouse", board: "catonetworks", company: "Cato Networks" },
  { portal: "greenhouse", board: "celigo", company: "Celigo" },
  { portal: "greenhouse", board: "censys", company: "Censys" },
  { portal: "greenhouse", board: "chainguard", company: "Chainguard" },
  { portal: "greenhouse", board: "checkr", company: "Checkr" },
  { portal: "greenhouse", board: "circleci", company: "CircleCI" },
  { portal: "greenhouse", board: "classpass", company: "ClassPass" },
  { portal: "greenhouse", board: "cleo", company: "Cleo" },
  { portal: "greenhouse", board: "cognism", company: "Cognism" },
  { portal: "greenhouse", board: "complyadvantage", company: "ComplyAdvantage" },
  { portal: "greenhouse", board: "consensys", company: "Consensys" },
  { portal: "greenhouse", board: "contentful", company: "Contentful" },
  { portal: "greenhouse", board: "coreweave", company: "CoreWeave" },
  { portal: "greenhouse", board: "coursera", company: "Coursera" },
  { portal: "greenhouse", board: "cribl", company: "Cribl" },
  { portal: "greenhouse", board: "cultureamp", company: "Culture Amp" },
  { portal: "greenhouse", board: "current", company: "Current" },
  { portal: "greenhouse", board: "customerio", company: "Customer.io" },
  { portal: "greenhouse", board: "datadog", company: "Datadog" },
  { portal: "greenhouse", board: "descope", company: "Descope" },
  { portal: "greenhouse", board: "dominodatalab", company: "Domino Data Lab" },
  { portal: "greenhouse", board: "doordashusa", company: "DoorDash" },
  { portal: "greenhouse", board: "doximity", company: "Doximity" },
  { portal: "greenhouse", board: "earnin", company: "Earnin" },
  { portal: "greenhouse", board: "epicgames", company: "Epic Games" },
  { portal: "greenhouse", board: "everlaw", company: "Everlaw" },
  { portal: "greenhouse", board: "faire", company: "Faire" },
  { portal: "greenhouse", board: "feedzai", company: "Feedzai" },
  { portal: "greenhouse", board: "figure", company: "Figure Technologies" },
  { portal: "greenhouse", board: "filecoinfoundation", company: "Filecoin Foundation" },
  { portal: "greenhouse", board: "fireblocks", company: "Fireblocks" },
  { portal: "greenhouse", board: "flatironhealth", company: "Flatiron Health" },
  { portal: "greenhouse", board: "flexe", company: "Flexe" },
  { portal: "greenhouse", board: "flexport", company: "Flexport" },
  { portal: "greenhouse", board: "forter", company: "Forter" },
  { portal: "greenhouse", board: "fourkites", company: "FourKites" },
  { portal: "greenhouse", board: "freenome", company: "Freenome" },
  { portal: "greenhouse", board: "future", company: "Future Fit" },
  { portal: "greenhouse", board: "gemini", company: "Gemini" },
  { portal: "greenhouse", board: "ginkgobioworks", company: "Ginkgo Bioworks" },
  { portal: "greenhouse", board: "gitlab", company: "GitLab" },
  { portal: "greenhouse", board: "gleanwork", company: "Glean" },
  { portal: "greenhouse", board: "globalizationpartners", company: "Globalization Partners" },
  { portal: "greenhouse", board: "gocardless", company: "GoCardless" },
  { portal: "greenhouse", board: "goguardian", company: "GoGuardian" },
  { portal: "greenhouse", board: "gomotive", company: "Motive" },
  { portal: "greenhouse", board: "grafanalabs", company: "Grafana Labs" },
  { portal: "greenhouse", board: "greenhouse", company: "Greenhouse Software" },
  { portal: "greenhouse", board: "gympass", company: "Gympass" },
  { portal: "greenhouse", board: "hackerrank", company: "HackerRank" },
  { portal: "greenhouse", board: "hellofresh", company: "HelloFresh" },
  { portal: "greenhouse", board: "highnote", company: "Highnote" },
  { portal: "greenhouse", board: "homechef", company: "Home Chef" },
  { portal: "greenhouse", board: "homelight", company: "Homelight" },
  { portal: "greenhouse", board: "homeward", company: "Homeward" },
  { portal: "greenhouse", board: "honeycomb", company: "Honeycomb" },
  { portal: "greenhouse", board: "humaninterest", company: "Human Interest" },
  { portal: "greenhouse", board: "huntress", company: "Huntress" },
  { portal: "greenhouse", board: "imbue", company: "Imbue" },
  { portal: "greenhouse", board: "imply", company: "Imply" },
  { portal: "greenhouse", board: "inflectionai", company: "Inflection AI" },
  { portal: "greenhouse", board: "instawork", company: "Instawork" },
  { portal: "greenhouse", board: "invisibletech", company: "Invisible Technologies" },
  { portal: "greenhouse", board: "ixllearning", company: "IXL Learning" },
  { portal: "greenhouse", board: "janestreet", company: "Jane Street" },
  { portal: "greenhouse", board: "jfrog", company: "JFrog" },
  { portal: "greenhouse", board: "justworks", company: "Justworks" },
  { portal: "greenhouse", board: "karat", company: "Karat" },
  { portal: "greenhouse", board: "kasa", company: "Kasa Living" },
  { portal: "greenhouse", board: "khanacademy", company: "Khan Academy" },
  { portal: "greenhouse", board: "kickstarter", company: "Kickstarter" },
  { portal: "greenhouse", board: "knock", company: "Knock" },
  { portal: "greenhouse", board: "knowbe4", company: "KnowBe" },
  { portal: "greenhouse", board: "labelbox", company: "Labelbox" },
  { portal: "greenhouse", board: "launchdarkly", company: "LaunchDarkly" },
  { portal: "greenhouse", board: "lithic", company: "Lithic" },
  { portal: "greenhouse", board: "luno", company: "Luno" },
  { portal: "greenhouse", board: "masterclass", company: "MasterClass" },
  { portal: "greenhouse", board: "mavenclinic", company: "Maven Clinic" },
  { portal: "greenhouse", board: "mercury", company: "Mercury" },
  { portal: "greenhouse", board: "mindbody", company: "Mindbody" },
  { portal: "greenhouse", board: "minio", company: "MinIO" },
  { portal: "greenhouse", board: "misfitsmarket", company: "Misfits Market" },
  { portal: "greenhouse", board: "mixpanel", company: "Mixpanel" },
  { portal: "greenhouse", board: "modernhealth", company: "Modern Health" },
  { portal: "greenhouse", board: "monzo", company: "Monzo" },
  { portal: "greenhouse", board: "movableink", company: "Movable Ink" },
  { portal: "greenhouse", board: "mozilla", company: "Mozilla" },
  { portal: "greenhouse", board: "myfitnesspal", company: "MyFitnessPal" },
  { portal: "greenhouse", board: "n26", company: "N" },
  { portal: "greenhouse", board: "narvar", company: "Narvar" },
  { portal: "greenhouse", board: "natera", company: "Natera" },
  { portal: "greenhouse", board: "netlify", company: "Netlify" },
  { portal: "greenhouse", board: "netskope", company: "Netskope" },
  { portal: "greenhouse", board: "newsela", company: "Newsela" },
  { portal: "greenhouse", board: "nextdoor", company: "Nextdoor" },
  { portal: "greenhouse", board: "novacredit", company: "Nova Credit" },
  { portal: "greenhouse", board: "nuro", company: "Nuro" },
  { portal: "greenhouse", board: "observeai", company: "Observe.AI" },
  { portal: "greenhouse", board: "offerup", company: "OfferUp" },
  { portal: "greenhouse", board: "okta", company: "Okta" },
  { portal: "greenhouse", board: "okx", company: "OKX" },
  { portal: "greenhouse", board: "omadahealth", company: "Omada Health" },
  { portal: "greenhouse", board: "onemedical", company: "One Medical" },
  { portal: "greenhouse", board: "onetrust", company: "OneTrust" },
  { portal: "greenhouse", board: "orcasecurity", company: "Orca Security" },
  { portal: "greenhouse", board: "orchard", company: "Orchard" },
  { portal: "greenhouse", board: "osano", company: "Osano" },
  { portal: "greenhouse", board: "otterai", company: "Otter.ai" },
  { portal: "greenhouse", board: "oura", company: "Oura" },
  { portal: "greenhouse", board: "parsleyhealth", company: "Parsley Health" },
  { portal: "greenhouse", board: "peloton", company: "Peloton" },
  { portal: "greenhouse", board: "pendo", company: "Pendo" },
  { portal: "greenhouse", board: "polyai", company: "PolyAI" },
  { portal: "greenhouse", board: "prismatic", company: "Prismatic" },
  { portal: "greenhouse", board: "project44", company: "project" },
  { portal: "greenhouse", board: "proton", company: "Proton" },
  { portal: "greenhouse", board: "public", company: "Public.com" },
  { portal: "greenhouse", board: "qualtrics", company: "Qualtrics" },
  { portal: "greenhouse", board: "quillbot", company: "QuillBot" },
  { portal: "greenhouse", board: "recordedfuture", company: "Recorded Future" },
  { portal: "greenhouse", board: "recursionpharmaceuticals", company: "Recursion Pharmaceuticals" },
  { portal: "greenhouse", board: "redwoodmaterials", company: "Redwood Materials" },
  { portal: "greenhouse", board: "relativity", company: "Relativity" },
  { portal: "greenhouse", board: "remote", company: "Remote" },
  { portal: "greenhouse", board: "riotgames", company: "Riot Games" },
  { portal: "greenhouse", board: "riskified", company: "Riskified" },
  { portal: "greenhouse", board: "roblox", company: "Roblox" },
  { portal: "greenhouse", board: "rocketlab", company: "Rocket Lab" },
  { portal: "greenhouse", board: "rubrik", company: "Rubrik" },
  { portal: "greenhouse", board: "sambanovasystems", company: "SambaNova Systems" },
  { portal: "greenhouse", board: "samsara", company: "Samsara" },
  { portal: "greenhouse", board: "scaleai", company: "Scale AI" },
  { portal: "greenhouse", board: "scopely", company: "Scopely" },
  { portal: "greenhouse", board: "seekout", company: "SeekOut" },
  { portal: "greenhouse", board: "sezzle", company: "Sezzle" },
  { portal: "greenhouse", board: "smartsheet", company: "Smartsheet" },
  { portal: "greenhouse", board: "snorkelai", company: "Snorkel AI" },
  { portal: "greenhouse", board: "speechmatics", company: "Speechmatics" },
  { portal: "greenhouse", board: "springboard", company: "Springboard" },
  { portal: "greenhouse", board: "stabilityai", company: "Stability AI" },
  { portal: "greenhouse", board: "starburst", company: "Starburst" },
  { portal: "greenhouse", board: "stitchfix", company: "StitchFix" },
  { portal: "greenhouse", board: "stockx", company: "StockX" },
  { portal: "greenhouse", board: "sumologic", company: "Sumo Logic" },
  { portal: "greenhouse", board: "swordhealth", company: "Sword Health" },
  { portal: "greenhouse", board: "tailscale", company: "Tailscale" },
  { portal: "greenhouse", board: "talkspace", company: "Talkspace" },
  { portal: "greenhouse", board: "taskrabbit", company: "TaskRabbit" },
  { portal: "greenhouse", board: "tempo", company: "Tempo Fit" },
  { portal: "greenhouse", board: "textio", company: "Textio" },
  { portal: "greenhouse", board: "thrivemarket", company: "Thrive Market" },
  { portal: "greenhouse", board: "toast", company: "Toast" },
  { portal: "greenhouse", board: "togetherai", company: "Together AI" },
  { portal: "greenhouse", board: "traderepublicbank", company: "Trade Republic" },
  { portal: "greenhouse", board: "tripactions", company: "TripActions" },
  { portal: "greenhouse", board: "truelayer", company: "TrueLayer" },
  { portal: "greenhouse", board: "truveta", company: "Truveta" },
  { portal: "greenhouse", board: "twitch", company: "Twitch" },
  { portal: "greenhouse", board: "udacity", company: "Udacity" },
  { portal: "greenhouse", board: "udemy", company: "Udemy" },
  { portal: "greenhouse", board: "upwork", company: "Upwork" },
  { portal: "greenhouse", board: "vardaspace", company: "Varda Space" },
  { portal: "greenhouse", board: "vectara", company: "Vectara" },
  { portal: "greenhouse", board: "vercel", company: "Vercel" },
  { portal: "greenhouse", board: "verkada", company: "Verkada" },
  { portal: "greenhouse", board: "vestwell", company: "Vestwell" },
  { portal: "greenhouse", board: "wasabi", company: "Wasabi Technologies" },
  { portal: "greenhouse", board: "weee", company: "Weee!" },
  { portal: "greenhouse", board: "wikimedia", company: "Wikimedia Foundation" },
  { portal: "greenhouse", board: "wizinc", company: "Wiz" },
  { portal: "greenhouse", board: "workato", company: "Workato" },
  { portal: "greenhouse", board: "wrike", company: "Wrike" },
  { portal: "greenhouse", board: "ziprecruiter", company: "ZipRecruiter" },
  { portal: "greenhouse", board: "zoominfo", company: "ZoomInfo" },
  { portal: "lever", board: "aircall", company: "Aircall" },
  { portal: "lever", board: "brightedge", company: "BrightEdge" },
  { portal: "lever", board: "outreach", company: "Outreach" },
  { portal: "lever", board: "palantir", company: "Palantir" },
  { portal: "lever", board: "ro", company: "Ro" },
  { portal: "lever", board: "tala", company: "Tala" },
  { portal: "lever", board: "veeva", company: "Veeva Systems" },
  { portal: "lever", board: "wattpad", company: "Wattpad" },
  { portal: "lever", board: "zoox", company: "Zoox" },
  { portal: "ashby", board: "abridge", company: "Abridge" },
  { portal: "ashby", board: "anrok", company: "Anrok" },
  { portal: "ashby", board: "attio", company: "Attio" },
  { portal: "ashby", board: "aurorasolar", company: "Aurora Solar" },
  { portal: "ashby", board: "baseten", company: "Baseten" },
  { portal: "ashby", board: "bland", company: "Bland" },
  { portal: "ashby", board: "braintrust", company: "Braintrust" },
  { portal: "ashby", board: "cedar", company: "Cedar" },
  { portal: "ashby", board: "character", company: "Character AI" },
  { portal: "ashby", board: "column", company: "Column" },
  { portal: "ashby", board: "crusoe", company: "Crusoe" },
  { portal: "ashby", board: "cursor", company: "Cursor (Anysphere)" },
  { portal: "ashby", board: "decagon", company: "Decagon" },
  { portal: "ashby", board: "drata", company: "Drata" },
  { portal: "ashby", board: "eightsleep", company: "Eight Sleep" },
  { portal: "ashby", board: "endgame", company: "Endgame" },
  { portal: "ashby", board: "gamma", company: "Gamma" },
  { portal: "ashby", board: "griffin", company: "Griffin" },
  { portal: "ashby", board: "headway", company: "Headway" },
  { portal: "ashby", board: "krea", company: "Krea AI" },
  { portal: "ashby", board: "langchain", company: "LangChain" },
  { portal: "ashby", board: "levels", company: "Levels" },
  { portal: "ashby", board: "linear", company: "Linear" },
  { portal: "ashby", board: "lovable", company: "Lovable" },
  { portal: "ashby", board: "mercor", company: "Mercor" },
  { portal: "ashby", board: "merge", company: "Merge" },
  { portal: "ashby", board: "middesk", company: "Middesk" },
  { portal: "ashby", board: "modal", company: "Modal" },
  { portal: "ashby", board: "moderntreasury", company: "Modern Treasury" },
  { portal: "ashby", board: "nango", company: "Nango" },
  { portal: "ashby", board: "notion", company: "Notion" },
  { portal: "ashby", board: "orb", company: "Orb" },
  { portal: "ashby", board: "persona", company: "Persona" },
  { portal: "ashby", board: "pinecone", company: "Pinecone" },
  { portal: "ashby", board: "poolside", company: "Poolside" },
  { portal: "ashby", board: "posthog", company: "PostHog" },
  { portal: "ashby", board: "preply", company: "Preply" },
  { portal: "ashby", board: "ramp", company: "Ramp" },
  { portal: "ashby", board: "reflectionai", company: "Reflection AI" },
  { portal: "ashby", board: "replit", company: "Replit" },
  { portal: "ashby", board: "resend", company: "Resend" },
  { portal: "ashby", board: "rho", company: "Rho" },
  { portal: "ashby", board: "rilla", company: "Rilla" },
  { portal: "ashby", board: "rula", company: "Rula" },
  { portal: "ashby", board: "runpod", company: "Runpod" },
  { portal: "ashby", board: "sardine", company: "Sardine" },
  { portal: "ashby", board: "saronic", company: "Saronic" },
  { portal: "ashby", board: "secureframe", company: "Secureframe" },
  { portal: "ashby", board: "sierra", company: "Sierra" },
  { portal: "ashby", board: "skydio", company: "Skydio" },
  { portal: "ashby", board: "snowflake", company: "Snowflake" },
  { portal: "ashby", board: "speak", company: "Speak" },
  { portal: "ashby", board: "substack", company: "Substack" },
  { portal: "ashby", board: "superpower", company: "Superpower" },
  { portal: "ashby", board: "triggerdev", company: "Trigger.dev" },
  { portal: "ashby", board: "unit", company: "Unit" },
  { portal: "ashby", board: "vanta", company: "Vanta" },
  { portal: "ashby", board: "warp", company: "Warp" },
  { portal: "ashby", board: "watershed", company: "Watershed" },
  { portal: "ashby", board: "weaviate", company: "Weaviate" },
  { portal: "ashby", board: "whoop", company: "Whoop" },
  { portal: "ashby", board: "zapier", company: "Zapier" },
  { portal: "ashby", board: "zilch", company: "Zilch" },
  { portal: "workday", board: "nvidia", company: "NVIDIA", snapshotOnly: true },
  { portal: "workday", board: "intel", company: "Intel", snapshotOnly: true },
  { portal: "workday", board: "salesforce", company: "Salesforce", snapshotOnly: true },
  { portal: "workday", board: "adobe", company: "Adobe", snapshotOnly: true },
  { portal: "workday", board: "accenture", company: "Accenture", snapshotOnly: true },
  { portal: "workday", board: "redhat", company: "Red Hat", snapshotOnly: true },
  { portal: "workday", board: "target", company: "Target", snapshotOnly: true },
  { portal: "workday", board: "paypal", company: "PayPal", snapshotOnly: true },
  { portal: "workday", board: "autodesk", company: "Autodesk", snapshotOnly: true },
  { portal: "workday", board: "vanguard", company: "Vanguard", snapshotOnly: true },
  { portal: "workday", board: "cvshealth", company: "CVS Health", snapshotOnly: true },
  { portal: "workday", board: "proofpoint", company: "Proofpoint", snapshotOnly: true },
  { portal: "workday", board: "browserstack", company: "BrowserStack", snapshotOnly: true },
  { portal: "workday", board: "sprinklr", company: "Sprinklr", snapshotOnly: true },
  { portal: "workday", board: "workday", company: "Workday Inc", snapshotOnly: true },
  { portal: "smartrecruiters", board: "BoschGroup", company: "Bosch Group" },
  { portal: "smartrecruiters", board: "Equinox", company: "Equinox" },
  { portal: "smartrecruiters", board: "TheWonderfulCompany", company: "The Wonderful Company" },
  { portal: "smartrecruiters", board: "Version1", company: "Version 1" },
  { portal: "smartrecruiters", board: "DeliveryHero", company: "Delivery Hero" },
  { portal: "greenhouse", board: "nextroll", company: "Nextroll" },
  { portal: "greenhouse", board: "cloudbeds", company: "Cloudbeds" },
  { portal: "greenhouse", board: "fleetio", company: "Fleetio" },
  { portal: "greenhouse", board: "axon", company: "Axon" },
  { portal: "greenhouse", board: "tubitv", company: "Tubitv" },
  { portal: "greenhouse", board: "eltropyinc", company: "Eltropyinc" },
  { portal: "greenhouse", board: "cognitiv", company: "Cognitiv" },
  { portal: "greenhouse", board: "shopmonkey", company: "Shopmonkey" },
  { portal: "greenhouse", board: "ezcaterinc", company: "Ezcaterinc" },
  { portal: "greenhouse", board: "trivelta", company: "Trivelta" },
  { portal: "greenhouse", board: "appdirect", company: "Appdirect" },
  { portal: "greenhouse", board: "hs", company: "Hs" },
  { portal: "greenhouse", board: "betterhelpcom", company: "Betterhelpcom" },
  { portal: "greenhouse", board: "starrez", company: "Starrez" },
  { portal: "greenhouse", board: "engine", company: "Engine" },
  { portal: "greenhouse", board: "headspacesourcing", company: "Headspacesourcing" },
  { portal: "greenhouse", board: "weedmaps77", company: "Weedmaps77" },
  { portal: "greenhouse", board: "patterndata", company: "Patterndata" },
  { portal: "ashby", board: "higharc", company: "Higharc" },
  { portal: "ashby", board: "mural", company: "Mural" },
  { portal: "ashby", board: "ironcladhq", company: "Ironcladhq" },
  { portal: "ashby", board: "wrapbook", company: "Wrapbook" },
  { portal: "ashby", board: "tabs", company: "Tabs" },
  { portal: "ashby", board: "vibe", company: "Vibe" },
  { portal: "ashby", board: "unicourt", company: "Unicourt" },
  { portal: "ashby", board: "meridianlink", company: "Meridianlink" },
  { portal: "ashby", board: "scan-com", company: "Scan Com" },
  { portal: "ashby", board: "virtuous", company: "Virtuous" },
  { portal: "lever", board: "agiloft", company: "Agiloft" },
  { portal: "lever", board: "gohighlevel", company: "Gohighlevel" },
  { portal: "lever", board: "rover", company: "Rover" },
  { portal: "lever", board: "redoxengine", company: "Redoxengine" },
  { portal: "recruitee", board: "helloprint", company: "Helloprint", snapshotOnly: true },
  { portal: "recruitee", board: "channable", company: "Channable", snapshotOnly: true },
  { portal: "recruitee", board: "trustedshops", company: "Trusted Shops", snapshotOnly: true },
  { portal: "recruitee", board: "bunq", company: "bunq", snapshotOnly: true },
  { portal: "recruitee", board: "cmcom", company: "CM.com", snapshotOnly: true },
  { portal: "personio", board: "personio", company: "Personio", snapshotOnly: true },
  { portal: "personio", board: "clark", company: "Clark", snapshotOnly: true },
  { portal: "rippling", board: "rippling", company: "Rippling", snapshotOnly: true },
  { portal: "rippling", board: "smokeballcareers", company: "Smokeball", snapshotOnly: true },
  { portal: "rippling", board: "celerdataopenroles", company: "CelerData", snapshotOnly: true },
  { portal: "rippling", board: "ias-careers", company: "IAS", snapshotOnly: true },
  ["remotive", "software-dev", "Remotive · remote"],
  ["remotive", "data", "Remotive · remote"],
  ["remoteok", "", "RemoteOK · startups"],
  ["hackernews", "", "Hacker News · YC startups"],
  ["wwr", "", "We Work Remotely"],
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
function saveLedger(entries) { safeSet(LEDGER_KEY, entries); }
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
    url: job.url, major: $("#major").value, visa: job.visa_verdict,
    timestamp: new Date().toISOString(), status: "applied" });
  saveLedger(entries);
}
/* Tsenta-style change review: show exactly what tailoring reworded. */
function diffBullets(base, tuned) {
  const out = [], n = Math.max(base.length, tuned.length);
  for (let k = 0; k < n; k++)
    if (base[k] !== tuned[k]) out.push({ before: base[k] || "", after: tuned[k] || "" });
  return out;
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
  if (portal === "remotive") return fetchRemotive(board, company);
  if (portal === "smartrecruiters") return fetchSmartRecruiters(board, company);
  if (portal === "remoteok") return fetchRemoteOK();
  if (portal === "hackernews") return fetchHNJobs();
  if (portal === "workday") return [];  /* no CORS on Workday CXS API: snapshot-only */
  if (portal === "wwr") return [];  /* RSS has no CORS: snapshot-only */
  if (portal === "recruitee") return [];  /* no CORS: snapshot-only */
  if (portal === "personio") return [];  /* snapshot-only for now */
  if (portal === "rippling") return [];  /* no CORS: snapshot-only */
  return fetchAshby(board, company);
}
async function fetchRemoteOK() {
  const r = await fetch("https://remoteok.com/api");
  if (!r.ok) throw new Error("HTTP " + r.status);
  const d = await r.json();
  return d.slice(1).map((j) => ({ portal: "remoteok", board: "", company: j.company || "",
    job_id: "remoteok-" + String(j.id), title: j.position || "",
    url: j.apply_url || j.url || "",
    location: (j.location || "") + " (remote)",
    posted_at: j.date || null,
    description: stripHtml(j.description || "") }));
}
async function fetchHNJobs() {
  const r = await fetch("https://hacker-news.firebaseio.com/v0/jobstories.json");
  if (!r.ok) throw new Error("HTTP " + r.status);
  const ids = (await r.json()).slice(0, 31);
  const items = await pool(ids, 8, async (id) => {
    const x = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
    return x.ok ? x.json() : null;
  });
  return items.filter((it) => it && it.title).map((it) => {
    const raw = it.title;
    const company = raw.split(/\s*\(YC|\s+is\s+hiring/i)[0].trim();
    let clean = raw.replace(/\s*\(YC[^)]*\)\s*/g, " ")
      .replace(new RegExp("^\\s*" + company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*", "i"), "")
      .replace(/is hiring\s*/gi, "").trim().replace(/^[-–—\s]+/, "");
    return { portal: "hackernews", board: "", company: company || "YC startup",
      job_id: "hn-" + String(it.id), title: clean || raw,
      url: it.url || `https://news.ycombinator.com/item?id=${it.id}`,
      location: "", posted_at: it.time ? new Date(it.time * 1000).toISOString() : null,
      description: "" };
  });
}
async function fetchSmartRecruiters(slug, company) {
  const r = await fetch(`https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100`);
  if (!r.ok) throw new Error("HTTP " + r.status);
  const d = await r.json();
  return (d.content || []).map((j) => {
    const loc = j.location || {};
    return { portal: "smartrecruiters", board: slug, company,
      job_id: String(j.id), title: j.name || "",
      url: `https://jobs.smartrecruiters.com/${slug}/${j.id}`,
      location: loc.fullLocation || [loc.city, loc.country].filter(Boolean).join(", "),
      posted_at: j.releasedDate || null,
      description: "" };
  });
}
async function fetchRemotive(category, label) {
  const r = await fetch(`https://remotive.com/api/remote-jobs?category=${category}&limit=100`);
  if (!r.ok) throw new Error("HTTP " + r.status);
  const d = await r.json();
  return (d.jobs || []).map((j) => ({ portal: "remotive", board: category, company: j.company_name || "",
    job_id: "remotive-" + String(j.id), title: j.title || "", url: j.url || "",
    location: (j.candidate_required_location || "") + " (remote)",
    description: stripHtml(j.description || "") }));
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

/* Collapse duplicate postings so each (company, title) appears once.
   Keep-best: direct ATS board beats aggregator, then has description. */
function dedupeJobs(jobs) {
  const rank = { greenhouse: 0, lever: 0, ashby: 0, smartrecruiters: 0, workday: 0, remoteok: 1, hackernews: 1, wwr: 1, remotive: 1 };
  const key = (j) => norm(j.company).replace(/\s+(inc|llc|corp|co|ltd)$/, "") + "|" + norm(j.title);
  const best = new Map();
  for (const j of jobs) {
    const k = key(j), cur = best.get(k);
    if (!cur) { best.set(k, j); continue; }
    if ((rank[j.portal] ?? 2) < (rank[cur.portal] ?? 2) ||
        (!cur.description && j.description)) best.set(k, j);
  }
  return [...best.values()];
}

/* ---------------- Resilient fetch: timeout + retries ---------------- */
async function fetchWithRetry(url, { timeout = 15000, tries = 3 } = {}) {
  let lastErr = null;
  for (let i = 0; i < tries; i++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeout);
    try {
      const r = await fetch(url, { signal: ctl.signal, cache: "no-store" });
      clearTimeout(t);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r;
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }
  throw lastErr;
}

function safeSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota/private mode */ }
}
function safeGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
  catch { return fallback; }
}

/* ---------------- Snapshot (auto-refreshed by GitHub Action) ---------------- */
let snapshotJobs = [], snapshotUpdatedAt = null;
const SEEN_KEY = "cc_seen_ids";
const PAGE_SIZE = 40;
let visibleCount = PAGE_SIZE;

function agoText(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return mins + " min ago";
  return Math.round(mins / 60) + " h ago";
}

function applyMajorFilter() {
  const major = $("#major").value;
  visibleCount = PAGE_SIZE;
  jobsCache = snapshotJobs
    .filter((j) => (j.majors || []).includes(major))
    .map((j) => ({ ...j, already_applied: isDuplicate(j.company, j.title, j.job_id) }));
  renderJobs(); renderStats(); renderDemand();
  if (snapshotUpdatedAt) {
    const ageH = (Date.now() - new Date(snapshotUpdatedAt).getTime()) / 36e5;
    $("#snapshot-info").textContent =
      `Snapshot updated ${agoText(snapshotUpdatedAt)} · refreshes every 30 min` +
      (ageH > 3 ? " · STALE — hit “Pull live now” for fresh data" : "");
  }
}

async function loadSnapshot(announce) {
  try {
    const r = await fetchWithRetry("jobs.json", { timeout: 20000, tries: 3 });
    const d = await r.json();
    if (!d.jobs || !Array.isArray(d.jobs)) throw new Error("bad snapshot");
    const prevIds = new Set(snapshotJobs.map((j) => j.portal + ":" + j.job_id));
    snapshotJobs = d.jobs; snapshotUpdatedAt = d.updated_at;
    const fresh = snapshotJobs.filter((j) => !prevIds.has(j.portal + ":" + j.job_id));
    applyMajorFilter();
    if (announce && prevIds.size && fresh.length)
      toast(`${fresh.length} new job${fresh.length > 1 ? "s" : ""} just posted`);
    // new since last visit
    const seen = safeGet(SEEN_KEY, []);
    const seenSet = new Set(seen);
    const unseen = snapshotJobs.filter((j) => !seenSet.has(j.portal + ":" + j.job_id)).length;
    if (unseen > 0 && seen.length)
      $("#pull-status").textContent = `${unseen} new since your last visit`;
    safeSet(SEEN_KEY, snapshotJobs.map((j) => j.portal + ":" + j.job_id));
  } catch {
    // Indestructible fallback: snapshot unreachable -> pull live from boards.
    $("#snapshot-info").textContent = "Snapshot unreachable — pulling live instead…";
    pullJobs();
  }
}

/* ---------------- Pull flow (live, on demand) ---------------- */
let jobsCache = [];

async function pullJobs() {
  const major = $("#major").value;
  localStorage.setItem("cc_major", major);
  const btn = $("#btn-pull"), st = $("#pull-status");
  btn.disabled = true;
  $("#snapshot-info").textContent = "Live pull in progress…";
  try {
    st.textContent = `Contacting ${BOARDS.length} boards…`;
    const settled = await Promise.allSettled(BOARDS.map(fetchBoard));
    let all = [], failed = 0;
    settled.forEach((s) => { if (s.status === "fulfilled") all.push(...s.value); else failed++; });
    st.textContent = `${all.length} postings scanned (${BOARDS.length - failed}/${BOARDS.length} boards ok) — filtering by ${major}…`;

    const matched = all.filter((j) => titleRelevant(j.title, major));
    const unique = dedupeJobs(matched);
    // Phase 2: fetch descriptions for greenhouse matches only
    const gh = unique.filter((j) => j._detail);
    await pool(gh, 8, async (j) => { j.description = await greenhouseDetail(j); });

    jobsCache = unique.map((j) => {
      const [verdict, reason] = visaScreen(j.description || "");
      return { ...j, visa_verdict: verdict, visa_reason: reason,
               already_applied: isDuplicate(j.company, j.title, j.job_id) };
    }).sort((a, b) => (b.already_applied - a.already_applied) ||
      (a.visa_verdict === "banned") - (b.visa_verdict === "banned"));
    visibleCount = PAGE_SIZE;
    renderJobs(); renderStats(failed);
    st.textContent = `${jobsCache.length} ${major} roles found (live)`;
    $("#snapshot-info").textContent = snapshotUpdatedAt
      ? `Snapshot updated ${agoText(snapshotUpdatedAt)} · refreshes every 30 min` : "";
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
function isFresh(j) {
  if (!j.posted_at) return false;
  const t = new Date(j.posted_at).getTime();
  return !isNaN(t) && Date.now() - t < 48 * 36e5;
}
function freshBadge(j) {
  return isFresh(j) ? `<span class="badge fresh">new</span>` : "";
}
/* Tsenta-style match explanation: show why this job matched the major. */
function matchReasons(j, major) {
  const t = norm(j.title + " " + (j.description || "").slice(0, 2000));
  return (MAJORS[major] || []).filter((k) => t.includes(k)).slice(0, 4);
}
function sortedJobs() {
  const arr = jobsCache.slice();
  if ($("#fresh-only") && $("#fresh-only").checked) {
    const fresh = arr.filter(isFresh);
    if (fresh.length) return sortArr(fresh);
    toast("No fresh (<48h) postings for this major — showing all");
  }
  return sortArr(arr);
}
function sortArr(arr) {
  const mode = $("#sort") && $("#sort").value;
  if (mode === "newest") {
    arr.sort((a, b) => (new Date(b.posted_at || 0).getTime() || 0) -
                       (new Date(a.posted_at || 0).getTime() || 0));
  } else if (mode === "priority") {
    arr.sort((a, b) => priorityScore(b) - priorityScore(a));
  }
  return arr;
}
/* Screening-call priority: fresh + visa-friendly + strong keyword match first.
   Banned postings sink to the bottom no matter what. */
function priorityScore(j) {
  if (j.visa_verdict === "banned") return -100;
  let s = 0;
  if (j.visa_verdict === "likely_sponsors") s += 2;
  const t = j.posted_at ? new Date(j.posted_at).getTime() : NaN;
  const ageH = isNaN(t) ? 1e9 : (Date.now() - t) / 36e5;
  if (ageH < 24) s += 3; else if (ageH < 48) s += 2; else if (ageH < 168) s += 1;
  s += matchReasons(j, $("#major").value).length * 0.5;
  if (!j.description) s -= 0.5;
  if (j.already_applied) s -= 50;
  return s;
}
function priorityTag(j) {
  const s = priorityScore(j);
  if (s >= 4) return `<span class="badge hot">apply first</span>`;
  if (s >= 2.5) return `<span class="badge warm">strong fit</span>`;
  return "";
}
/* Giraffy-style demand strip: where the matching roles cluster. */
function renderDemand() {
  const counts = {};
  jobsCache.forEach((j) => {
    let city = (j.location || "").split(",")[0].trim();
    if (!city || /remote|hybrid|multiple|various|united states|^usa$/i.test(city)) return;
    city = city.replace(/\s*\([^)]*\)/g, "").trim();
    if (city) counts[city] = (counts[city] || 0) + 1;
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  $("#demand").innerHTML = top.length
    ? `<span class="muted">Hiring hotspots:</span> ` + top.map(([c, n]) =>
      `<span class="hot">${esc(c)} <b>${n}</b></span>`).join(" ")
    : "";
}
function renderStats(failed) {
  const ok = jobsCache.filter((j) => j.visa_verdict !== "banned" && !j.already_applied).length;
  const banned = jobsCache.filter((j) => j.visa_verdict === "banned").length;
  const fresh = jobsCache.filter(isFresh).length;
  $("#stats").innerHTML = [
    [jobsCache.length, "matching roles"],
    [ok, "worth reviewing"],
    [fresh, "posted in last 48h"],
    [banned, "visa-banned (skipped)"],
  ].map(([n, l]) => `<div class="stat"><div class="num">${n}</div><div class="lbl">${l}</div></div>`).join("");
}
function renderJobs() {
  const box = $("#jobs-list");
  if (!jobsCache.length) { box.innerHTML = `<div class="empty">Loading the latest snapshot… if this persists, hit “Pull live now”.</div>`; return; }
  const major = $("#major").value;
  const ordered = sortedJobs();
  const shown = ordered.slice(0, visibleCount);
  box.innerHTML = shown.map((j) => {
    const i = jobsCache.indexOf(j);
    const reasons = matchReasons(j, major);
    return `
    <div class="job">
      <h3><a href="${esc(j.url)}" target="_blank" rel="noopener">${esc(j.title)}</a></h3>
      <div class="meta">${esc(j.company)} · ${esc(j.location)} · ${esc(j.portal)}</div>
      ${reasons.length ? `<div class="why">why this matches: ${reasons.map(esc).join(" · ")}</div>` : ""}
      <div class="badges">${visaBadge(j)}${freshBadge(j)}${priorityTag(j)}
        ${j.already_applied ? `<span class="badge dup">applied (30d)</span>` : ""}</div>
      <div class="actions">
        <button class="ghost" data-tailor="${i}" ${j.visa_verdict === "banned" || j.already_applied ? "disabled" : ""}>Tailor resume (PDF)</button>
        <button class="ghost" data-cover="${i}" ${j.visa_verdict === "banned" || j.already_applied ? "disabled" : ""}>Cover letter</button>
        <button class="ghost" data-prep="${i}">Screen prep</button>
        <button class="ghost" data-applied="${i}" ${j.already_applied ? "disabled" : ""}>Mark applied</button>
        <span class="tailor-result" id="tr-${i}"></span>
        <div class="prep-box hidden" id="prep-${i}"></div>
        <div class="prep-box hidden" id="cover-${i}"></div>
      </div>
    </div>`;
  }).join("") +
    (ordered.length > visibleCount
      ? `<div style="text-align:center;margin:18px 0"><button class="ghost" id="btn-more">Show more (${ordered.length - visibleCount} remaining)</button></div>`
      : "");
  const more = $("#btn-more");
  if (more) more.addEventListener("click", () => {
    visibleCount += PAGE_SIZE; renderJobs();
    window.scrollBy({ top: 300, behavior: "smooth" });
  });
  box.querySelectorAll("[data-tailor]").forEach((b) =>
    b.addEventListener("click", () => tailorJob(+b.dataset.tailor, b)));
  box.querySelectorAll("[data-cover]").forEach((b) =>
    b.addEventListener("click", () => toggleCover(+b.dataset.cover)));
  box.querySelectorAll("[data-prep]").forEach((b) =>
    b.addEventListener("click", () => togglePrep(+b.dataset.prep)));
  box.querySelectorAll("[data-applied]").forEach((b) =>
    b.addEventListener("click", () => {
      const j = jobsCache[+b.dataset.applied];
      markApplied(j); j.already_applied = true; renderJobs(); renderApps();
      toast(`Logged: ${j.title} at ${j.company}`);
    }));
}
/* ---------------- Screening-call kit ---------------- */
function buildCoverLetter(job) {
  const gap = keywordGap(job.description || "");
  const skills = gap.mentioned.slice(0, 5).join(", ") || "machine learning and software engineering";
  return `Dear ${job.company} hiring team,

I'm applying for the ${job.title} role. I recently finished my master's in Artificial Intelligence and spent the last year building LLM tooling: an open-source token-cost optimizer (46 passing tests, green CI) and an evaluation harness for structured extraction tested against 16+ models. I also contributed a fix upstream to the simonw/llm project.

What caught my eye about this role is the focus on ${skills}. That's exactly where I've been working — my projects deal with prompt engineering, model evaluation, and keeping inference costs down, which maps directly to what you're hiring for.

I'm on F-1 OPT and authorized to work in the US, and I will require H-1B sponsorship in the future.

I'd welcome the chance to talk about how I can contribute.

Best regards,
${RESUME.name}
${RESUME.contact}`;
}
function screeningPrep(job) {
  const gap = keywordGap(job.description || "");
  const tech = gap.mentioned.slice(0, 4);
  const qs = [
    ["Tell me about yourself.", "2-minute version: master's in AI, then built LLM tooling (TokenLens, ExtractEval), plus an open-source contribution. End with why this role."],
    [tech.length ? `Walk me through your experience with ${tech.join(", ")}.` : "Walk me through your most relevant project.",
      "Pick TokenLens or ExtractEval. Problem, what you built, measurable outcome (tests passing, models tested, cost saved)."],
    ["Why " + job.company + "?", "One specific thing about their product or tech. Never generic praise."],
    ["Are you authorized to work in the US? Do you need sponsorship?",
      "Yes, I'm on F-1 OPT and authorized to work. I will need H-1B sponsorship down the line. Say it plainly and early."],
    ["What are your salary expectations?",
      "Give a researched range for the role and city, not a single number. Fine to say you're flexible for the right fit."],
  ];
  if (gap.missing.length)
    qs.push([`This role mentions ${gap.missing.slice(0, 3).join(", ")} — how do you handle gaps?`,
      "Be honest about what's new, then bridge: related experience that transfers in weeks, not months."]);
  return qs;
}
function togglePrep(idx) {
  const box = $("#prep-" + idx), job = jobsCache[idx];
  if (!box.classList.contains("hidden")) { box.classList.add("hidden"); return; }
  box.innerHTML = `<b>Likely screen questions for this role:</b><ol>` +
    screeningPrep(job).map(([q, tip]) =>
      `<li>${esc(q)}<div class="tip">${esc(tip)}</div></li>`).join("") + `</ol>`;
  box.classList.remove("hidden");
}
function toggleCover(idx) {
  const box = $("#cover-" + idx), job = jobsCache[idx];
  if (!box.classList.contains("hidden")) { box.classList.add("hidden"); return; }
  const text = buildCoverLetter(job);
  box.innerHTML = `<b>Cover letter — edit before sending:</b>
    <textarea id="cover-text-${idx}" rows="14">${esc(text)}</textarea>
    <div class="actions"><button class="ghost" id="cover-copy-${idx}">Copy text</button>
    <button class="ghost" id="cover-dl-${idx}">Download .txt</button></div>`;
  box.classList.remove("hidden");
  $("#cover-copy-" + idx).addEventListener("click", () => {
    navigator.clipboard.writeText($("#cover-text-" + idx).value).then(() => toast("Cover letter copied"));
  });
  $("#cover-dl-" + idx).addEventListener("click", () => {
    const blob = new Blob([$("#cover-text-" + idx).value], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${job.company}_${job.title}`.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 50) + "_cover.txt";
    a.click(); URL.revokeObjectURL(a.href);
  });
}
function renderApps() {
  const box = $("#apps-list");
  const entries = loadLedger().slice().reverse();
  if (!entries.length) { box.innerHTML = `<div class="empty">Nothing logged yet.</div>`; return; }
  box.innerHTML = `<table class="log"><thead><tr><th>Date</th><th>Company</th><th>Title</th><th>Major</th><th>Visa</th><th>Status</th><th></th></tr></thead><tbody>` +
    entries.map((e, i) => {
      const idx = entries.length - 1 - i;
      const title = e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)}</a>` : esc(e.title);
      const act = e.status === "to apply"
        ? `<button class="ghost" data-done="${idx}">Mark applied</button> `
        : "";
      return `<tr><td>${esc((e.timestamp || "").slice(0, 10))}</td>
      <td>${esc(e.company)}</td><td>${title}</td>
      <td>${esc(e.major || "—")}</td><td>${esc(e.visa || "—")}</td>
      <td><span class="pill">${esc(e.status)}</span></td>
      <td>${act}<button class="ghost" data-rm="${idx}">Remove</button></td></tr>`;
    }).join("") + `</tbody></table>`;
  box.querySelectorAll("[data-rm]").forEach((b) =>
    b.addEventListener("click", () => {
      const entries = loadLedger(); entries.splice(+b.dataset.rm, 1);
      saveLedger(entries); renderApps(); renderJobs();
    }));
  box.querySelectorAll("[data-done]").forEach((b) =>
    b.addEventListener("click", () => {
      const entries = loadLedger(); const e = entries[+b.dataset.done];
      if (e) { e.status = "applied"; e.timestamp = new Date().toISOString(); }
      saveLedger(entries); renderApps(); renderJobs(); toast("Marked as applied");
    }));
}
/* Tsenta-style: paste any job URL to add it to your workflow. */
$("#btn-add-url").addEventListener("click", () => {
  const url = $("#manual-url").value.trim();
  if (!url) { toast("Paste a job URL first"); return; }
  const title = $("#manual-title").value.trim() || "Untitled role";
  const company = $("#manual-company").value.trim() || "Unknown company";
  const entries = loadLedger();
  entries.push({ company, title, job_id: "manual-" + Date.now(), url,
    major: $("#major").value, visa: "neutral",
    timestamp: new Date().toISOString(), status: "to apply", manual: true });
  saveLedger(entries);
  $("#manual-url").value = $("#manual-title").value = $("#manual-company").value = "";
  renderApps(); toast("Added to your workflow");
});

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
    const base = RESUME.projects.flatMap((p) => p.bullets);
    const changed = diffBullets(base, bullets);
    out.innerHTML += `PDF downloaded · ${used_llm ? "LLM-tailored" : "base resume (no key)"}` +
      (gap.missing.length ? ` · missing keywords: ${gap.missing.slice(0, 8).map(esc).join(", ")}` : "") +
      (changed.length
        ? `<details class="diff"><summary>${changed.length} bullet${changed.length > 1 ? "s" : ""} reworded — review changes</summary>` +
          changed.map((c) => `<div class="diff-row"><div class="was">− ${esc(c.before)}</div><div class="now">+ ${esc(c.after)}</div></div>`).join("") +
          `</details>`
        : ` · no wording changes`);
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

/* ---------------- Insights: when do roles get posted ---------------- */
const WD_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const M_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function datedJobs() {
  return snapshotJobs.filter((j) => {
    if (!j.posted_at) return false;
    return !isNaN(new Date(j.posted_at).getTime());
  });
}
function bars(pairs) {
  const max = Math.max(1, ...pairs.map((p) => p[1]));
  return pairs.map(([label, n]) => `
    <div class="brow"><span class="blabel">${esc(label)}</span>
    <div class="btrack"><div class="bfill" style="width:${(n / max * 100).toFixed(1)}%"></div></div>
    <span class="bnum">${n}</span></div>`).join("");
}
function initInsightFilters() {
  const years = [...new Set(datedJobs().map((j) => new Date(j.posted_at).getFullYear()))].sort((a, b) => b - a);
  $("#f-year").innerHTML = `<option value="all">All</option>` +
    years.map((y) => `<option value="${y}">${y}</option>`).join("");
  $("#f-month").innerHTML = `<option value="all">All</option>` +
    M_NAMES.map((m, i) => `<option value="${i}">${m}</option>`).join("");
  if (years.length) $("#f-year").value = String(years[0]);
}
function filteredDatedJobs() {
  const y = $("#f-year").value, m = $("#f-month").value, d = $("#f-date").value;
  return datedJobs().filter((j) => {
    const t = new Date(j.posted_at);
    if (y !== "all" && t.getFullYear() !== +y) return false;
    if (m !== "all" && t.getMonth() !== +m) return false;
    if (d) {
      const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
      if (iso !== d) return false;
    }
    return true;
  });
}
function renderInsights() {
  const body = $("#insights-body");
  if (!$("#f-year").options.length) initInsightFilters();
  const jobs = filteredDatedJobs();
  $("#insights-count").textContent = `${jobs.length} postings with known dates`;
  if (!jobs.length) { body.innerHTML = `<div class="empty">No dated postings for this filter.</div>`; return; }

  const byWd = Array(7).fill(0), byHr = Array(24).fill(0), byDay = {}, byCo = {};
  jobs.forEach((j) => {
    const t = new Date(j.posted_at);
    byWd[t.getDay()]++; byHr[t.getHours()]++;
    const dk = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    byDay[dk] = (byDay[dk] || 0) + 1;
    byCo[j.company] = (byCo[j.company] || 0) + 1;
  });
  const peakWd = byWd.indexOf(Math.max(...byWd));
  // Busiest 3-hour window (single-hour peaks are often midnight timestamp artifacts)
  let pkH = 0, pkN = -1;
  for (let h = 0; h < 24; h++) {
    const n = byHr[h] + byHr[(h + 1) % 24] + byHr[(h + 2) % 24];
    if (n > pkN) { pkN = n; pkH = h; }
  }
  const wdOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
  const days = Object.keys(byDay).sort().slice(-30); // last 30 days in view
  const topCo = Object.entries(byCo).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const hr12 = (h) => { const ap = h < 12 ? "am" : "pm", hh = h % 12 || 12; return `${hh}${ap}`; };

  body.innerHTML = `
    <div class="insight-callout">Peak posting time in this view: <b>${WD_NAMES[peakWd]}s, ${hr12(pkH)}–${hr12((pkH + 3) % 24)}</b> — check the site then to catch roles first.</div>
    <div class="insight-grid">
      <div class="insight-card"><h3>By day of week</h3>${bars(wdOrder.map((i) => [WD_NAMES[i], byWd[i]]))}</div>
      <div class="insight-card"><h3>By hour of day</h3>${bars(byHr.map((n, h) => [hr12(h), n]))}</div>
      <div class="insight-card"><h3>Postings per day (last 30)</h3>${bars(days.map((d) => [d.slice(5), byDay[d]]))}</div>
      <div class="insight-card"><h3>Most active companies</h3>${bars(topCo)}</div>
    </div>`;
}
["f-year", "f-month", "f-date"].forEach((id) =>
  document.addEventListener("change", (e) => { if (e.target.id === id) renderInsights(); }));
$("#f-clear").addEventListener("click", () => {
  const years = $("#f-year").options;
  $("#f-year").value = years.length > 1 ? years[1].value : "all";
  $("#f-month").value = "all"; $("#f-date").value = ""; renderInsights();
});
document.querySelectorAll(".tab").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    document.querySelectorAll(".panel").forEach((p) => p.classList.add("hidden"));
    $("#tab-" + b.dataset.tab).classList.remove("hidden");
    if (b.dataset.tab === "apps") renderApps();
    if (b.dataset.tab === "insights") renderInsights();
  }));

$("#btn-pull").addEventListener("click", pullJobs);
$("#major").addEventListener("change", (e) => {
  localStorage.setItem("cc_major", e.target.value);
  if (snapshotJobs.length) applyMajorFilter();
});
$("#sort").addEventListener("change", () => { visibleCount = PAGE_SIZE; renderJobs(); });
$("#fresh-only").addEventListener("change", () => { visibleCount = PAGE_SIZE; renderJobs(); });

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
  loadSnapshot(false);
  // Re-check the snapshot on the same cadence as the updater: new postings
  // surface on the site within ~30 min of going live on a company board.
  setInterval(() => loadSnapshot(true), 30 * 60 * 1000);
})();
