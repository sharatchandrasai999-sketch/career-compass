# Career Compass

A live job radar for AI, data, and software roles. It pulls real postings from company career boards and screens them for visa and sponsorship wording, so you can spot likely sponsors faster.

Live demo: https://sharatchandrasai999-sketch.github.io/career-compass/

No signup. No server. No tracking. The site runs in your browser.

## What it does

- Pulls postings from public company career boards, including Greenhouse, Lever, Ashby, SmartRecruiters, Workday, Remotive, RemoteOK, and Hacker News jobs.
- Filters by major: Artificial Intelligence, Data Science, Software Engineering, and Data Engineering.
- Filters out senior titles by default, such as senior, staff, principal, director, and manager roles.
- Sorts by best match, apply first, or newest first, and can show only fresh roles from the last 48 hours.
- Screens each posting for visa wording and labels it likely sponsors, neutral, or banned.
- Keeps a private application log in your browser only. Mark a role as applied and it stays out of future pulls for 30 days.
- Lets you add any job URL by hand to the same workflow.
- Shows when AI roles tend to get posted, based on publish dates in the snapshot.
- Builds a tailored resume PDF for a role. Without a key, it builds your base resume plus a keyword gap report. With a free Gemini key, it can rephrase bullets only. It never invents experience, and the key stays in your browser only.

## How the data works

There are two ways to get jobs.

1. Snapshot: a GitHub Action runs `fetch_jobs.py` and writes `jobs.json`. The site loads that snapshot first, so it opens fast.
2. Pull live now: the button in the site fetches the boards directly from your browser and merges the fresh results.

The workflow is scheduled every 30 minutes, but GitHub often delays scheduled runs. In practice the snapshot usually refreshes every few hours. Always check the "Snapshot updated" time shown on the site, not the schedule.

Some boards fail on some runs, and some postings have no publish date. That is normal. The site shows what it could fetch, not every job that exists.

## Visa screening, read this before you trust it

The screening is keyword matching on the posting text, not a promise from the employer.

- Likely sponsors: the text includes phrases like "will sponsor", "sponsorship available", "H-1B", or "OPT".
- Neutral: no visa wording was found.
- Banned: the text includes phrases like "no sponsorship", "without sponsorship", "cannot sponsor", "will not sponsor", or "US citizen only".

A likely sponsor label does not mean that company will sponsor you for that role. A neutral label does not mean it will not. Always read the full posting on the employer's site before you apply.

## Try it

Just open the live demo link above. No install is needed.

1. Pick a major.
2. Press Pull live now if you want fresh results.
3. Open a role to read it on the employer's board.
4. Mark it as applied when you apply, so it does not come back for 30 days.

To run it locally:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

To rebuild the snapshot yourself:

```bash
pip install requests
python fetch_jobs.py
```

That writes a new `jobs.json` in the repo root.

## Project layout

```
index.html          The site, tabs, and controls
app.js              Board fetching, filtering, visa screening, log, and resume tailoring
styles.css          Site styling
fetch_jobs.py       Snapshot builder used by the GitHub Action
jobs.json           Latest snapshot, updated by the Action
.github/workflows/update-jobs.yml   Scheduled snapshot workflow
```

Your application log and any Gemini key live only in your browser's local storage. Clearing your browser data clears them. Nothing about your applications is sent to a server by this site.

## Contributing

Issues are welcome. If a board breaks, a filter is wrong, or a visa label looks off, open an issue with the company, role title, and posting link.

Please do not post personal details, resumes, API keys, or private job links in issues.

## License

MIT. See LICENSE.
