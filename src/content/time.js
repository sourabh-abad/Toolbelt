// Page copy for the Unix Timestamp Converter (now timestamp-only) and the
// Regex Tester that moved out of it. Merged into SEO in src/lib/seo.js.

export default {
  '/timestamp': {
    title: 'Unix Timestamp Converter (Epoch to Date & Back) | DevPocket',
    description:
      'Convert Unix timestamps to dates and back. Seconds, ms, µs and ns detected, any time zone, ISO 8601 and RFC 2822, relative time and batch mode. In your browser.',
    heading: 'Unix Timestamp Converter',
    aboutLabel: 'Unix timestamps',
    blurb:
      'Paste an epoch timestamp from a log, a database or a JWT and see the date it stands for — the unit (seconds, milliseconds, microseconds or nanoseconds) is detected from the number of digits. Convert a date back to epoch, see the instant in any IANA time zone, and convert a whole column of values at once.',
    related: [
      ['/jwt-decoder', 'Read the exp, iat and nbf timestamps inside a token'],
      ['/cron', 'Schedule a job and preview its next run times'],
      ['/uuid-v7-generator', 'Pull the creation time out of a UUID v7'],
      ['/number-base', 'See a timestamp in hex or binary'],
      ['/regex-tester', 'Match timestamps and dates in log lines'],
    ],
    deepDive: {
      heading: 'A Unix timestamp is a count of seconds since 1970, in UTC',
      body: [
        'Unix time counts the seconds elapsed since 00:00:00 UTC on 1 January 1970, the Unix epoch. It has no time zone: 1700000000 is the same instant in Mumbai and in New York, and only its display differs. That is why databases, APIs and log pipelines store it — comparisons and arithmetic are plain integer maths, and converting to a local time happens at the edge, for a person.',
        'The same instant is written with different precision. Seconds (10 digits today) are the classic form, used by time(), JWT exp and iat claims, and most Unix tools. JavaScript’s Date.now() and Java’s System.currentTimeMillis() return milliseconds (13 digits). Go, Python’s time.time_ns() and many tracing systems use microseconds or nanoseconds (16 or 19 digits). Reading a millisecond value as seconds puts the date tens of thousands of years in the future, so this converter detects the unit from the digit count and shows which it chose. For the timestamps inside a token, [decode the JWT](/jwt-decoder) and its exp and iat claims are converted for you.',
        'Two limits catch real systems. A signed 32-bit integer runs out at 2147483647 — 03:14:07 UTC on 19 January 2038 — and the next second wraps to December 1901 on systems that still store time_t in 32 bits. And Unix time ignores leap seconds: every day is exactly 86,400 seconds, so a leap second is either repeated or smeared across the day by the clock source. For scheduling rather than converting, the [cron expression builder](/cron) shows when a job will next run.',
      ],
      example: {
        inputLabel: 'Timestamps',
        input: `1700000000
1700000000123
1700000000123456789`,
        outputLabel: 'Detected unit → ISO 8601 (UTC)',
        output: `seconds       → 2023-11-14T22:13:20.000Z
milliseconds  → 2023-11-14T22:13:20.123Z
nanoseconds   → 2023-11-14T22:13:20.123456789Z`,
        note: 'The same instant at three precisions. The nanosecond digits past the millisecond are kept exactly (BigInt), not rounded.',
      },
      gotchas: [
        {
          title: 'Milliseconds read as seconds',
          detail: 'A 13-digit value treated as seconds lands around the year 55,000. If a date looks absurd, check the unit — Date.now() and most Java APIs are milliseconds.',
        },
        {
          title: 'A date without an offset',
          detail: '2024-01-15T09:30 has no zone, so it is read as local time; 2024-01-15 on its own is midnight UTC in JavaScript. Add Z or +05:30 to make the instant unambiguous.',
        },
        {
          title: 'Storing local time instead of UTC',
          detail: 'Converting to local time before storing means daylight-saving changes create duplicate or missing hours. Store the timestamp and convert when displaying.',
        },
        {
          title: 'The year 2038 in 32-bit fields',
          detail: 'INT columns in MySQL, 32-bit time_t in embedded C and some file formats overflow on 19 January 2038. Use 64-bit integers or native timestamp types.',
        },
      ],
    },
    howItWorks: [
      'Paste a timestamp; the unit is detected from its digits, or pick one.',
      'Read it as ISO 8601, RFC 2822 and relative time, and in every zone you added.',
      'Type or pick a date to get its Unix seconds and milliseconds.',
      'Paste a column into Batch convert and copy the results as CSV.',
    ],
    useCases: [
      'Reading created_at or exp values from logs and tokens',
      'Checking when a cache entry or a signed URL expires',
      'Converting a column of epoch values from a database export',
      'Finding the local time of an incident across teams in several zones',
    ],
    faq: [
      {
        q: 'What is a Unix timestamp?',
        a: 'The number of seconds since 1970-01-01 00:00:00 UTC, not counting leap seconds. It identifies an instant independent of time zone; 0 is the epoch itself and negative values are earlier dates.',
      },
      {
        q: 'Is my timestamp in seconds or milliseconds?',
        a: 'Count the digits. For current dates, 10 digits is seconds, 13 is milliseconds, 16 microseconds and 19 nanoseconds. This page detects that automatically and shows the unit it used.',
      },
      {
        q: 'What is the year 2038 problem?',
        a: 'Systems that store Unix time in a signed 32-bit integer can count only to 2147483647, which is 03:14:07 UTC on 19 January 2038. One second later the value wraps to 1901. 64-bit timestamps do not have this limit.',
      },
      {
        q: 'Does Unix time include leap seconds?',
        a: 'No. Every Unix day has exactly 86,400 seconds, so the 27 leap seconds added since 1972 are not counted. During a leap second, clocks either repeat a second or spread it across the day.',
      },
      {
        q: 'How do I get the current timestamp in my language?',
        a: 'The code panel lists one-liners for JavaScript, Python, Go, Java, PHP, PostgreSQL, MySQL and Bash, each in seconds, with the millisecond variant where it differs.',
      },
    ],
  },

  '/regex-tester': {
    title: 'Regex Tester Online — Live Match Highlighting (JavaScript) | DevPocket',
    description:
      'Test JavaScript regular expressions with live match highlighting, capture groups with positions, replace and a clickable cheat sheet. Runaway patterns are stopped.',
    heading: 'Regex Tester',
    aboutLabel: 'regular expressions',
    blurb:
      'Write a pattern and every match is highlighted in your test text as you type, with each capture group — numbered and named — and its start and end position in a table. Try a replacement with $1 or $<name>, insert tokens from the cheat sheet, and never freeze the tab: a pattern that backtracks for more than a second is stopped.',
    related: [
      ['/diff', 'Compare text before and after a regex replace'],
      ['/case-converter', 'Rename identifiers without writing a pattern'],
      ['/url-parser', 'Split URLs properly instead of matching them with regex'],
      ['/timestamp', 'Convert the timestamps you matched in a log'],
      ['/jsonpath', 'Query JSON by path rather than by pattern'],
      ['/json-escape', 'Escape a pattern for a JSON config file'],
    ],
    deepDive: {
      heading: 'Test the pattern in the engine that will run it',
      body: [
        'Regular expressions look the same across languages but are not. This tester runs your pattern in the browser’s own JavaScript engine (ECMAScript), so a match here is a match in Node.js, Deno, Bun and front-end code — including features that differ elsewhere, such as named groups written (?<name>…), lookbehind, the u flag for Unicode property escapes like \\p{L}, and the d flag, which reports where each capture group starts and ends. The group table uses those positions, which is how it can show that group 2 of match 3 sits at characters 34–36.',
        'Flags change how a pattern behaves more than most people expect. Without g only the first match is found — and only the first is replaced. m makes ^ and $ match at every line, s lets . cross line breaks, i ignores case, and y (sticky) only matches exactly where the previous match ended. An empty match, such as \\d* at a position with no digits, is legal; the tester steps past it so the next search can continue. To clean up text after a replace, [compare the before and after in the Diff Checker](/diff).',
        'Some patterns take exponential time on inputs that almost match: (a+)+$ against a long run of a’s followed by ! tries every way of splitting the a’s before failing. That is catastrophic backtracking, the cause of real outages. Here the pattern runs in a Web Worker that is stopped after one second, with a note on what to look for: nested quantifiers and alternatives that can match the same text. The fix is to make each part unambiguous, for example ^a+$.',
      ],
      example: {
        inputLabel: 'Pattern (g) and text',
        input: `(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})

Released 2024-01-15, patched 2024-02-03`,
        outputLabel: 'Matches and replace with $<day>/$<month>/$<year>',
        output: `Match 1  2024-01-15  9–19   year=2024 month=01 day=15
Match 2  2024-02-03  29–39  year=2024 month=02 day=03

Released 15/01/2024, patched 03/02/2024`,
        note: 'Positions are character offsets, end exclusive — the same numbers match.indices gives with the d flag.',
      },
      gotchas: [
        {
          title: 'Forgetting the g flag',
          detail: 'Without g, exec and replace stop after the first match. If only one date changed in a replace, the flag is missing.',
        },
        {
          title: 'Escaping in string literals',
          detail: 'A pattern written in a JavaScript string needs double backslashes: new RegExp("\\\\d+"). The pattern box here takes the regex itself, as in a /…/ literal, so write \\d+.',
        },
        {
          title: 'Greedy quantifiers matching too much',
          detail: '<.+> on "<a><b>" matches the whole string. Use the lazy <.+?> or a negated class <[^>]+> to stop at the first >.',
        },
        {
          title: 'Copying a PCRE or Python pattern',
          detail: 'Possessive quantifiers (a++), atomic groups (?>…) and (?P<name>…) are errors in JavaScript. Rewrite them, or test in the engine that will run the pattern.',
        },
        {
          title: '. does not match line breaks',
          detail: 'Without the s flag, . stops at \\n, so a pattern that works on one line fails on a pasted block. Add s or use [\\s\\S].',
        },
      ],
    },
    howItWorks: [
      'Type a pattern and toggle flags; matches highlight as you type.',
      'Read every capture group and its position in the table.',
      'Switch to Replace to preview $1, $<name> and $& substitutions.',
      'Click a cheat-sheet token to insert it at the cursor.',
    ],
    useCases: [
      'Pulling IDs, emails or timestamps out of log lines',
      'Checking a validation pattern before it ships in a form',
      'Writing a search-and-replace for a refactor',
      'Finding out why a pattern hangs on some inputs',
    ],
    faq: [
      {
        q: 'Which regex flavour does this tester use?',
        a: 'JavaScript (ECMAScript), in your own browser. Results match Node.js and other JavaScript runtimes. PCRE, Python and Java share most syntax but differ in features such as possessive quantifiers, atomic groups and named-group syntax.',
      },
      {
        q: 'What does the d flag do?',
        a: 'It makes the engine record the start and end index of every capture group (match.indices). The group table here uses it to show where each group matched.',
      },
      {
        q: 'Why does my pattern time out?',
        a: 'It is backtracking catastrophically: nested or overlapping quantifiers such as (a+)+ or (\\w|\\d)* try exponentially many combinations on an input that almost matches. Rewrite it so each character can be matched only one way.',
      },
      {
        q: 'How do I use a capture group in the replacement?',
        a: 'Write $1, $2… for numbered groups, $<name> for named groups, $& for the whole match and $$ for a literal dollar sign.',
      },
      {
        q: 'Is my test text sent anywhere?',
        a: 'No. The pattern runs in a Web Worker inside this tab, and nothing you type leaves your browser.',
      },
    ],
  },
}
