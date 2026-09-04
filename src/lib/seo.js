export const SITE_NAME = 'DevPocket'
export const SITE_ORIGIN = 'https://devpocket.in'

// One entry per route. `title` is what search engines show as the blue link,
// `description` is the grey snippet under it (~155 chars is the display cap).
// `blurb` is real copy rendered on the page — crawlers rank text, not widgets.
export const SEO = {
  '/': {
    title: 'DevPocket — Developer Tools That Stay In Your Browser',
    description:
      'Format JSON, decode JWTs, generate UUIDs, test regex and convert timestamps — free developer tools that run in your browser. No signup, no uploads.',
    heading: 'Developer tools that stay in your browser',
    blurb:
      'DevPocket is a toolbox of everyday developer utilities that run entirely in your browser — JSON, JWTs, UUIDs, regex, timestamps and more. Nothing you paste is uploaded to a server, so you can safely work with production payloads, tokens and customer data.',
    howItWorks: [
      'Pick a tool from the menu, the search box (Cmd/Ctrl-K) or the grid on this page.',
      'Paste your input. Every tool processes it as you type — there is no Run button and no upload step.',
      'Copy the result, or export it as a file. Nothing you paste is sent to a server at any point.',
    ],
    useCases: [
      'Reading a minified API response during a production incident',
      'Checking what is inside a JWT without pasting it into a site that logs it',
      'Generating seed data, UUIDs or passwords while writing a migration',
      'Working out what a cron expression will actually do before shipping it',
    ],
    faq: [
      {
        q: 'Is anything I paste uploaded?',
        a: 'No. Every tool runs in JavaScript in your own tab. You can confirm it by opening DevTools, switching to the Network tab and using any tool — after the initial page load there are no further requests.',
      },
      {
        q: 'Does it work offline?',
        a: 'Once a page has loaded, yes — the tools need no network. Navigating to a tool you have not opened before will fetch its code chunk, so open it once while online if you want it available later.',
      },
      {
        q: 'Is there a sign-up, a paid tier or a usage limit?',
        a: 'None of the three. There is no account system, no payment, and no server to rate-limit you.',
      },
      {
        q: 'Is my data stored in the browser?',
        a: 'Only your theme choice, favourites, recently used tools and split-pane widths, in localStorage. Tool inputs are never persisted — reloading the page clears them.',
      },
    ],
    related: ['/json-xml', '/jwtvalidator', '/timestamp', '/uuid'],
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
    howItWorks: [
      'Choose the direction you want — JSON to YAML, YAML to JSON, JSON to CSV or CSV to JSON.',
      'Paste the source document on the left. It is parsed as you type and converted immediately.',
      'Errors report what failed to parse rather than silently producing empty output.',
      'Copy the converted result or download it as a file.',
    ],
    useCases: [
      'Turning a JSON payload into a YAML manifest for Kubernetes or GitHub Actions',
      'Converting a YAML config into JSON so a script can read it with a standard parser',
      'Flattening an array of records into CSV to open in Excel or Google Sheets',
      'Parsing a CSV export back into JSON to feed an API or a test fixture',
    ],
    faq: [
      {
        q: 'How are nested objects handled when converting to CSV?',
        a: 'CSV is a flat format, so nested values are serialised into the cell rather than invented as extra columns. If you want one column per leaf, run the payload through the JSON Flattener first and convert the flat result.',
      },
      {
        q: 'Does YAML output preserve comments?',
        a: 'No — comments are not part of the parsed data, so a JSON to YAML conversion cannot reproduce them. Converting YAML to JSON drops them for the same reason.',
      },
      {
        q: 'Which YAML version is supported?',
        a: 'YAML 1.2 via js-yaml, which covers anchors, multi-line scalars and the block styles used by Kubernetes, Docker Compose and CI configs.',
      },
    ],
    related: ['/json-xml', '/codegen', '/jsonvalidator', '/json-flatten'],
  },
  '/codegen': {
    title: 'JSON to Java, TypeScript & Go Generator — DevPocket',
    description:
      'Paste a JSON response and generate typed models: Java POJOs with or without Lombok, TypeScript interfaces, Go structs, Python dataclasses or C# classes.',
    heading: 'Generate typed models from JSON',
    blurb:
      'Turn an API response into the model classes for your service layer. Java is generated two ways — with Lombok’s @Getter/@Setter and constructor annotations, or as a plain POJO with explicit getters and setters. Nested objects become their own types, arrays are typed by their first element, and ISO date strings become Instant. Where a JSON key does not match Java naming (snake_case, kebab-case), a @JsonProperty annotation is added so Jackson still binds it correctly.',
    howItWorks: [
      'Paste a real API response — the more representative the sample, the better the generated types.',
      'Pick a target language. Java is the default and can be generated with Lombok annotations or as a plain POJO.',
      'Name the root class; nested objects are emitted as their own types named after their keys.',
      'Copy the generated models straight into your project.',
    ],
    useCases: [
      'Writing the DTO layer for a third-party API you are integrating against',
      'Turning a sample webhook payload into typed models before writing the handler',
      'Generating TypeScript interfaces from a backend response so the front end stops guessing',
      'Producing Go structs or Python dataclasses for a quick client library',
    ],
    faq: [
      {
        q: 'What is the difference between the Lombok and plain Java output?',
        a: 'The Lombok version annotates each class with @Getter, @Setter and constructor annotations and leaves the fields bare. The plain version writes explicit getters and setters, so it compiles in a project that does not have Lombok on the classpath.',
      },
      {
        q: 'How are arrays typed?',
        a: 'By their first element. An empty array cannot be typed from a sample, so it becomes a list of Object — replace it by hand once you know the element type.',
      },
      {
        q: 'What happens to keys that are not valid Java identifiers?',
        a: 'A key in snake_case or kebab-case is converted to camelCase and given a @JsonProperty annotation carrying the original name, so Jackson still binds it correctly.',
      },
      {
        q: 'Are date strings detected?',
        a: 'ISO 8601 date-time strings are mapped to Instant in Java and to the closest equivalent in the other languages. Other date formats come through as strings.',
      },
    ],
    related: ['/json-schema', '/json-xml', '/convert', '/mock'],
  },
  '/sql': {
    title: 'SQL Formatter & Beautifier — 11 Dialects — DevPocket',
    description:
      'Format and beautify SQL online for PostgreSQL, MySQL, T-SQL, Oracle, BigQuery, Snowflake, SQLite and more. Also minifies queries. Free and browser-based.',
    heading: 'SQL formatter and beautifier',
    blurb:
      'Make an unreadable one-line query legible, with dialect-aware formatting for PostgreSQL, MySQL, MariaDB, SQLite, BigQuery, Snowflake, Spark, Redshift, SQL Server and Oracle. Keyword casing is configurable, and the minifier strips comments and collapses whitespace without touching string literals.',
    howItWorks: [
      'Paste a query — a single statement or a whole script.',
      'Pick the dialect so that keywords, functions and quoting rules match your database.',
      'Choose keyword casing, then read the formatted query on the right.',
      'Or minify instead, to collapse a formatted query back to one line.',
    ],
    useCases: [
      'Making a one-line query pulled from an application log readable',
      'Formatting a generated query consistently before committing it to a migration',
      'Reading someone else’s deeply nested CTE without counting parentheses by hand',
      'Minifying a query to embed it in a config file or a shell command',
    ],
    faq: [
      {
        q: 'Which dialects are supported?',
        a: 'PostgreSQL, MySQL, MariaDB, SQLite, SQL Server (T-SQL), Oracle PL/SQL, BigQuery, Snowflake, Redshift, Spark SQL and a generic standard-SQL mode.',
      },
      {
        q: 'Will formatting change what my query does?',
        a: 'No. Formatting only alters whitespace, line breaks and keyword casing. String literals and quoted identifiers are left exactly as written.',
      },
      {
        q: 'Does the minifier remove comments?',
        a: 'Yes — it strips comments and collapses whitespace, while leaving whitespace inside string literals untouched.',
      },
    ],
    related: ['/diff', '/mock', '/json-xml', '/http'],
  },
  '/diff': {
    title: 'Text Diff Checker — Compare Two Files Online — DevPocket',
    description:
      'Compare two blocks of text or code line by line or word by word. Highlights additions and deletions with a change count. Free, private, runs in your browser.',
    heading: 'Text and code diff checker',
    blurb:
      'Paste two versions of a config file, API response or block of code to see exactly what changed. Line mode suits code and structured data; word mode catches small edits inside long paragraphs. Whitespace-only differences can be ignored.',
    howItWorks: [
      'Paste the original on the left and the changed version on the right.',
      'Pick line mode for code and structured data, or word mode to catch small edits inside prose.',
      'Additions and deletions are highlighted inline, with a count of what changed.',
      'Turn on the whitespace option to ignore indentation-only differences.',
    ],
    useCases: [
      'Comparing two API responses to find the one field that changed',
      'Checking what differs between a staging and a production config file',
      'Reviewing an edit to a block of text before pasting it back',
      'Spotting an accidental change in a generated file',
    ],
    faq: [
      {
        q: 'When should I use word mode instead of line mode?',
        a: 'Line mode is right for code, JSON and anything where a line is a meaningful unit. Word mode is better for paragraphs, where a one-word change would otherwise mark the entire line as rewritten.',
      },
      {
        q: 'Can I diff two JSON documents whose keys are in a different order?',
        a: 'Sort both with the JSON Sort Keys tool first. Once the key order matches, the remaining differences in the diff are the real ones.',
      },
      {
        q: 'Is there a size limit?',
        a: 'No hard limit, but diffing runs in your tab, so two very large files will be slower here than a native diff tool.',
      },
    ],
    related: ['/markdown', '/json-sort-keys', '/json-xml', '/sql'],
  },
  '/encode-decode': {
    title: 'Base64, URL & Hash Encoder / Decoder — DevPocket',
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
    title: 'JWT Decoder & Validator — Check Token Expiry',
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
    howItWorks: [
      'Pick a colour with the picker, or paste a HEX, RGB or HSL value.',
      'All three representations update together, and each field stays editable so you can nudge one and watch the others follow.',
      'For CSS units, enter a value and the root font size your project uses.',
      'Copy the representation you need.',
    ],
    useCases: [
      'Translating a HEX value from a design handoff into the HSL your stylesheet uses',
      'Adjusting lightness or saturation to derive a hover state from a base colour',
      'Converting a pixel spacing scale into rem against a 16px root',
      'Working out what an em value resolves to inside a nested component',
    ],
    faq: [
      {
        q: 'What is the difference between rem and em here?',
        a: 'rem is always relative to the root font size, so one conversion answers it. em is relative to the font size of the element itself, so the converter uses the context size you supply rather than the root.',
      },
      {
        q: 'Why convert to HSL at all?',
        a: 'HSL separates hue from saturation and lightness, so a hover or disabled variant is a change to one number instead of a new value guessed by eye.',
      },
      {
        q: 'Are alpha values supported?',
        a: 'The picker works with opaque colours. For a translucent variant, take the RGB values and add the alpha channel yourself as rgba() or an eight-digit HEX.',
      },
    ],
    related: ['/markdown', '/encode-decode', '/lorem', '/diff'],
  },
  '/markdown': {
    title: 'Markdown Preview — Live GitHub-Flavoured Editor',
    description:
      'Live Markdown preview with GitHub-flavoured tables, task lists, highlighted code and Mermaid diagrams. Copy the HTML or download a file. Nothing is uploaded.',
    heading: 'Markdown live preview',
    blurb:
      'Type or paste Markdown on the left and read it rendered on the right, as GitHub would show it — tables, task lists, footnoted links, blockquotes and fenced code with syntax highlighting. Fenced blocks tagged mermaid become real diagrams. Raw HTML in the source is shown as text rather than executed, so pasting a README you did not write cannot run anything in your browser.',
    howItWorks: [
      'Paste Markdown, or open a .md file from your machine — it is read locally and never uploaded.',
      'The preview updates as you type, with scrolling synced between the two panes.',
      'Switch to the HTML tab to read the generated markup instead of the rendered page.',
      'Copy the HTML, or download a self-contained .html file that carries its own styling.',
    ],
    useCases: [
      'Checking a README renders correctly before pushing it',
      'Drafting a pull request description or release notes with a table in it',
      'Turning meeting notes into an HTML file you can send to someone',
      'Sketching a flowchart or sequence diagram in Mermaid without opening a diagram tool',
    ],
    faq: [
      {
        q: 'Which Markdown flavour does it follow?',
        a: 'GitHub-flavoured Markdown: tables, task lists, strikethrough, autolinks and fenced code blocks on top of standard CommonMark.',
      },
      {
        q: 'What happens to HTML written inside the Markdown?',
        a: 'It is escaped and displayed as text rather than rendered. GitHub sanitises inline HTML instead; escaping is stricter, and it means a document from an untrusted source cannot run a script in your tab. If you need the HTML to render, download the file and open it yourself.',
      },
      {
        q: 'Do Mermaid diagrams cost anything to load?',
        a: 'Only if you use one. The diagram renderer is a large dependency, so it is fetched the first time a document actually contains a mermaid block — a document without one never downloads it.',
      },
      {
        q: 'Is the downloaded HTML self-contained?',
        a: 'Yes. Styles are inlined and it renders in light or dark mode, so the file works on its own with no stylesheet or network access. Mermaid diagrams are exported as inline SVG.',
      },
      {
        q: 'Is my document uploaded when I open a file?',
        a: 'No. The file is read in your browser with the File API, the same as pasting the text. Nothing leaves your machine at any point.',
      },
    ],
    related: ['/diff', '/json-xml', '/encode-decode', '/http'],
  },
  '/timestamp': {
    title: 'Unix Timestamp Converter — IST, SAST & UTC — DevPocket',
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
    title: 'Cron Expression Builder & Parser — DevPocket',
    description:
      'Decode any cron expression into plain English and preview the next 8 run times in IST, SAST, UTC or local time. Includes common presets. Free and online.',
    heading: 'Cron expression builder and parser',
    blurb:
      'Paste a cron expression to see what it actually means in plain English, along with the next eight times it will fire. Each of the five fields is broken out with its valid range, and run times can be viewed in India (IST), South Africa (SAST), UTC or your local timezone. Presets cover the usual schedules, from every five minutes to weekdays at 9am.',
    howItWorks: [
      'Paste a cron expression, or start from one of the presets.',
      'Read the plain-English description of what it means, with each of the five fields broken out and its valid range shown.',
      'Check the next eight run times, in IST, SAST, UTC or your local timezone.',
      'Adjust a field and watch the description and the schedule update immediately.',
    ],
    useCases: [
      'Confirming what an inherited cron line in a Kubernetes CronJob actually does',
      'Checking that a nightly job in UTC lands at the intended local hour in India or South Africa',
      'Writing a new schedule and verifying the next runs before deploying it',
      'Explaining a schedule to someone who does not read cron syntax',
    ],
    faq: [
      {
        q: 'Which cron format does it use?',
        a: 'The standard five-field format: minute, hour, day of month, month, day of week. That is what Linux cron, Kubernetes CronJobs and most CI schedulers accept.',
      },
      {
        q: 'Why does my expression run more often than I expected?',
        a: 'Almost always because day-of-month and day-of-week are both set to something other than *. Standard cron treats those two as OR, not AND, so the job fires on either match.',
      },
      {
        q: 'Are seconds supported?',
        a: 'No. Six-field expressions with a leading seconds column are a Quartz and Spring extension, not standard cron, and are not parsed here.',
      },
      {
        q: 'Does it handle daylight saving time?',
        a: 'The preview uses the timezone rules your browser has, so a schedule shown in a zone that observes DST reflects the shift. IST and SAST do not observe DST at all.',
      },
    ],
    related: ['/timestamp', '/http', '/uuid', '/mock'],
  },
  '/http': {
    title: 'HTTP Status Codes, Methods & Headers Reference — DevPocket',
    description:
      'Searchable reference for HTTP status codes (200, 301, 401, 404, 409, 422, 429, 500), request methods with safe and idempotent flags, and common headers.',
    heading: 'HTTP status code, method and header reference',
    blurb:
      'A searchable reference for the HTTP details worth checking rather than guessing: what 409 versus 422 actually mean, which methods are safe and idempotent, and what headers like Retry-After, ETag and Idempotency-Key are for. Grouped by class and filterable as you type.',
    howItWorks: [
      'Type into the filter to search across status codes, methods and headers at once.',
      'Codes are grouped by class — 2xx success, 3xx redirect, 4xx client error, 5xx server error.',
      'Methods list whether they are safe and idempotent, which is what decides if a client may retry.',
      'Headers give what each one is for rather than a restatement of its name.',
    ],
    useCases: [
      'Deciding between 400, 409 and 422 for a validation failure',
      'Checking whether PUT or PATCH is the idempotent choice for a retryable write',
      'Looking up what Retry-After expects when rate-limiting a client',
      'Settling whether a redirect should be 301, 302, 307 or 308',
    ],
    faq: [
      {
        q: '409 or 422 — which should I return?',
        a: '409 Conflict means the request clashes with the current state of the resource, such as a duplicate key or a stale version. 422 Unprocessable Content means the request was well-formed but its contents failed validation. If retrying the same request unchanged could succeed later, it is usually 409.',
      },
      {
        q: 'What does idempotent actually guarantee?',
        a: 'That making the same request twice leaves the server in the same state as making it once. It says nothing about the response body being identical, and it is why a client may safely retry PUT or DELETE but not POST.',
      },
      {
        q: 'When is 307 or 308 the right redirect?',
        a: 'When the method must be preserved. Historically 301 and 302 caused clients to turn a POST into a GET; 308 and 307 are the permanent and temporary equivalents that forbid that rewrite.',
      },
    ],
    related: ['/jwtvalidator', '/encode-decode', '/mock', '/cron'],
  },
  '/mock': {
    title: 'Mock Data Generator — JSON, CSV & SQL Inserts — DevPocket',
    description:
      'Generate realistic fake test data from 21 field types — names, emails, UUIDs, addresses, dates — and export as JSON, CSV or SQL INSERT statements. Free online.',
    heading: 'Mock and test data generator',
    blurb:
      'Build up to 500 realistic records from 21 field types including names, emails, phone numbers, addresses, prices, timestamps and IP addresses. Export as JSON to stub an API response, CSV to import into a spreadsheet, or ready-to-run SQL INSERT statements to seed a development database.',
    howItWorks: [
      'Define your record: choose from 21 field types including names, emails, phone numbers, addresses, prices, timestamps, UUIDs and IP addresses.',
      'Set how many records you want, up to 500.',
      'Pick the output format — JSON, CSV, or SQL INSERT statements.',
      'Copy or download the result and drop it straight into your fixture, spreadsheet or seed script.',
    ],
    useCases: [
      'Seeding a development database with believable rows instead of foo and bar',
      'Stubbing an API response while the real endpoint is still being built',
      'Producing a CSV to test an import feature against realistic data',
      'Generating enough records to see how a table or list performs when it is full',
    ],
    faq: [
      {
        q: 'Is the data realistic enough to demo with?',
        a: 'It is generated to look plausible — real-shaped names, valid email formats, sensible addresses — so a screenshot or a demo does not read as placeholder junk. It is invented, not sampled from real people.',
      },
      {
        q: 'Can I use it as test data for something with personal data rules?',
        a: 'Yes, and that is the point: because none of it describes a real person, using it avoids copying production records into a development environment.',
      },
      {
        q: 'Why is it capped at 500 records?',
        a: 'Generation and rendering happen in your tab. 500 rows covers fixtures and demos while keeping the page responsive; for a bulk load, generate a batch and repeat it in your seed script.',
      },
    ],
    related: ['/codegen', '/json-schema', '/uuid', '/convert'],
  },
  '/jsonvalidator': {
    title: 'JSON Validator Online — Tree View & Duplicate Keys',
    description:
      'Validate JSON online with the exact error line and column, a collapsible tree view, duplicate-key detection and search. Free and browser-based.',
    heading: 'JSON validator and editor',
    blurb:
      'Paste or upload JSON to validate it with the precise line and column of any syntax error, then switch between a formatted code view and a collapsible tree — the two views a full JSON editor gives you, without the upload. Object keys repeated within the same literal are flagged, since JSON.parse silently keeps only the last one. Sort keys, choose an indent width, search by key or value, and export the result as a file, all locally in your browser.',
    howItWorks: [
      'Paste or upload a JSON document. It is parsed as you type.',
      'If it is invalid, the exact line and column where parsing stopped is reported instead of a bare error.',
      'Switch between the formatted code view and the collapsible tree, sort keys, or change the indent width.',
      'Search by key or value, then copy or download the formatted result.',
    ],
    useCases: [
      'Finding the missing comma in a config file the application refuses to start with',
      'Checking a hand-edited payload before pasting it into a request',
      'Exploring an unfamiliar API response as a tree rather than scrolling raw text',
      'Catching a duplicate key that JSON.parse would silently swallow',
    ],
    faq: [
      {
        q: 'Why does duplicate-key detection matter?',
        a: 'JSON.parse keeps only the last occurrence of a repeated key and reports no error, so a config with the same key twice loads cleanly and behaves in a way that does not match what you read. This tool flags the duplicate instead.',
      },
      {
        q: 'Does it accept comments or trailing commas?',
        a: 'No. It validates strict JSON as specified, so JSON5 and JSONC features are reported as syntax errors. That is deliberate — if your parser will reject them, this should too.',
      },
      {
        q: 'Is my JSON uploaded when I use the upload button?',
        a: 'No. The file is read by the browser with the File API and never leaves your machine — the same as pasting it.',
      },
      {
        q: 'How is this different from the JSON / XML page?',
        a: 'That page also handles XML and offers path-based search. This one is JSON-only and adds the tree view and duplicate-key detection.',
      },
    ],
    related: ['/json-tree', '/json-xml', '/json-stats', '/json-schema'],
  },
  '/json-sort-keys': {
    title: 'JSON Sort Keys Online — Alphabetise Object Keys — DevPocket',
    description:
      'Sort JSON object keys alphabetically at every nesting level, ascending or descending. Array order is preserved. Free, runs entirely in your browser.',
    heading: 'Sort JSON keys alphabetically',
    blurb:
      'Reorders every object key alphabetically, recursively, so two payloads with the same data but different key order become directly comparable in a diff. Array order is left alone, because in an array the order is the data.',
    howItWorks: [
      'Paste the JSON document you want reordered.',
      'Choose ascending or descending order.',
      'Every object is sorted, at every nesting level, while array order is left untouched.',
      'Copy the result, or run the same tool on a second document to compare the two.',
    ],
    useCases: [
      'Making two payloads with the same data but different key order diff cleanly',
      'Normalising a generated config before committing it, so future diffs stay small',
      'Finding a key quickly in a large object by scanning alphabetically',
      'Producing a stable form of a document to hash or snapshot in a test',
    ],
    faq: [
      {
        q: 'Why are arrays not sorted?',
        a: 'In an array the order is part of the data — the second element of a list of steps is not interchangeable with the first. Sorting it would change meaning, so only object keys are reordered.',
      },
      {
        q: 'Does key order matter in JSON?',
        a: 'Not to a parser: the specification calls objects unordered, and no correct consumer should depend on the order. It matters to humans and to text diffs, which is what this tool is for.',
      },
      {
        q: 'How does sorting handle numbers and mixed case?',
        a: 'Keys are compared as strings, so uppercase letters sort before lowercase and 10 sorts before 9. Consistency between two documents is what matters here, and string comparison gives that.',
      },
    ],
    related: ['/diff', '/jsonvalidator', '/json-flatten', '/json-stats'],
  },
  '/json-flatten': {
    title: 'JSON Flattener — Nested JSON to Dot Notation',
    description:
      'Flatten nested JSON into single-level dot-notation keys like a.b[0].c. Useful for config files, feature flags and spreadsheet exports. Free and offline.',
    heading: 'Flatten nested JSON',
    blurb:
      'Collapses a nested document into one level of dot-notation keys, with array positions kept as [index]. Handy for turning a config tree into environment-variable style keys, or for diffing two deeply nested structures line by line.',
    howItWorks: [
      'Paste a nested JSON document.',
      'Every leaf value is rewritten as a single key describing its full path, joined with dots.',
      'Array positions are kept as bracketed indexes, so a.b[0].c stays unambiguous.',
      'Copy the flat result, or feed it into the unflattener to get the original back.',
    ],
    useCases: [
      'Turning a nested config tree into flat keys for environment variables or a properties file',
      'Diffing two deeply nested documents line by line instead of block by block',
      'Preparing a JSON document for a CSV export where every leaf needs its own column',
      'Building a checklist of every path in a payload before writing extraction code',
    ],
    faq: [
      {
        q: 'What separator is used?',
        a: 'A dot between object keys and square brackets for array indexes — the same notation JSONPath and most config libraries use, so the output is usually directly reusable.',
      },
      {
        q: 'What happens to a key that already contains a dot?',
        a: 'It is kept as written, which makes that one path ambiguous when read back. If your keys contain dots, flattening is a lossy step for them.',
      },
      {
        q: 'Is flattening reversible?',
        a: 'Yes, for documents without dots inside key names. Run the result through the JSON Unflattener and you get the original structure back.',
      },
    ],
    related: ['/json-unflatten', '/convert', '/jsonpath', '/json-stats'],
  },
  '/json-unflatten': {
    title: 'JSON Unflattener — Dot Notation to Nested JSON',
    description:
      'Rebuild nested JSON objects and arrays from flat dot-notation keys such as user.address.city. The exact inverse of flattening. Free, browser-based.',
    heading: 'Rebuild nested JSON from flat keys',
    blurb:
      'Takes flat keys like user.address.city or tags[0] and reconstructs the object and array structure they describe. It is the exact inverse of the flattener, so a flatten followed by an unflatten returns the original document.',
    howItWorks: [
      'Paste a flat object whose keys are dot-notation paths, such as user.address.city.',
      'Bracketed indexes like tags[0] are read as array positions rather than key names.',
      'The nested objects and arrays those paths describe are rebuilt.',
      'Copy the structured result.',
    ],
    useCases: [
      'Rebuilding a config object from flat environment-variable style keys',
      'Turning a spreadsheet or CSV row with dotted headers back into a nested payload',
      'Reversing a flatten step after diffing or editing the flat form',
      'Constructing a nested request body from a flat form submission',
    ],
    faq: [
      {
        q: 'Is this the exact inverse of the flattener?',
        a: 'Yes, for documents whose key names contain no dots. Flatten then unflatten returns the original document.',
      },
      {
        q: 'What decides whether a path segment becomes an object or an array?',
        a: 'The notation. A bracketed number creates an array position; anything else creates an object key. So items[0].id builds an array of objects, while items.0.id builds nested objects.',
      },
      {
        q: 'What happens if two keys conflict?',
        a: 'If one path treats a segment as a value and another treats the same segment as a parent, the structure is contradictory and the conflict is reported rather than silently resolved.',
      },
    ],
    related: ['/json-flatten', '/convert', '/json-merge', '/jsonvalidator'],
  },
  '/json-escape': {
    title: 'JSON Escape & Unescape Online — DevPocket',
    description:
      'Escape text into a JSON string literal, or unescape one back to readable text. Handles quotes, backslashes, newlines and unicode. Free and private.',
    heading: 'Escape and unescape JSON strings',
    blurb:
      'Turns raw text into the escaped form you can paste inside a JSON string — quotes, backslashes, newlines and control characters all handled — and reverses it when you need to read an escaped blob out of a log line.',
    howItWorks: [
      'Paste raw text to escape it into the form that is legal inside a JSON string.',
      'Quotes, backslashes, newlines, tabs and control characters are all handled.',
      'Or paste an already-escaped string to unescape it back into readable text.',
      'Copy whichever direction you needed.',
    ],
    useCases: [
      'Embedding a block of JSON inside another JSON string field',
      'Reading an escaped payload copied out of a log line',
      'Putting a multi-line certificate or key body into a single JSON string',
      'Fixing a request body that a tool has double-escaped',
    ],
    faq: [
      {
        q: 'Does the escaped output include the surrounding quotes?',
        a: 'The escaping covers the string contents. Add the quotes when you paste it into place, or the pair will be escaped as part of the text.',
      },
      {
        q: 'How are non-ASCII characters treated?',
        a: 'They are left as themselves, which is valid JSON in UTF-8 and stays readable. Escaping to \\u sequences is only needed for transports that cannot carry UTF-8.',
      },
      {
        q: 'Why does my string look double-escaped?',
        a: 'Usually because it was escaped twice on the way in — once by the producing code and once by the transport. Run unescape twice and check whether the second pass gives readable text.',
      },
    ],
    related: ['/encode-decode', '/jsonvalidator', '/json-xml', '/diff'],
  },
  '/json-remove-nulls': {
    title: 'Remove Nulls from JSON Online — Free Cleaner — DevPocket',
    description:
      'Strip every null value and null array entry from a JSON document, at any nesting depth. Free, instant, and nothing you paste is ever uploaded.',
    heading: 'Remove null values from JSON',
    blurb:
      'Deletes keys whose value is null and drops null entries from arrays, recursively. Useful before sending a payload to an API that rejects explicit nulls, or when trimming a response down to the fields that actually carry data.',
    howItWorks: [
      'Paste the JSON document you want cleaned.',
      'Every key whose value is null is dropped, at any nesting depth.',
      'Null entries inside arrays are removed too, and the remaining elements close up.',
      'Copy the cleaned document.',
    ],
    useCases: [
      'Trimming a response down to the fields that actually carry data before reading it',
      'Preparing a PATCH body for an API that treats an explicit null as delete this field',
      'Shrinking a fixture where most optional fields came back empty',
      'Cleaning a payload produced by an ORM that serialises every unset column',
    ],
    faq: [
      {
        q: 'Is there a difference between a missing key and a key set to null?',
        a: 'Often yes, and it matters. Many APIs read an explicit null as clear this value and a missing key as leave it alone. Strip nulls only when you mean the second.',
      },
      {
        q: 'Are empty strings and empty arrays removed too?',
        a: 'No — this tool touches nulls only. Use Remove Empty Values for the more aggressive clean that also drops "", [] and {}.',
      },
      {
        q: 'Does removing nulls from an array shift the indexes?',
        a: 'Yes. The remaining elements close up, so anything referring to a position by index needs rechecking afterwards.',
      },
    ],
    related: ['/json-remove-empty', '/jsonvalidator', '/json-merge', '/json-stats'],
  },
  '/json-remove-empty': {
    title: 'Remove Empty Values from JSON — DevPocket',
    description:
      'Strip nulls, empty strings, empty arrays and empty objects from JSON at every level. More aggressive than a null-only clean. Free and browser-based.',
    heading: 'Remove empty values from JSON',
    blurb:
      'Goes further than removing nulls: empty strings, empty arrays and empty objects are dropped too, and the cleanup runs bottom-up so a branch that becomes empty after its children are removed also disappears.',
    howItWorks: [
      'Paste the document you want cleaned.',
      'Nulls, empty strings, empty arrays and empty objects are all removed.',
      'The pass runs bottom-up, so a branch left empty after its children are dropped disappears as well.',
      'Copy the result.',
    ],
    useCases: [
      'Cutting a verbose API response down to the fields that carry a value',
      'Cleaning a form submission where untouched fields came through as empty strings',
      'Removing scaffolding from a generated config before committing it',
      'Making two payloads comparable when one serialises empty values and the other omits them',
    ],
    faq: [
      {
        q: 'How is this different from Remove Nulls?',
        a: 'Remove Nulls drops only null. This also drops "", [] and {}, and then removes any parent left empty as a result.',
      },
      {
        q: 'Is zero or false removed?',
        a: 'No. 0, false and "0" are real values, not empty ones, and are always kept — which is where a naive falsy check in application code usually goes wrong.',
      },
      {
        q: 'What does bottom-up mean here?',
        a: 'Children are cleaned before their parent is checked. So an object whose only key held an empty array becomes empty itself and is then removed too, rather than surviving as {}.',
      },
    ],
    related: ['/json-remove-nulls', '/json-stats', '/jsonvalidator', '/json-merge'],
  },
  '/json-merge': {
    title: 'JSON Merge Online — Deep Merge Two Documents — DevPocket',
    description:
      'Merge two JSON documents with a deep or shallow strategy. Nested objects combine recursively; the second document wins on conflicts. Free and private.',
    heading: 'Merge two JSON documents',
    blurb:
      'Combines a base document with an overriding one. Deep merge walks nested objects and merges them key by key; shallow merge only touches the top level. Arrays are replaced rather than concatenated, which matches how config overrides usually behave.',
    howItWorks: [
      'Paste the base document on the left and the overriding one on the right.',
      'Choose deep merge to combine nested objects key by key, or shallow to replace at the top level only.',
      'Where both documents set the same key to a scalar, the second one wins.',
      'Copy the merged result.',
    ],
    useCases: [
      'Applying an environment override on top of a base configuration',
      'Combining a defaults object with user settings the way a config library would',
      'Layering a patch onto a fixture without editing the original',
      'Working out what the effective config will be before deploying it',
    ],
    faq: [
      {
        q: 'Why are arrays replaced instead of concatenated?',
        a: 'Because that is what config overrides almost always mean. If a base sets three allowed hosts and an override sets one, concatenating would silently keep the other two. Replacement makes the override authoritative.',
      },
      {
        q: 'What is the difference between deep and shallow merge?',
        a: 'Shallow merge only looks at top-level keys, so an object in the second document replaces the whole object in the first. Deep merge walks into nested objects and merges them key by key.',
      },
      {
        q: 'How is null treated in the overriding document?',
        a: 'As a value, so it overwrites whatever the base had. To drop a key entirely, remove it from both documents or clean the result with Remove Nulls.',
      },
    ],
    related: ['/json-remove-nulls', '/diff', '/jsonvalidator', '/json-unflatten'],
  },
  '/json-tree': {
    title: 'JSON Tree Viewer Online — Explore Nested JSON — DevPocket',
    description:
      'View any JSON payload as a collapsible tree with typed, colour-coded values. Far easier than scrolling a large raw response. Free, no upload.',
    heading: 'Browse JSON as a tree',
    blurb:
      'Renders a payload as an expandable tree, with each branch showing how many children it holds and every leaf colour-coded by type. Collapse the parts you do not care about to find the one field you do.',
    howItWorks: [
      'Paste any JSON payload.',
      'It is rendered as an expandable tree, with each branch showing how many children it holds.',
      'Leaf values are colour-coded by type, so a number that arrived as a string is visible at a glance.',
      'Collapse the parts you do not care about to get to the field you do.',
    ],
    useCases: [
      'Exploring an unfamiliar API response without scrolling thousands of raw lines',
      'Checking the shape of a deeply nested document before writing code against it',
      'Confirming a value arrived as the type you expected rather than a stringified one',
      'Finding one field inside a large payload during an incident',
    ],
    faq: [
      {
        q: 'Can it handle large payloads?',
        a: 'Yes. Only the rows currently on screen are rendered, so a document with tens of thousands of nodes scrolls without freezing the tab. Large documents are also parsed in a background worker.',
      },
      {
        q: 'How do I tell a number from a numeric string?',
        a: 'By colour and by the quotes. A string value is quoted and coloured as a string even when it reads as 42 — which is usually the first clue when a comparison in your code is failing.',
      },
      {
        q: 'How is this different from the JSON Validator’s tree?',
        a: 'It is the same idea with a different focus. The validator leads with error reporting and duplicate keys; this page is the tree on its own, for reading rather than checking.',
      },
    ],
    related: ['/jsonvalidator', '/json-stats', '/jsonpath', '/json-xml'],
  },
  '/json-stats': {
    title: 'JSON Statistics — Node Count, Depth & Types',
    description:
      'Analyse a JSON payload: total nodes, maximum nesting depth, unique key count, size in bytes and a breakdown by type. Free and runs in your browser.',
    heading: 'Analyse a JSON payload',
    blurb:
      'Counts objects, arrays, strings, numbers, booleans and nulls, reports the deepest nesting level and the total number of distinct key names, and lists them. A quick way to size up an unfamiliar API response before writing code against it.',
    howItWorks: [
      'Paste a JSON document.',
      'It is measured: total nodes, objects, arrays, strings, numbers, booleans and nulls.',
      'The deepest nesting level, the number of distinct key names and the size in bytes are reported.',
      'The distinct keys are listed, so you can see the vocabulary of the document at once.',
    ],
    useCases: [
      'Sizing up an unfamiliar API response before writing a parser for it',
      'Checking how deep a payload nests before choosing a traversal strategy',
      'Comparing two responses by shape rather than by content',
      'Finding out how much of a large payload is nulls before deciding to strip them',
    ],
    faq: [
      {
        q: 'What counts as a node?',
        a: 'Every value in the document, including the container objects and arrays themselves — not only the leaves. It is a measure of total structure rather than of data points.',
      },
      {
        q: 'Is the byte size what my API actually sends?',
        a: 'It is the size of the text you pasted, in UTF-8. A real response is usually smaller on the wire because it is minified and gzipped.',
      },
      {
        q: 'Why does the distinct key count matter?',
        a: 'A payload with three hundred nodes but eight distinct keys is a repeated record shape; one with three hundred distinct keys is a configuration document. They call for very different handling.',
      },
    ],
    related: ['/json-tree', '/json-schema', '/jsonvalidator', '/json-remove-empty'],
  },
  '/jsonpath': {
    title: 'JSONPath Evaluator Online — Test $.path Queries',
    description:
      'Run JSONPath expressions against a document and see the matches instantly. Supports dot paths, array indexes, wildcards and recursive descent. Free.',
    heading: 'Evaluate JSONPath expressions',
    blurb:
      'Test a JSONPath expression against a real document and see every match as you type. Supports dot notation, array indexes, [*] wildcards and .. recursive descent — enough for the lookups that come up when writing an extraction rule or a config selector.',
    howItWorks: [
      'Paste the document on the left.',
      'Type a JSONPath expression, starting from $ for the root.',
      'Matches are listed as you type, so a wrong path shows up immediately rather than at runtime.',
      'Copy the matched values, or the expression once it is right.',
    ],
    useCases: [
      'Writing an extraction rule for a monitoring or ETL tool and checking it against a real payload',
      'Pulling every id out of a nested response without writing a script',
      'Testing a config selector before committing it',
      'Learning what .. recursive descent actually matches in your document',
    ],
    faq: [
      {
        q: 'Which JSONPath syntax is supported?',
        a: 'Dot notation, bracketed keys and indexes, [*] wildcards and .. recursive descent — the subset that covers most extraction rules. Filter expressions such as [?(@.price<10)] are not evaluated.',
      },
      {
        q: 'What does $..id match?',
        a: 'Every id key anywhere in the document, at any depth, in document order. It is the quickest way to answer where does this field appear.',
      },
      {
        q: 'Why does my expression return nothing?',
        a: 'Most often a case mismatch in a key name, or a missing array index where the path crosses a list. Try the same path one segment shorter to see where it stops matching.',
      },
    ],
    related: ['/json-tree', '/json-flatten', '/jsonvalidator', '/json-schema'],
  },
  '/json-schema': {
    title: 'JSON Schema Generator — Infer a Schema from JSON — DevPocket',
    description:
      'Generate a draft 2020-12 JSON Schema from a sample payload, with types, required fields and detected date-time and email formats. Free and offline.',
    heading: 'Generate a JSON Schema from a sample',
    blurb:
      'Infers a draft 2020-12 schema from an example document: object properties with their types, required field lists, array item types, and format hints where a string looks like an ISO date-time or an email address. A starting point to refine rather than a finished contract.',
    howItWorks: [
      'Paste a representative sample document — the schema can only describe what the sample shows.',
      'A draft 2020-12 schema is inferred: property types, required lists and array item types.',
      'Strings that look like ISO date-times or email addresses are given a format hint.',
      'Copy the schema and refine it — add constraints, descriptions and enums by hand.',
    ],
    useCases: [
      'Bootstrapping a request-body schema for an OpenAPI specification',
      'Generating a contract to validate incoming webhooks against',
      'Documenting the shape of a legacy response nobody wrote down',
      'Producing a starting point for a JSON Schema based test fixture',
    ],
    faq: [
      {
        q: 'Is the generated schema ready to use as a contract?',
        a: 'Treat it as a first draft. It captures structure and types faithfully, but it cannot know which fields are genuinely optional, what ranges are valid, or which strings are really enums — that judgement has to be added by you.',
      },
      {
        q: 'How are required fields decided?',
        a: 'Every key present in the sample is marked required. If a field is optional in reality, remove it from the required list after generating.',
      },
      {
        q: 'Which draft does it target?',
        a: 'Draft 2020-12, the current version, which is what OpenAPI 3.1 aligns with.',
      },
    ],
    related: ['/codegen', '/jsonvalidator', '/json-stats', '/mock'],
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
    title: 'Password Generator — Strong Random Passwords',
    description:
      'Generate strong random passwords with configurable length and character sets, plus an entropy estimate. Uses browser crypto and never transmits them.',
    heading: 'Generate strong passwords',
    blurb:
      'Builds passwords from the character sets you choose using the browser’s cryptographic random source rather than Math.random, and reports the resulting entropy in bits so you can judge the strength rather than guess it. Look-alike characters can be excluded for passwords that get typed by hand. Nothing generated here is ever transmitted.',
    howItWorks: [
      'Choose a length and which character sets to include — lowercase, uppercase, digits, symbols.',
      'Optionally exclude look-alike characters such as l, 1, I, O and 0.',
      'A password is generated from the browser’s cryptographic random source, not Math.random.',
      'Read the entropy estimate in bits, then copy the password.',
    ],
    useCases: [
      'Creating a service account or database password during setup',
      'Generating a shared secret for a webhook signature',
      'Producing a password that has to be read aloud or typed by hand, with look-alikes excluded',
      'Replacing a password that was committed to a repository by accident',
    ],
    faq: [
      {
        q: 'Is this random enough to trust?',
        a: 'It uses crypto.getRandomValues, the browser’s cryptographically secure generator, rather than Math.random, whose output is predictable from previous values.',
      },
      {
        q: 'What does the entropy figure mean?',
        a: 'The number of bits of true randomness in the password, given its length and the character sets you enabled. Each extra bit doubles the guessing effort; below about 60 bits a determined offline attack becomes practical.',
      },
      {
        q: 'Is the password sent anywhere?',
        a: 'No. It is generated in your tab and never transmitted or stored. Reloading the page discards it, so copy it before you navigate away.',
      },
      {
        q: 'Is a long passphrase better than a short complex password?',
        a: 'Usually, yes. Length contributes more entropy than symbol variety does, and a long password is easier to type correctly.',
      },
    ],
    related: ['/uuid', '/encode-decode', '/jwtvalidator', '/privacy'],
  },
  '/lorem': {
    title: 'Lorem Ipsum Generator — Words & Paragraphs',
    description:
      'Generate placeholder Lorem Ipsum text by word, sentence or paragraph count, with the classic opening line optional. Free and instant.',
    heading: 'Generate placeholder text',
    blurb:
      'Produces filler copy in whatever quantity a layout needs — a handful of words for a label, a few sentences for a card, or several paragraphs for an article mock-up — with the traditional "Lorem ipsum dolor sit amet" opening available as a toggle.',
    howItWorks: [
      'Choose the unit you need — words, sentences or paragraphs.',
      'Set how many.',
      'Decide whether to open with the traditional Lorem ipsum dolor sit amet line.',
      'Copy the text into your mock-up.',
    ],
    useCases: [
      'Filling a card or list component to see how it behaves at realistic length',
      'Checking whether a heading wraps badly at two lines',
      'Populating a CMS entry while the real copy is still being written',
      'Testing truncation and overflow rules with text of a known length',
    ],
    faq: [
      {
        q: 'Why use Lorem Ipsum rather than real sentences?',
        a: 'Because it is unreadable enough that reviewers judge the layout instead of the copy. If you want people to read the words, placeholder text is the wrong tool.',
      },
      {
        q: 'Does it always start with the classic line?',
        a: 'Only if you leave that option on. Turn it off when you want text that does not look immediately like filler.',
      },
      {
        q: 'Is Lorem Ipsum actually Latin?',
        a: 'It is scrambled Latin, derived from a passage of Cicero, and does not read as meaningful prose. That is precisely why it works as filler.',
      },
    ],
    related: ['/mock', '/color', '/diff', '/uuid'],
  },
  '/privacy': {
    title: 'Privacy — How DevPocket Handles Your Data',
    description:
      'DevPocket runs entirely client-side: no backend, no analytics, no cookies, no error tracking. See what is stored locally and how to verify it yourself.',
    heading: 'How DevPocket actually handles your data',
    blurb:
      'A plain description of the architecture, not a marketing claim: what runs locally, what (if anything) leaves your browser, what is stored in localStorage, and how to check all of it yourself in the Network tab.',
    faq: [
      {
        q: 'Do you use cookies?',
        a: 'No. There are no cookies of any kind, so there is no cookie banner to dismiss.',
      },
      {
        q: 'Is there analytics or error tracking?',
        a: 'Neither. There is no analytics script, no error reporting service and no third-party tag. The only requests the site makes are for its own HTML, JavaScript, CSS and fonts.',
      },
      {
        q: 'What is stored in my browser?',
        a: 'Your theme choice, your favourite tools, the tools you opened recently and your split-pane widths — all in localStorage, all readable by you in DevTools under Application. Tool inputs are never written there.',
      },
      {
        q: 'How can I verify any of this myself?',
        a: 'Open DevTools, go to the Network tab, clear it, then use any tool on the site. If a payload were being uploaded, a request would appear. None does.',
      },
    ],
    related: ['/about', '/jwtvalidator', '/password'],
  },
  '/about': {
    title: 'About DevPocket — Built by Sourabh Kumar',
    description:
      'DevPocket is a local-first developer toolbox built by Sourabh Kumar, a backend developer. No trackers, no ads, and nothing you paste leaves your browser.',
    heading: 'About DevPocket',
    blurb:
      'DevPocket was built to replace a pile of browser tabs pointed at ad-heavy formatter sites. Every tool runs as JavaScript in your own browser, so there is no server to send your data to in the first place.',
    faq: [
      {
        q: 'Who built DevPocket?',
        a: 'Sourabh Kumar, a backend developer in India. It started as a set of tools he kept re-opening other sites for, and turned into one place that does them without an upload step.',
      },
      {
        q: 'Why does everything run in the browser?',
        a: 'Because the inputs are usually production payloads, tokens and customer data. A tool that posts them to a server asks you to trust that server; one that never sends them removes the question.',
      },
      {
        q: 'Is it open to suggestions?',
        a: 'Yes. The tools here exist because they came up in day-to-day backend work, so a gap someone else hits is worth hearing about.',
      },
    ],
    related: ['/privacy', '/json-xml', '/jwtvalidator'],
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
