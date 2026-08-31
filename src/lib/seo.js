export const SITE_NAME = 'DevPocket'
export const SITE_ORIGIN = 'https://devpocket.in'

// One entry per route. `title` is what search engines show as the blue link,
// `description` is the grey snippet under it (~155 chars is the display cap).
// `blurb` is real copy rendered on the page — crawlers rank text, not widgets.
export const SEO = {
  '/': {
    title: 'DevPocket — Free Developer Tools That Run In Your Browser',
    description:
      'Free developer tools: JSON & XML formatter, SQL beautifier, JWT decoder, cron builder, diff checker and mock data generator. No uploads, no sign-up.',
    heading: 'Free developer utilities',
    blurb:
      'DevPocket is a collection of 11 everyday developer tools that run entirely in your browser. Nothing you paste is uploaded to a server, so you can safely work with production payloads, tokens and customer data.',
  },
  '/json-xml': {
    title: 'JSON & XML Formatter, Validator and Search — DevPocket',
    description:
      'Format, beautify, minify and validate JSON or XML online, then search keys, attributes and values by path. Runs locally in your browser — nothing is uploaded.',
    heading: 'JSON and XML formatter, validator and search',
    blurb:
      'Paste JSON or XML to pretty-print it with syntax highlighting, minify it back down, or validate it with the exact line and column of any syntax error. The search box walks the parsed document and returns every matching key, attribute, tag or value with its full path, so you can find a field buried deep in an API response without scrolling.',
  },
  '/convert': {
    title: 'JSON to YAML to CSV Converter — Free & Online — DevPocket',
    description:
      'Convert JSON to YAML, YAML to JSON, JSON to CSV and back. Ideal for Kubernetes manifests, CI configs and data dumps. Free, browser-based, no upload.',
    heading: 'Convert between JSON, YAML and CSV',
    blurb:
      'Switch between the three formats backend and DevOps work runs on. Turn a JSON payload into a YAML config for Kubernetes or GitHub Actions, flatten an array of records into CSV for a spreadsheet, or parse a CSV export back into structured JSON.',
  },
  '/codegen': {
    title: 'JSON to Java (Lombok), TypeScript, Go, Python & C# Generator — DevPocket',
    description:
      'Paste a JSON response and generate typed models: Java POJOs with or without Lombok, TypeScript interfaces, Go structs, Python dataclasses or C# classes.',
    heading: 'Generate typed models from JSON',
    blurb:
      'Turn an API response into the model classes for your service layer. Java is generated two ways — with Lombok’s @Getter/@Setter and constructor annotations, or as a plain POJO with explicit getters and setters. Nested objects become their own types, arrays are typed by their first element, and ISO date strings become Instant. Where a JSON key does not match Java naming (snake_case, kebab-case), a @JsonProperty annotation is added so Jackson still binds it correctly.',
  },
  '/sql': {
    title: 'SQL Formatter & Beautifier — 11 Dialects — DevPocket',
    description:
      'Format and beautify SQL online for PostgreSQL, MySQL, T-SQL, Oracle, BigQuery, Snowflake, SQLite and more. Also minifies queries. Free and browser-based.',
    heading: 'SQL formatter and beautifier',
    blurb:
      'Make an unreadable one-line query legible, with dialect-aware formatting for PostgreSQL, MySQL, MariaDB, SQLite, BigQuery, Snowflake, Spark, Redshift, SQL Server and Oracle. Keyword casing is configurable, and the minifier strips comments and collapses whitespace without touching string literals.',
  },
  '/diff': {
    title: 'Text Diff Checker — Compare Two Files Online — DevPocket',
    description:
      'Compare two blocks of text or code line by line or word by word. Highlights additions and deletions with a change count. Free, private, runs in your browser.',
    heading: 'Text and code diff checker',
    blurb:
      'Paste two versions of a config file, API response or block of code to see exactly what changed. Line mode suits code and structured data; word mode catches small edits inside long paragraphs. Whitespace-only differences can be ignored.',
  },
  '/encode-decode': {
    title: 'Base64, URL Encoder / Decoder & Hash Generator (MD5, SHA) — DevPocket',
    description:
      'Encode and decode Base64 and URLs, and generate MD5, SHA-1, SHA-256, SHA-384 and SHA-512 hashes online. Full Unicode support, computed locally in your browser.',
    heading: 'Base64, URL encoding and hashing',
    blurb:
      'Base64 encode or decode any text with full Unicode support, switch between component and full-URI encoding, and generate MD5 and SHA-family digests. Hashes are computed with the browser’s native Web Crypto API, so the input never leaves your machine.',
  },
  '/jwtvalidator': {
    title: 'JWT Decoder & Validator — Check Token Expiry Online — DevPocket',
    description:
      'Decode a JSON Web Token and check its structure, algorithm and expiry. Runs entirely in your browser, so pasting a real token never sends it anywhere.',
    heading: 'JWT decoder and validator',
    blurb:
      'Paste a JSON Web Token to read its header and payload as formatted JSON, with iat, exp and nbf rendered as readable dates. It checks that the three segments decode correctly, flags an "alg" of none, and tells you whether the token has expired or is not yet valid. Decoding happens locally and the token is never transmitted, so a real production token is safe to paste. The signature is shown but not verified — doing that would mean pasting your signing key into a web page, which this tool deliberately does not ask for.',
  },
  '/color': {
    title: 'Colour Converter — HEX, RGB, HSL & px / rem / em — DevPocket',
    description:
      'Convert colours between HEX, RGB and HSL with a live picker, and convert CSS units between px, rem, em and pt using any root font size. Free and offline.',
    heading: 'Colour and CSS unit converter',
    blurb:
      'Pick a colour or paste a value and read it back in HEX, RGB and HSL, with every field editable so you can nudge a hue or lightness and see the others follow. The CSS unit converter turns pixels into rem, em and pt against whatever root font size your project uses — handy when translating a design handoff into stylesheet values.',
  },
  '/timestamp': {
    title: 'Unix Timestamp Converter (IST, SAST, UTC), UUID & Regex Tester — DevPocket',
    description:
      'Convert Unix timestamps to dates across India (IST), South Africa (SAST), UTC and local time. Plus a UUID v4 generator and live regex tester.',
    heading: 'Timestamps, UUIDs and regular expressions',
    blurb:
      'Convert a Unix timestamp in seconds or milliseconds into a readable date in every timezone at once — local, India (IST), South Africa (SAST) and UTC — or go the other way from a date to an epoch. Live clocks show the same instant across all four zones. Also generates UUID v4 identifiers in bulk and tests regular expressions with live match indexes and capture groups.',
  },
  '/cron': {
    title: 'Cron Expression Builder & Parser — Next Run Times — DevPocket',
    description:
      'Decode any cron expression into plain English and preview the next 8 run times in IST, SAST, UTC or local time. Includes common presets. Free and online.',
    heading: 'Cron expression builder and parser',
    blurb:
      'Paste a cron expression to see what it actually means in plain English, along with the next eight times it will fire. Each of the five fields is broken out with its valid range, and run times can be viewed in India (IST), South Africa (SAST), UTC or your local timezone. Presets cover the usual schedules, from every five minutes to weekdays at 9am.',
  },
  '/http': {
    title: 'HTTP Status Codes, Methods & Headers Reference — DevPocket',
    description:
      'Searchable reference for HTTP status codes (200, 301, 401, 404, 409, 422, 429, 500), request methods with safe and idempotent flags, and common headers.',
    heading: 'HTTP status code, method and header reference',
    blurb:
      'A searchable reference for the HTTP details worth checking rather than guessing: what 409 versus 422 actually mean, which methods are safe and idempotent, and what headers like Retry-After, ETag and Idempotency-Key are for. Grouped by class and filterable as you type.',
  },
  '/mock': {
    title: 'Mock Data Generator — JSON, CSV & SQL Inserts — DevPocket',
    description:
      'Generate realistic fake test data from 21 field types — names, emails, UUIDs, addresses, dates — and export as JSON, CSV or SQL INSERT statements. Free online.',
    heading: 'Mock and test data generator',
    blurb:
      'Build up to 500 realistic records from 21 field types including names, emails, phone numbers, addresses, prices, timestamps and IP addresses. Export as JSON to stub an API response, CSV to import into a spreadsheet, or ready-to-run SQL INSERT statements to seed a development database.',
  },
  '/about': {
    title: 'About DevPocket — Built by Sourabh Kumar',
    description:
      'DevPocket is a local-first developer toolbox built by Sourabh Kumar, a backend developer. No trackers, no ads, and nothing you paste leaves your browser.',
    heading: 'About DevPocket',
    blurb:
      'DevPocket was built to replace a pile of browser tabs pointed at ad-heavy formatter sites. Every tool runs as JavaScript in your own browser, so there is no server to send your data to in the first place.',
  },
}

export const ROUTES = Object.keys(SEO)

/** '/cron/' and '/cron' are the same route — GitHub Pages serves the former. */
export const normalizePath = (pathname) => {
  const p = (pathname || '/').replace(/\/+$/, '')
  return p === '' ? '/' : p
}

/** The URL that actually returns 200: subpages are served with a trailing slash. */
export const canonicalUrl = (pathname) => {
  const p = normalizePath(pathname)
  return SITE_ORIGIN + (p === '/' ? '/' : `${p}/`)
}

export const seoFor = (pathname) => SEO[normalizePath(pathname)] || SEO['/']
