export const SITE_NAME = 'DevPocket'
export const SITE_ORIGIN = 'https://devpocket.in'

// One entry per route. `title` is what search engines show as the blue link,
// `description` is the grey snippet under it (~155 chars is the display cap).
// `blurb` is real copy rendered on the page — crawlers rank text, not widgets.
export const SEO = {
  '/': {
    title: 'DevPocket — Developer Tools That Stay In Your Browser',
    description:
      'Format JSON, decode JWTs, generate UUIDs, test regex and convert timestamps — free developer tools that run entirely client-side. No signup, no uploads, no tracking.',
    heading: 'Developer tools that stay in your browser',
    blurb:
      'DevPocket is a toolbox of everyday developer utilities that run entirely in your browser — JSON, JWTs, UUIDs, regex, timestamps and more. Nothing you paste is uploaded to a server, so you can safely work with production payloads, tokens and customer data.',
  },
  '/json-xml': {
    title: 'JSON & XML Formatter, Validator and Search — DevPocket',
    description:
      'Format, beautify, minify and validate JSON or XML online, then search keys, attributes and values by path. Runs locally in your browser — nothing is uploaded.',
    heading: 'JSON and XML formatter, validator and search',
    blurb:
      'Paste JSON or XML to pretty-print it with syntax highlighting, minify it back down, or validate it with the exact line and column of any syntax error. The search box walks the parsed document and returns every matching key, attribute, tag or value with its full path, so you can find a field buried deep in an API response without scrolling.',
    howItWorks: [
      'Paste or type JSON or XML into the input pane.',
      'DevPocket parses it immediately and shows the formatted, syntax-highlighted result — or the exact line and column of the first syntax error.',
      'Use Minify to collapse it to one line, or Search to walk the parsed document by key, attribute or value.',
      'Copy the result or export it as a file — nothing is sent anywhere in between.',
    ],
    useCases: [
      'Pretty-printing a minified API response before reading it',
      'Validating a config file before committing it',
      'Finding a value buried in a large XML/JSON payload without scrolling',
      'Minifying JSON before pasting it into a URL or config field',
    ],
    faq: [
      {
        q: 'Why does it show a line and column for errors instead of just "Invalid JSON"?',
        a: 'DevPocket runs the parser far enough to report exactly where it stopped, matching the position your editor’s cursor should move to. Most other formatters just report a boolean.',
      },
      {
        q: 'Does it handle JSON5 or JSONC (comments, trailing commas)?',
        a: 'No — it validates strict JSON per the spec. Comments or trailing commas will be reported as syntax errors.',
      },
      {
        q: 'Is there a file size limit?',
        a: 'No hard limit, but very large payloads (tens of MB) will be slower to parse and render in a browser tab than a dedicated CLI tool like jq.',
      },
      {
        q: 'What’s the difference between this and the JSON Validator tool?',
        a: 'This page also handles XML and includes a path-based search; the JSON Validator page adds a collapsible tree view and duplicate-key detection specifically for JSON.',
      },
    ],
    related: ['/jsonvalidator', '/convert', '/codegen', '/json-tree'],
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
    howItWorks: [
      'Paste text into the Base64 or URL section to encode or decode it, or into the Hash section to compute a digest.',
      'Base64 encoding and decoding correctly handles full Unicode via UTF-8, not just ASCII.',
      'Hashes (MD5, SHA-1, SHA-256, SHA-384, SHA-512) are computed with the browser’s native Web Crypto API where available.',
      'Copy any result — nothing you paste is sent anywhere.',
    ],
    useCases: [
      'Decoding a Base64-encoded JWT segment or Basic Auth header to read what’s inside',
      'URL-encoding a query parameter that contains spaces or special characters',
      'Generating a SHA-256 checksum to compare against a downloaded file’s published hash',
      'Quickly checking what a Base64 blob in a config file or log actually contains',
    ],
    faq: [
      {
        q: 'Is Base64 encryption?',
        a: 'No — it’s a reversible encoding, not encryption. Anyone can decode it back to the original text with no key required. Never use it to hide secrets.',
      },
      {
        q: 'Does it handle Unicode correctly?',
        a: 'Yes — text is UTF-8 encoded before Base64 conversion, so non-ASCII characters round-trip correctly, unlike a naive btoa() call.',
      },
      {
        q: 'Is MD5 or SHA-1 secure for passwords?',
        a: 'No — both are broken for password hashing and have known collision attacks. They’re included here for checksums and legacy compatibility, not for storing credentials; use a dedicated password-hashing algorithm (bcrypt, Argon2) server-side instead.',
      },
      {
        q: 'What’s the difference between "encode" and "encode component"?',
        a: 'Full URL encoding escapes characters unsafe anywhere in a URL; component encoding also escapes characters like & and = that are safe in a full URL but not inside a single query parameter value.',
      },
    ],
    related: ['/jwtvalidator', '/json-xml'],
  },
  '/jwtvalidator': {
    title: 'JWT Decoder & Validator — Check Token Expiry Online — DevPocket',
    description:
      'Decode a JSON Web Token and check its structure, algorithm and expiry. Runs entirely in your browser, so pasting a real token never sends it anywhere.',
    heading: 'JWT decoder and validator',
    blurb:
      'Paste a JSON Web Token to read its header and payload as formatted JSON, with iat, exp and nbf rendered as readable dates. It checks that the three segments decode correctly, flags an "alg" of none, and tells you whether the token has expired or is not yet valid. Decoding happens locally and the token is never transmitted, so a real production token is safe to paste. The signature is shown but not verified — doing that would mean pasting your signing key into a web page, which this tool deliberately does not ask for.',
    howItWorks: [
      'Paste a JWT (three dot-separated base64url segments).',
      'DevPocket decodes the header and payload locally and renders them as formatted JSON.',
      'Standard time claims (iat, exp, nbf) are converted to readable dates, and the token’s expiry status is checked against your device clock.',
      'The signature is shown as-is for reference — it is not verified, since that would require pasting your signing secret into a web page.',
    ],
    useCases: [
      'Checking why an API call is failing with a 401 by inspecting a token’s exp claim',
      'Reading the aud or iss claims to confirm a token was issued for the right service',
      'Debugging an auth integration without pasting a production token into a third-party site',
      'Confirming a refreshed token actually has a later exp than the one it replaced',
    ],
    faq: [
      {
        q: 'Does this verify the signature?',
        a: 'No. Decoding and verifying are different operations — verifying needs the signing secret or public key, which this tool deliberately never asks for. It only decodes and inspects the claims.',
      },
      {
        q: 'Is it safe to paste a real production token?',
        a: 'The token is decoded entirely in your browser and never transmitted — you can confirm this yourself in DevTools → Network. See the Privacy page for how to check.',
      },
      {
        q: 'What does "alg: none" mean and why is it flagged?',
        a: 'It’s a JWT that claims to need no signature at all, a known attack vector against poorly configured verifiers. DevPocket flags it so you notice, but still decodes the token so you can inspect it.',
      },
      {
        q: 'Why is the expiry check based on my device clock?',
        a: 'A JWT’s exp claim is a Unix timestamp — checking it just compares your local clock to that number. If your device clock is wrong, the check will be too.',
      },
    ],
    related: ['/timestamp', '/encode-decode', '/json-xml'],
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
    howItWorks: [
      'Paste a Unix timestamp (seconds or milliseconds) to see it converted to UTC, your local time, IST and SAST at once — or enter a date to go the other way.',
      'Live clocks below show the current time in all four zones, updating every second.',
      'The same page also includes a bulk UUID v4 generator and a live regex tester with match and capture-group highlighting.',
    ],
    useCases: [
      'Converting an epoch value from a log line or API response into a readable date',
      'Checking what a timestamp means in a teammate’s timezone before a release',
      'Testing a regex pattern against sample strings before dropping it into code',
      'Quickly generating a UUID while already on the page for something else',
    ],
    faq: [
      {
        q: 'Does it handle timestamps in seconds and milliseconds?',
        a: 'Yes — DevPocket detects which unit you likely mean based on magnitude, or you can set it explicitly.',
      },
      {
        q: 'Which timezones are shown?',
        a: 'Local (your device), UTC, IST (India) and SAST (South Africa) — chosen because they’re common in the distributed teams DevPocket was built for.',
      },
      {
        q: 'Does the regex tester support all JS regex flags?',
        a: 'It supports the standard g, i, m, s and u flags and highlights every match and capture group live as you type.',
      },
      {
        q: 'Why are timestamp, UUID and regex on one page instead of three?',
        a: 'They’re all quick, single-input utilities developers reach for in the same debugging session — keeping them together avoids a page reload between them.',
      },
    ],
    related: ['/jwtvalidator', '/cron', '/uuid'],
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
  '/jsonvalidator': {
    title: 'JSON Validator Online — Format, Tree View & Duplicate Keys — DevPocket',
    description:
      'Validate JSON online with exact error line/column, a live collapsible tree view, duplicate-key detection and search. Free, offline, like a lightweight JSON editor.',
    heading: 'JSON validator and editor',
    blurb:
      'Paste or upload JSON to validate it with the precise line and column of any syntax error, then switch between a formatted code view and a collapsible tree — the two views a full JSON editor gives you, without the upload. Object keys repeated within the same literal are flagged, since JSON.parse silently keeps only the last one. Sort keys, choose an indent width, search by key or value, and export the result as a file, all locally in your browser.',
  },
  '/json-sort-keys': {
    title: 'JSON Sort Keys Online — Alphabetise Object Keys — DevPocket',
    description:
      'Sort JSON object keys alphabetically at every nesting level, ascending or descending. Array order is preserved. Free, runs entirely in your browser.',
    heading: 'Sort JSON keys alphabetically',
    blurb:
      'Reorders every object key alphabetically, recursively, so two payloads with the same data but different key order become directly comparable in a diff. Array order is left alone, because in an array the order is the data.',
  },
  '/json-flatten': {
    title: 'JSON Flattener — Convert Nested JSON to Dot Notation — DevPocket',
    description:
      'Flatten nested JSON into single-level dot-notation keys like a.b[0].c. Useful for config files, feature flags and spreadsheet exports. Free and offline.',
    heading: 'Flatten nested JSON',
    blurb:
      'Collapses a nested document into one level of dot-notation keys, with array positions kept as [index]. Handy for turning a config tree into environment-variable style keys, or for diffing two deeply nested structures line by line.',
  },
  '/json-unflatten': {
    title: 'JSON Unflattener — Dot Notation Back to Nested JSON — DevPocket',
    description:
      'Rebuild nested JSON objects and arrays from flat dot-notation keys such as user.address.city. The exact inverse of flattening. Free, browser-based.',
    heading: 'Rebuild nested JSON from flat keys',
    blurb:
      'Takes flat keys like user.address.city or tags[0] and reconstructs the object and array structure they describe. It is the exact inverse of the flattener, so a flatten followed by an unflatten returns the original document.',
  },
  '/json-escape': {
    title: 'JSON Escape & Unescape Online — String Literal Tool — DevPocket',
    description:
      'Escape text into a JSON string literal, or unescape one back to readable text. Handles quotes, backslashes, newlines and unicode. Free and private.',
    heading: 'Escape and unescape JSON strings',
    blurb:
      'Turns raw text into the escaped form you can paste inside a JSON string — quotes, backslashes, newlines and control characters all handled — and reverses it when you need to read an escaped blob out of a log line.',
  },
  '/json-remove-nulls': {
    title: 'Remove Nulls from JSON Online — Free Cleaner — DevPocket',
    description:
      'Strip every null value and null array entry from a JSON document, at any nesting depth. Free, instant, and nothing you paste is ever uploaded.',
    heading: 'Remove null values from JSON',
    blurb:
      'Deletes keys whose value is null and drops null entries from arrays, recursively. Useful before sending a payload to an API that rejects explicit nulls, or when trimming a response down to the fields that actually carry data.',
  },
  '/json-remove-empty': {
    title: 'Remove Empty Values from JSON — Nulls, Blanks, [] and {} — DevPocket',
    description:
      'Strip nulls, empty strings, empty arrays and empty objects from JSON at every level. More aggressive than a null-only clean. Free and browser-based.',
    heading: 'Remove empty values from JSON',
    blurb:
      'Goes further than removing nulls: empty strings, empty arrays and empty objects are dropped too, and the cleanup runs bottom-up so a branch that becomes empty after its children are removed also disappears.',
  },
  '/json-merge': {
    title: 'JSON Merge Online — Deep Merge Two Documents — DevPocket',
    description:
      'Merge two JSON documents with a deep or shallow strategy. Nested objects combine recursively; the second document wins on conflicts. Free and private.',
    heading: 'Merge two JSON documents',
    blurb:
      'Combines a base document with an overriding one. Deep merge walks nested objects and merges them key by key; shallow merge only touches the top level. Arrays are replaced rather than concatenated, which matches how config overrides usually behave.',
  },
  '/json-tree': {
    title: 'JSON Tree Viewer Online — Explore Nested JSON — DevPocket',
    description:
      'View any JSON payload as a collapsible tree with typed, colour-coded values. Far easier than scrolling a large raw response. Free, no upload.',
    heading: 'Browse JSON as a tree',
    blurb:
      'Renders a payload as an expandable tree, with each branch showing how many children it holds and every leaf colour-coded by type. Collapse the parts you do not care about to find the one field you do.',
  },
  '/json-stats': {
    title: 'JSON Statistics — Node Count, Depth & Type Analysis — DevPocket',
    description:
      'Analyse a JSON payload: total nodes, maximum nesting depth, unique key count, size in bytes and a breakdown by type. Free and runs in your browser.',
    heading: 'Analyse a JSON payload',
    blurb:
      'Counts objects, arrays, strings, numbers, booleans and nulls, reports the deepest nesting level and the total number of distinct key names, and lists them. A quick way to size up an unfamiliar API response before writing code against it.',
  },
  '/jsonpath': {
    title: 'JSONPath Evaluator Online — Test $.path Expressions — DevPocket',
    description:
      'Run JSONPath expressions against a document and see the matches instantly. Supports dot paths, array indexes, wildcards and recursive descent. Free.',
    heading: 'Evaluate JSONPath expressions',
    blurb:
      'Test a JSONPath expression against a real document and see every match as you type. Supports dot notation, array indexes, [*] wildcards and .. recursive descent — enough for the lookups that come up when writing an extraction rule or a config selector.',
  },
  '/json-schema': {
    title: 'JSON Schema Generator — Infer a Schema from JSON — DevPocket',
    description:
      'Generate a draft 2020-12 JSON Schema from a sample payload, with types, required fields and detected date-time and email formats. Free and offline.',
    heading: 'Generate a JSON Schema from a sample',
    blurb:
      'Infers a draft 2020-12 schema from an example document: object properties with their types, required field lists, array item types, and format hints where a string looks like an ISO date-time or an email address. A starting point to refine rather than a finished contract.',
  },
  '/uuid': {
    title: 'UUID Generator & Nano ID Generator Online — Bulk — DevPocket',
    description:
      'Generate UUID v4 or Nano IDs in bulk, up to 100 at a time, with uppercase and hyphen options. Uses the browser crypto source. Free, no sign-up.',
    heading: 'Generate UUIDs and Nano IDs',
    blurb:
      'Produces UUID v4 identifiers via the browser’s crypto.randomUUID, or shorter URL-friendly Nano IDs at whatever length you need. Generate up to a hundred at once and copy them individually or as a block.',
    howItWorks: [
      'Choose UUID v4 or Nano ID and set how many you need (up to 100).',
      'DevPocket generates them using the browser’s crypto.getRandomValues source, not Math.random.',
      'Copy one at a time or copy the whole batch, then regenerate as needed.',
    ],
    useCases: [
      'Seeding test fixtures or mock database rows with unique IDs',
      'Generating a primary key or idempotency key while prototyping',
      'Creating short, URL-safe Nano IDs for slugs instead of full UUIDs',
      'Bulk-generating IDs for a CSV or seed script',
    ],
    faq: [
      {
        q: 'Are these cryptographically random?',
        a: 'Yes — both use the browser’s Web Crypto API (crypto.getRandomValues), the same source used for cryptographic key generation, not a pseudo-random Math.random() fallback.',
      },
      {
        q: 'What UUID version is generated?',
        a: 'Version 4 (random), the most common choice when you don’t need time-ordering or a namespace-derived ID.',
      },
      {
        q: 'What’s a Nano ID and why would I use it over a UUID?',
        a: 'A shorter, URL-friendly random ID (21 characters by default) — useful when a full 36-character UUID is overkill, e.g. in a URL slug.',
      },
      {
        q: 'Is there a collision risk?',
        a: 'Statistically negligible at any realistic scale — a UUID v4 has 122 random bits, and even generating billions of them keeps collision probability effectively zero.',
      },
    ],
    related: ['/timestamp', '/password', '/mock'],
  },
  '/password': {
    title: 'Password Generator — Strong Random Passwords Online — DevPocket',
    description:
      'Generate strong random passwords with configurable length and character sets, plus an entropy estimate. Uses browser crypto and never transmits them.',
    heading: 'Generate strong passwords',
    blurb:
      'Builds passwords from the character sets you choose using the browser’s cryptographic random source rather than Math.random, and reports the resulting entropy in bits so you can judge the strength rather than guess it. Look-alike characters can be excluded for passwords that get typed by hand. Nothing generated here is ever transmitted.',
  },
  '/lorem': {
    title: 'Lorem Ipsum Generator — Words, Sentences, Paragraphs — DevPocket',
    description:
      'Generate placeholder Lorem Ipsum text by word, sentence or paragraph count, with the classic opening line optional. Free and instant.',
    heading: 'Generate placeholder text',
    blurb:
      'Produces filler copy in whatever quantity a layout needs — a handful of words for a label, a few sentences for a card, or several paragraphs for an article mock-up — with the traditional "Lorem ipsum dolor sit amet" opening available as a toggle.',
  },
  '/privacy': {
    title: 'Privacy — How DevPocket Handles Your Data',
    description:
      'DevPocket runs entirely client-side: no backend, no analytics, no cookies, no error tracking. See exactly what is stored locally and how to verify it yourself in DevTools.',
    heading: 'How DevPocket actually handles your data',
    blurb:
      'A plain description of the architecture, not a marketing claim: what runs locally, what (if anything) leaves your browser, what is stored in localStorage, and how to check all of it yourself in the Network tab.',
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
