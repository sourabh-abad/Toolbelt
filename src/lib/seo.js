import springPages from '../content/spring.js'
import jwtPages from '../content/jwt.js'
import idPages from '../content/ids.js'
import timePages from '../content/time.js'
import formatPages from '../content/formats.js'
import encodingPages from '../content/encoding.js'
export const SITE_NAME = 'DevPocket'
export const SITE_ORIGIN = 'https://devpocket.in'

// One entry per route. `title` is what search engines show as the blue link,
// `description` is the grey snippet under it (~155 chars is the display cap).
// `blurb` is real copy rendered on the page — crawlers rank text, not widgets.
export const SEO = {
  '/': {
    title: 'DevPocket — Free Private Developer Tools: JSON, JWT, Base64, Regex',
    description:
      'Format JSON, decode JWTs, generate UUIDs, test regex and convert timestamps — free developer tools that run in your browser. No signup, no uploads.',
    heading: 'Developer tools that stay in your browser',
    // The homepage h1 already says `heading`; the footer needs its own line.
    footerHeading: 'What DevPocket is',
    aboutLabel: 'DevPocket',
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
        a: 'Yes. After your first visit a service worker keeps a copy of every tool\u2019s code in your browser, so DevPocket opens and works with no connection at all. You can also install it as an app from your browser\u2019s address bar. The cache holds the site\u2019s own files only, never anything you type.',
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
  },
  '/codegen': {
    related: [
      ['/json-schema-generator', 'Describe the same payload as a JSON Schema instead'],
      ['/json-formatter', 'Tidy the sample JSON before generating types'],
      ['/case-converter', 'Rename fields to your language’s naming convention'],
      ['/mock', 'Generate sample payloads to test the models'],
      ['/csv-to-json', 'Turn a CSV export into JSON to generate types from'],
    ],
    title: 'JSON to TypeScript, Go, Java, C# & Python Types | DevPocket',
    description:
      'Convert JSON to a Java object, TypeScript interface, Go struct, Python dataclass or C# class. Paste a payload, pick a language, copy the model.',
    heading: 'JSON to Code: Types and Models',
    aboutLabel: 'the JSON to code generator',
    deepDive: {
      heading: 'Generating a Java class, TypeScript interface or Go struct from a payload',
      body: [
        'Paste a JSON response and pick a target — Java with or without Lombok, TypeScript, Go, Python or C# — and the generator walks the payload, names a type for each nested object, and emits the model. It is the fastest way to stop hand-typing a DTO from an API you are integrating against; if the payload is minified, [format the sample JSON](/json-formatter) first so you can check it.',
        'Like any inference from a single sample, it is right about the shape and guessing about everything else. The list below is what to check before the generated class goes anywhere near production. When you need a contract rather than classes, [generate a JSON Schema](/json-schema-generator) from the same sample.',
      ],
      example: {
        inputLabel: 'JSON',
        input: `{
  "order_id": 9007199254740993,
  "placed_at": "2026-09-15T09:00:00Z",
  "total": 12,
  "items": [],
  "customer": {
    "id": 41,
    "email": "ada@example.com"
  }
}`,
        outputLabel: 'Java (Lombok)',
        output: `@Data
public class Order {
    private Long orderId;
    private String placedAt;
    private Integer total;
    private List<Object> items;
    private Customer customer;
}

@Data
public class Customer {
    private Integer id;
    private String email;
}`,
        note: 'Three fields in that class need a human: orderId needs @JsonProperty("order_id") because the name was rewritten, placedAt is really an Instant, and total is an Integer only because this sample had no decimal point.',
      },
      gotchas: [
        {
          title: 'Renamed fields stop deserialising',
          detail: 'order_id is not a legal Java field name in the house style, so it becomes orderId — and Jackson then looks for a JSON key called orderId. Keep an @JsonProperty annotation, or configure a snake_case naming strategy globally.',
        },
        {
          title: 'One sample cannot tell optional from required',
          detail: 'A field absent from your sample does not exist in the generated class, and the first response that includes it is silently dropped. Generate from the fullest payload you have, not the tidiest one.',
        },
        {
          title: 'Large integers do not fit a double',
          detail: 'An ID above 2^53 loses precision the moment it passes through a JavaScript number or a float field. Type it as Long, or as a String if the API sends it as one.',
        },
        {
          title: 'Whole numbers become integers',
          detail: 'A total of 12 in the sample produces Integer; the first 12.50 then fails to parse. Money should be BigDecimal in Java and a string in TypeScript, never a float.',
        },
        {
          title: 'Dates are strings until you say otherwise',
          detail: 'Nothing in JSON marks a timestamp. Every generator emits String for an ISO-8601 value; swapping it for Instant, OffsetDateTime or Date is a manual step, and forgetting it is why timezone bugs surface weeks later.',
        },
        {
          title: 'Empty and mixed arrays have no element type',
          detail: '[] gives List<Object>, and [1, "a"] has no clean typed representation at all. Supply a sample with a populated, homogeneous array, or write that member by hand.',
        },
      ],
    },
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
  },
  '/sql': {
    related: [
      ['/sql-guide', 'Look up the syntax for the query you are formatting'],
      ['/diff', 'Compare two versions of a query'],
      ['/mock', 'Generate INSERT statements full of test data'],
      ['/case-converter', 'Convert column names between snake_case and camelCase'],
    ],
    title: 'SQL Formatter & Beautifier — 11 Dialects | DevPocket',
    description:
      'Format and beautify SQL online for PostgreSQL, MySQL, T-SQL, Oracle, BigQuery, Snowflake, SQLite and more. Also minifies queries. Free and browser-based.',
    heading: 'SQL formatter and beautifier',
    aboutLabel: 'the SQL formatter',
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
  },
  '/sql-guide': {
    related: [
      ['/sql', 'Format a query you copied from the guide'],
      ['/docker-guide', 'Run a database in a container to practise on'],
      ['/http', 'The other reference: status codes and headers'],
      ['/uuid-v7-generator', 'Choose a primary-key format for a new table'],
      ['/timestamp', 'Convert epoch columns to readable dates'],
    ],
    title: 'SQL Query Guide \u2014 Syntax, Recipes & Gotchas | DevPocket',
    description:
      'Search 117 SQL queries with runnable examples: joins, window functions, CTEs, upserts, indexing and the traps that return wrong results. Free to use.',
    heading: 'SQL query guide and searchable reference',
    aboutLabel: 'the SQL query guide',
    blurb:
      'A searchable catalogue of the SQL you actually write: the syntax reference (joins, GROUP BY, window functions, CTEs, DDL, transactions), the recipes that keep coming back (find duplicates, top N per group, running totals, keyset pagination, gaps and islands) and the pitfalls that return a plausible wrong answer rather than an error. Every entry carries a syntax skeleton, a runnable example against one small schema, the gotchas, and dialect notes for PostgreSQL, MySQL, SQL Server and Oracle wherever the syntax differs.',
    howItWorks: [
      'Type what you are trying to do \u2014 duplicate, latest per user, upsert, pagination \u2014 or browse a category.',
      'Search covers titles, summaries, tags, examples and notes, so a keyword from the query text finds the entry too.',
      'Open an entry for its syntax, a runnable example, what it does, the traps, and the dialect differences.',
      'Copy the example with one click, or copy the link \u2014 every entry is its own URL you can paste into a review.',
    ],
    useCases: [
      'Remembering the exact syntax for an upsert or a window frame mid-task',
      'Finding the standard query for duplicates, top N per group or a running total',
      'Checking why a LEFT JOIN quietly dropped rows, or why NOT IN returned nothing',
      'Looking up how a query differs between PostgreSQL, MySQL, SQL Server and Oracle',
    ],
    faq: [
      {
        q: 'Which SQL dialect do the examples use?',
        a: 'They are written in standard SQL, leaning on PostgreSQL syntax where the standard is ambiguous. Entries whose syntax genuinely differs carry dialect notes for PostgreSQL, MySQL, SQL Server, Oracle and SQLite.',
      },
      {
        q: 'Can I link to a single entry?',
        a: 'Yes. Selecting an entry puts its id in the URL, so the link you paste into a pull request or a chat opens on the same entry, with the same search and category filter.',
      },
      {
        q: 'Do the examples run as written?',
        a: 'They target one small sample schema \u2014 users, orders, order_items and products, shown on the page \u2014 so they read as one coherent database. Swap in your own table and column names.',
      },
      {
        q: 'How is this different from the SQL Formatter?',
        a: 'The formatter pretty-prints a query you already have. This page is the reference for writing one. They sit next to each other in the menu.',
      },
    ],
  },
  '/docker-guide': {
    related: [
      ['/yaml', 'Validate a docker-compose.yml before deploying'],
      ['/json-to-yaml', 'Turn a JSON config into Compose YAML'],
      ['/cron', 'Schedule container jobs with a cron expression'],
      ['/http', 'Decode the status codes your containerised API returns'],
      ['/sql-guide', 'Query the database running in your container'],
    ],
    title: 'Docker & Swarm Command Guide with Examples | DevPocket',
    description:
      'Search 106 Docker and Swarm commands with real examples: build, run, exec, volumes, networks, Compose, services, stacks and secrets. Free, no signup.',
    heading: 'Docker and Docker Swarm command guide',
    aboutLabel: 'the Docker and Swarm guide',
    blurb:
      'A searchable catalogue of the Docker you actually type: building and shipping images, running and debugging containers, the Dockerfile instructions and what each one costs, volumes and networks, Compose, and the Swarm half \u2014 services, rolling updates, stacks, secrets, placement and the errors that come with them. Every entry carries the command, an example against one small sample system, what it does, the gotchas, and the related commands worth knowing next.',
    howItWorks: [
      'Type what you are trying to do \u2014 drain, rolling update, secret, overlay, prune \u2014 or browse a category.',
      'Search covers titles, summaries, tags, examples and notes, so a flag you half-remember finds the entry.',
      'Open an entry for the command, a runnable example, what it does, the traps, and the related commands.',
      'Copy the example with one click, or copy the link \u2014 every entry is its own URL you can paste into a runbook.',
    ],
    useCases: [
      'Remembering the exact flags for a rolling update or a placement constraint',
      'Working out why a Swarm service sits at 0/3 and will not converge',
      'Getting a private image to pull on every node instead of just the manager',
      'Checking what stack deploy ignores from a compose file before a deploy',
    ],
    faq: [
      {
        q: 'Does it cover Docker Swarm as well as plain Docker?',
        a: 'Yes \u2014 about half the entries are Swarm: cluster setup and quorum, services, scaling, rolling updates and rollbacks, stacks, secrets and configs, placement, and the diagnostics for tasks that will not start.',
      },
      {
        q: 'Are the examples safe to paste?',
        a: 'They target one small sample system (an app image, a database, a five-node swarm) shown on the page. Read them before running \u2014 several entries deliberately show destructive commands, like prune and stack rm, with what they take with them.',
      },
      {
        q: 'Is this Compose v1 or v2?',
        a: 'v2: the commands are written as docker compose, not docker-compose. Where Compose and stack deploy differ, the entry says which keys each one ignores.',
      },
      {
        q: 'Why does it not cover Kubernetes?',
        a: 'Because Swarm is what this guide is about. The two solve similar problems with different vocabulary, and mixing them in one reference helps nobody.',
      },
    ],
  },
  '/yaml': {
    related: [
      ['/yaml-to-json', 'See the YAML as JSON to check its types'],
      ['/json-to-yaml', 'Convert JSON into YAML'],
      ['/properties-to-yaml', 'Convert Spring .properties to YAML'],
      ['/docker-guide', 'Commands for the Compose file you are editing'],
      ['/diff', 'Compare two YAML files line by line'],
      ['/xml-formatter', 'Format XML config files as well'],
    ],
    title: 'YAML Formatter, Validator & Comment Remover | DevPocket',
    description:
      'Format and validate YAML online, strip every # comment, fix tab indentation and collapse to one line. Runs in your browser \u2014 nothing is uploaded.',
    heading: 'YAML formatter, validator and comment remover',
    aboutLabel: 'the YAML formatter',
    blurb:
      'Paste YAML to re-emit it with consistent indentation, quoting and wrapping, or to tidy the whitespace without touching a single comment. A separate action strips every # comment \u2014 correctly, leaving the hashes that live inside quoted strings, URLs and block scalars alone. Validation runs as you type and reports the exact line and column, plus a count of documents, keys, depth, comments, anchors and aliases, and a warning when tabs have crept into the indentation.',
    howItWorks: [
      'Paste a YAML file \u2014 a single document or several separated by ---.',
      'Validation runs as you type: the line and column of any syntax error, or a summary of the document.',
      'Format reparses and re-emits with your indent, wrap, quoting and sorting options. Tidy fixes whitespace and tabs without touching comments.',
      'Remove comments strips every # comment and leaves the rest of the file byte for byte as it was. Copy the result, or send it back to the editor to run another action.',
    ],
    useCases: [
      'Cleaning a hand-edited Kubernetes or Compose file before committing it',
      'Stripping the commentary out of a config before pasting it into a ticket',
      'Finding the line a "bad indentation" error is really talking about',
      'Fixing an editor that inserted tabs into a YAML file',
    ],
    faq: [
      {
        q: 'Why does Format lose my comments?',
        a: 'Because Format parses the document and writes it out again, and the YAML parser does not keep comments. Tidy is the comment-preserving option: it only touches whitespace, tabs and blank lines.',
      },
      {
        q: 'Will Remove comments break a string containing a #?',
        a: 'No. A # only starts a comment at the start of a line or after a space, and never inside quotes or a block scalar, so a URL fragment, a "50% # done" string and a shell script in a | block all survive intact.',
      },
      {
        q: 'Does it handle multi-document files?',
        a: 'Yes. Documents separated by --- are validated and re-emitted individually, which is what Kubernetes manifests usually look like.',
      },
      {
        q: 'What happens to anchors and aliases?',
        a: 'They are kept by default. Tick "Expand anchors" to resolve them and write the values out in full, which is useful when you want to see what a merge key actually produced.',
      },
    ],
  },
  '/properties': {
    related: [
      ['/properties-compare', 'Compare two environments’ .properties files'],
      ['/properties-to-yaml', 'Convert the file to application.yml'],
      ['/yaml-to-properties', 'Flatten an application.yml into .properties'],
      ['/case-converter', 'Rename keys between kebab-case and camelCase'],
      ['/json-unflatten', 'Nest dotted keys from any flat JSON object'],
    ],
    title: 'Properties Viewer, Key List & YAML Converter | DevPocket',
    description:
      'Read a .properties file, list every key, spot duplicate and empty values, and convert it to YAML or JSON. Runs in your browser — nothing is uploaded.',
    heading: 'Properties file viewer, key list and converter',
    aboutLabel: 'the .properties viewer',
    blurb:
      'Paste a Java or Spring .properties file to see it highlighted, tidied and explained. The viewer normalises separators and ordering without losing your comments, the key list shows every key with its value, line number and whether it is duplicated, empty, padded with invisible whitespace or pointing at a ${…} placeholder nothing defines, and the converter turns dotted keys into nested YAML or JSON and back again.',
    deepDive: {
      heading: 'The parts of a .properties file that bite',
      body: [
        'A .properties file looks like a list of key=value pairs and is parsed by rules most editors do not implement. Three characters separate a key from its value, two start a comment, a backslash at the end of a line joins the next one, and a key defined twice is not an error — the last one silently wins. To move the file to YAML with those rules applied, use the [properties to YAML converter](/properties-to-yaml).',
        'Every one of those rules is behind a bug someone has spent an afternoon on. Here is what the parser actually does with your file.',
      ],
      example: {
        inputLabel: '.properties',
        input: `# the sale override
server.port=8080
db.url:jdbc\\:mysql://db/shop
timeout 30
banner=  spaced out
colour=#ff0000
hosts=a,\\
  b
server.port=9090`,
        outputLabel: 'What loads',
        output: `server.port   = 9090
db.url        = jdbc:mysql://db/shop
timeout       = 30
banner        = "  spaced out"
colour        = #ff0000
hosts         = a,b

7 lines, 6 keys — server.port
is defined twice and the first
value never reaches the app.`,
        note: 'Note what did NOT happen: the # in the colour value is not a comment, the escaped colon in the JDBC URL stayed in the value instead of splitting the key, and the leading spaces in banner survived because only a trailing space is stripped.',
      },
      table: {
        caption: 'The syntax rules a .properties parser applies, in the order they surprise people',
        columns: ['Written as', 'Parsed as', 'Why it matters'],
        rows: [
          ['a=1, a:1, a 1', 'The same entry', 'All three separate a key from a value. A space is a separator only when no = or : follows it.'],
          ['# note and ! note', 'Comments', 'Only at the start of a line. A # anywhere else — a hex colour, a URL fragment — is part of the value.'],
          ['key\\ with\\ spaces=1', 'One key containing spaces', 'A backslash escapes the character after it, which is the only way a key can hold a space, = or :.'],
          ['url=jdbc\\:mysql://h/db', 'jdbc:mysql://h/db', 'Colons in a value need no escape; the one in the key does, and generated files often escape both.'],
          ['value=a,\\ (newline) b', 'a,b', 'A trailing backslash continues the line and the next line’s leading whitespace is dropped.'],
          ['a=1 then a=2', 'a is 2', 'Not an error, not a warning. The last definition wins and the earlier one is unreachable.'],
          ['msg=caf\\u00e9', 'café', 'Properties files are ISO-8859-1 by default in older Java, so non-ASCII is escaped as \\uXXXX.'],
        ],
      },
      gotchas: [
        {
          title: 'A duplicated key is the most common production surprise',
          detail: 'Two definitions of server.port do not fail the build, and the one you edited may be the one that is ignored. The viewer flags every repeated key, marks which occurrence wins, and can rewrite the file keeping only that one.',
        },
        {
          title: 'Trailing whitespace is part of the value',
          detail: 'password=hunter2 followed by a space loads as "hunter2 ". No editor shows it and no diff makes it obvious. Values that end in whitespace are called out here.',
        },
        {
          title: 'key= and a missing key are different things',
          detail: 'An empty value is a defined empty string, so a @Value default or a getProperty fallback never fires. If you want the default, remove the line rather than clearing it.',
        },
        {
          title: '${other.key} is resolved by Spring, not by the file',
          detail: 'Plain java.util.Properties does no substitution at all, and Spring fails to start when a placeholder resolves to nothing. Every ${…} in the file is listed with whether this file defines it or supplies a ${key:default}.',
        },
        {
          title: 'Converting to YAML has to guess at types',
          detail: 'Everything in a .properties file is a string. 8080 becomes a number and true becomes a boolean in YAML, which is usually what you want and is occasionally wrong — a version like 1.20 becomes 1.2. Turn the inference off when the values must stay strings.',
        },
        {
          title: 'A key cannot be both a value and a branch',
          detail: 'a=1 and a.b=2 are fine side by side in properties and impossible in YAML, where a would have to be a scalar and a map at once. Those keys are kept flat and listed rather than one of them being dropped.',
        },
      ],
    },
    howItWorks: [
      'Paste a .properties file into the editor. It is parsed as you type — separators, escapes, line continuations and all.',
      'View and clean rewrites it with one separator style, in file or alphabetical order, optionally dropping duplicate keys and keeping every comment with the entry it belongs to.',
      'Keys lists every key with its value and line, filtered by duplicated, empty, padded or placeholder-using, and copies the names on their own.',
      'Convert turns dotted keys into nested YAML or JSON — and YAML or JSON back into properties — with array positions written as key[0].',
    ],
    useCases: [
      'Finding why a setting is ignored, when the same key is defined twice in one file',
      'Listing every key in a config to check against the documentation or a test',
      'Migrating an application.properties to application.yml without hand-indenting it',
      'Turning a YAML config back into properties for a service that only reads them',
    ],
    faq: [
      {
        q: 'Which key wins when the file defines one twice?',
        a: 'The last one, which is what java.util.Properties does when it loads the file. Duplicates are flagged with the lines they are on, and "Keep the last" rewrites the file to contain only the values that actually load.',
      },
      {
        q: 'Does it understand escapes and line continuations?',
        a: 'Yes. \\n, \\t, \\uXXXX and escaped separators are decoded, and a line ending in an odd number of backslashes is joined with the next one before anything else looks at it.',
      },
      {
        q: 'Are my comments lost when I reformat?',
        a: 'No. A comment stays with the entry below it, so it follows that entry even when the file is sorted alphabetically. A comment followed by a blank line is treated as a section header and stays where it is. You can also drop all comments deliberately.',
      },
      {
        q: 'How are dotted keys converted to YAML?',
        a: 'server.port becomes a nested port under server, and indexed keys like hosts[0] become a YAML list. You can switch nesting off to get one flat YAML key per line, which is useful when the dots are part of the name rather than a hierarchy.',
      },
      {
        q: 'Can I compare two properties files?',
        a: 'Yes — that is the Properties Compare page. It parses both files and reports the keys only one side defines and the values that differ, instead of diffing them line by line.',
      },
      {
        q: 'Is anything uploaded?',
        a: 'No. The file is parsed in your own tab, which is what makes it safe to paste a config containing connection strings or credentials.',
      },
    ],
  },
  '/properties-compare': {
    related: [
      ['/properties', 'Inspect one file for duplicates and stray whitespace'],
      ['/diff', 'Compare any two text files line by line'],
      ['/yaml-to-properties', 'Flatten YAML first to compare it with .properties'],
      ['/properties-to-yaml', 'Convert the reconciled file to YAML'],
    ],
    title: 'Compare .properties Files — Key & Value Diff | DevPocket',
    description:
      'Diff two .properties files by key and value: missing keys, changed values, identical ones hidden. Ideal for dev vs prod configs. Nothing is uploaded.',
    heading: 'Compare two .properties files',
    aboutLabel: 'the .properties comparer',
    blurb:
      'A text diff of two config files tells you the lines differ; this tells you which settings differ. Both files are parsed into keys and values first, so a reordered file, a changed separator or a moved comment produces no noise at all — what is left is the keys only one side defines and the values that changed. Copy the missing entries straight out as properties to paste into the file that is short of them.',
    deepDive: {
      heading: 'Why a text diff is the wrong tool for two config files',
      body: [
        'Environment configs drift in two ways that matter — a key one file has and the other does not, and a key both have with different values — and in several that do not: order, separator style, comments, whitespace. A line diff cannot tell those apart, so the real differences arrive buried in false ones — which is why a general [line-by-line diff checker](/diff) is the wrong tool here.',
        'Comparing the parsed keys instead removes every difference that a properties loader would also ignore. To check a single file for duplicates first, open it in the [Properties Viewer](/properties).',
      ],
      example: {
        inputLabel: 'What a line diff reports',
        input: `- logging.level.root=DEBUG
- cache.ttl.seconds=60
- spring.jpa.show-sql=true
- dev.only.toggle=on
- server.port = 8080
+ server.port=8080
+ spring.jpa.show-sql=false
+ cache.ttl.seconds=300
+ logging.level.root=WARN
+ prod.only.replicas=4

9 changed lines`,
        outputLabel: 'What actually differs',
        output: `differs   logging.level.root
          DEBUG → WARN
differs   cache.ttl.seconds
          60 → 300
differs   spring.jpa.show-sql
          true → false
only in A dev.only.toggle
only in B prod.only.replicas

3 changed, 1 missing each way
server.port is identical`,
        note: 'server.port appears in the line diff only because one file writes it with spaces around the =. The key comparison drops it, and the reordering, on the floor.',
      },
      gotchas: [
        {
          title: 'Only-in-A is usually the interesting half',
          detail: 'A key the production file is missing falls back to a default nobody chose. A key only production has is normally deliberate. The two directions are counted and copied separately for exactly that reason.',
        },
        {
          title: 'A duplicated key is compared on the value that wins',
          detail: 'If one file defines a key twice, the comparison uses the last definition — the one that loads — rather than reporting a difference against a value the application never sees.',
        },
        {
          title: 'Invisible differences look like phantom changes',
          detail: 'A value with a trailing space differs from one without, and so does True against true. Both are real to a properties loader, so they are reported by default — switch on "ignore surrounding spaces" or "ignore case" when you know they do not matter.',
        },
        {
          title: 'Empty is not missing',
          detail: 'password= in one file and no password line in the other are different states: the first defines an empty string, the second leaves the setting undefined. They are shown as "empty" and "—" rather than being treated as the same thing.',
        },
      ],
    },
    howItWorks: [
      'Paste one file into each side — dev and prod, before and after, your file and a teammate’s.',
      'Both are parsed into keys and values, so ordering, separator style and comments never show up as differences.',
      'Every key is marked differs, only in A, only in B or identical, with the counts at the top and a filter for each.',
      'Copy the entries one side is missing straight out as .properties text, or the changed values as a two-column report.',
    ],
    useCases: [
      'Checking an application-prod.properties against application.properties before a release',
      'Finding the setting that differs between a machine where it works and one where it does not',
      'Reviewing a config change without reading a diff full of reordered lines',
      'Auditing what a new environment file is still missing',
    ],
    faq: [
      {
        q: 'How is this different from the text diff checker?',
        a: 'The diff checker compares lines. This parses both files first, so reordering, a = changed to a :, added comments and changed indentation produce no differences at all — only keys and values do.',
      },
      {
        q: 'What happens if a key is defined twice in one file?',
        a: 'The comparison uses the last definition, matching what java.util.Properties loads. The properties viewer is the page that flags duplicates themselves.',
      },
      {
        q: 'Can I get the missing entries out as a file?',
        a: 'Yes — "Copy A → B gaps" gives you every entry A has and B does not, already written as key=value lines ready to paste into B, and the other button does the reverse.',
      },
      {
        q: 'Are the two files uploaded anywhere?',
        a: 'No. Both are parsed in your browser, so comparing a production config with a local one does not send either to a server.',
      },
    ],
  },
  '/diff': {
    related: [
      ['/json-sort-keys', 'Sort keys so a JSON diff shows only real changes'],
      ['/json-formatter', 'Format both JSON documents before comparing'],
      ['/properties-compare', 'Compare .properties files by key, not by line'],
      ['/regex-tester', 'Test the pattern behind a search-and-replace'],
      ['/markdown', 'Preview a README after the change'],
      ['/xml-formatter', 'Pretty-print XML so a diff lines up'],
    ],
    title: 'Diff Checker — Compare Text & Code Online, Privately | DevPocket',
    description:
      'Compare two blocks of text or code line by line or word by word. Highlights additions and deletions with a change count. Free, private, in your browser.',
    heading: 'Diff Checker (Text Compare)',
    aboutLabel: 'the diff checker',
    deepDive: {
      heading: 'When a diff lies to you',
      body: [
        'A line diff finds the longest common subsequence of lines and calls everything else an addition or a deletion. That model is exactly right for source code and exactly wrong for several common situations, and knowing which is which saves a lot of time staring at a wall of red. For JSON, [sort the keys of both documents](/json-sort-keys) first so only real changes show.',
        'Word-level comparison helps for prose and for single-line changes; it does not help when the underlying problem is that the two files differ in ways you cannot see. For config files, [compare .properties by key](/properties-compare) instead of by line.',
      ],
      example: {
        inputLabel: 'Symptom',
        input: `Every single line shows as changed

A formatter ran and the real change
is invisible

A block moved 200 lines down

Two names look identical but differ`,
        outputLabel: 'Usual cause',
        output: `Line endings (CRLF vs LF) or trailing
whitespace — not content

Diff the parsed structure instead:
sort the JSON keys, then compare

LCS has no concept of a move; it is
a delete plus an insert

Unicode: e + combining accent versus
the single precomposed character`,
      },
      gotchas: [
        {
          title: 'Line endings make everything look changed',
          detail: 'A file saved on Windows and a file saved on macOS differ on every line by one invisible byte. If the whole file lights up after someone else edits it, check CRLF before you read a single line of the diff.',
        },
        {
          title: 'Reformatting hides real changes',
          detail: 'Run a formatter and a one-character logic change is buried in 400 reflowed lines. For JSON and YAML, normalise first — sort the keys, then diff — so the comparison is about content rather than layout.',
        },
        {
          title: 'Moves are invisible to the algorithm',
          detail: 'LCS produces a deletion here and an insertion there. A refactor that reorders functions therefore reads as a rewrite, which is why reviewers ask for moves and edits in separate commits.',
        },
        {
          title: 'Word diff is right for prose, wrong for code',
          detail: 'Word-level highlighting is much easier to read in a paragraph. In code it fragments — a renamed variable lights up every occurrence in the middle of lines and you lose the shape of the change.',
        },
        {
          title: 'Equal-looking text can differ in bytes',
          detail: 'Non-breaking spaces pasted from a document, smart quotes from a word processor, and two Unicode spellings of an accented character all render identically and compare as different. If a diff insists two identical lines differ, that is why.',
        },
        {
          title: 'Whitespace-only noise buries the signal',
          detail: 'Indentation changes, tabs converted to spaces and stripped trailing whitespace can account for most of a diff. Compare with whitespace ignored first to see whether anything real happened, then look properly.',
        },
      ],
    },
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
  },
  '/color': {
    related: [
      ['/number-base', 'Convert other hex values to decimal and binary'],
      ['/html-entities', 'Escape characters for HTML and CSS content'],
      ['/lorem', 'Fill a mock-up with placeholder text'],
      ['/markdown', 'Preview a style guide as you write it'],
    ],
    title: 'Color Converter — HEX to RGB, HSL & px to rem | DevPocket',
    description:
      'Convert colors between HEX, RGB and HSL with a live picker, and convert CSS units between px, rem, em and pt using any root font size. Free and offline.',
    heading: 'Color and CSS Unit Converter',
    aboutLabel: 'the color and CSS unit converter',
    deepDive: {
      heading: 'Why two colors with the same lightness look nothing alike',
      body: [
        'HEX, RGB and HSL are three spellings of the same sRGB color (colour, if you write British English) — converting between them changes nothing but the notation. HSL is easier to reason about because hue, saturation and lightness map to words, but its lightness channel is a geometric construct, not a measure of how bright a color looks. A hex color is also just a number — the [number base converter](/number-base) shows #FF8800 as decimal and binary.',
        'Pure yellow and pure blue are both hsl(… 100% 50%). One is nearly unreadable on white and the other is nearly unreadable on black. That is why accessibility rules are written in contrast ratios, which are computed from relative luminance, rather than in anything you can read off an HSL value.',
      ],
      example: {
        inputLabel: 'Same lightness',
        input: `hsl(60 100% 50%)   yellow
hsl(240 100% 50%)  blue`,
        outputLabel: 'Contrast against white',
        output: `yellow  1.07 : 1   fails everything
blue    8.59 : 1   passes AAA

WCAG needs 4.5:1 for body text,
3:1 for large text and UI borders.`,
      },
      table: {
        caption: 'CSS length units and what each one is relative to',
        columns: ['Unit', 'Relative to', 'Use it for'],
        rows: [
          [
            'px',
            'Nothing — a fixed device pixel',
            'Borders and shadows; not font sizes',
          ],
          [
            'rem',
            'The root font size',
            'Almost everything: type, spacing, breakpoints',
          ],
          [
            'em',
            'The font size of the element itself',
            'Padding that should scale with its own text',
          ],
          ['pt', '1/72 inch', 'Print stylesheets only'],
          ['%', 'The parent value for that property', 'Widths and line heights'],
        ],
      },
      gotchas: [
        {
          title: 'HSL lightness is not perceived brightness',
          detail: 'Picking a palette by holding lightness constant gives you colors that look wildly uneven. OKLCH was designed to fix exactly this, and is worth reaching for when a palette has to look consistent.',
        },
        {
          title: 'em compounds, rem does not',
          detail: 'Nested elements each multiply their parent, so 0.9em three levels deep is 0.73 of the base. rem is always measured from the root, which is why it is the safer default for type scales.',
        },
        {
          title: 'The 62.5% trick breaks user settings',
          detail: 'Setting html { font-size: 62.5% } to make 1rem equal 10px overrides the font size the user chose in their browser. It makes the arithmetic nicer and the site less accessible.',
        },
        {
          title: 'px ignores the reader entirely',
          detail: 'A font size in px does not respond to the browser font-size setting, which is the main accessibility control people with low vision actually use. Use rem for anything textual.',
        },
        {
          title: 'Round-tripping shifts values',
          detail: 'HEX stores 8 bits per channel; HSL is computed in floats. HEX to HSL and back can land one step away from where it started, which is why a color pasted between two tools sometimes stops matching the brand value exactly.',
        },
        {
          title: 'A translucent color is not one color',
          detail: '#00000080 over white and over a photo are two different results. If a value has to meet a contrast ratio, compute it against the actual background, not against the swatch.',
        },
      ],
    },
    blurb:
      'Pick a color or paste a value and read it back in HEX, RGB and HSL, with every field editable so you can nudge a hue or lightness and see the others follow. The CSS unit converter turns pixels into rem, em and pt against whatever root font size your project uses — handy when translating a design handoff into stylesheet values.',
    howItWorks: [
      'Pick a color with the picker, or paste a HEX, RGB or HSL value.',
      'All three representations update together, and each field stays editable so you can nudge one and watch the others follow.',
      'For CSS units, enter a value and the root font size your project uses.',
      'Copy the representation you need.',
    ],
    useCases: [
      'Translating a HEX value from a design handoff into the HSL your stylesheet uses',
      'Adjusting lightness or saturation to derive a hover state from a base color',
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
        a: 'The picker works with opaque colors. For a translucent variant, take the RGB values and add the alpha channel yourself as rgba() or an eight-digit HEX.',
      },
    ],
  },
  '/markdown': {
    related: [
      ['/html-entities', 'Escape characters Markdown would render as HTML'],
      ['/lorem', 'Fill a draft with placeholder paragraphs'],
      ['/diff', 'Compare two versions of a README'],
      ['/json-formatter', 'Format a JSON example before pasting it into docs'],
      ['/color', 'Pick and convert colors for diagrams and badges'],
    ],
    // The editor wants the viewport; the copy below it renders collapsed.
    title: 'Markdown Preview — Live GitHub-Flavoured Editor | DevPocket',
    description:
      'Live Markdown preview with GitHub-flavoured tables, task lists, highlighted code and Mermaid diagrams. Copy the HTML or download it as a file.',
    heading: 'Markdown live preview',
    aboutLabel: 'the Markdown preview',
    deepDive: {
      heading: 'Which Markdown, exactly',
      body: [
        '"Markdown" is not one format. CommonMark is the specification that settled the ambiguities in the 2004 original; GitHub-flavoured Markdown adds tables, task lists, strikethrough and autolinks on top of it; and every renderer adds its own extras. This preview renders GitHub-flavoured Markdown, plus Mermaid diagrams and maths, which is the combination most developer documentation is written in. To show literal tags in a document, [escape them as HTML entities](/html-entities).',
        'Most "my Markdown looks wrong" problems are a mismatch between the flavour you wrote and the flavour that rendered it. When a README changes, [compare the two versions](/diff) to see exactly what moved.',
      ],
      example: {
        inputLabel: 'Source',
        input: `A line
and another line

| Tool | Runs |
| ---- | ---- |
| JSON | yes  |

- item
    - nested?

snake_case_name`,
        outputLabel: 'What renders',
        output: `One paragraph, not two lines — in
CommonMark a single newline is a
space, not a break

A real table, because the ---- row
is present

Four spaces made a code block, not
a nested list item: two is enough

Stays literal in GFM; older parsers
italicise the middle`,
      },
      gotchas: [
        {
          title: 'A single newline is not a line break',
          detail: 'In CommonMark, consecutive lines join into one paragraph. You need two trailing spaces, a backslash, or a blank line. GitHub breaks on a single newline inside issues and comments but not in .md files, which is why the same text renders differently in two places on the same site.',
        },
        {
          title: 'A table without the separator row is a paragraph',
          detail: 'The | --- | --- | line is what makes it a table. Omit it and you get pipes on screen, which is the single most common broken table.',
        },
        {
          title: 'Four spaces of indent means code',
          detail: 'Indent a list item by four spaces and it becomes a code block instead of a nested item. Two or three spaces is the safe nesting indent, and this is why pasted, re-indented lists sometimes turn grey.',
        },
        {
          title: 'Underscores inside identifiers',
          detail: 'GFM leaves snake_case_name alone, but plenty of older renderers treat the inner underscores as emphasis. Wrap identifiers in backticks and the question never arises.',
        },
        {
          title: 'Raw HTML is allowed and then stripped',
          detail: 'The spec permits inline HTML, and most hosted renderers sanitise it away — GitHub removes style, script and most attributes. Anything that depends on raw HTML will render in your editor and vanish in production.',
        },
        {
          title: 'Mermaid and maths are renderer features',
          detail: 'A mermaid code fence is just a fenced code block to a parser that does not know about it, and $...$ maths is plain text. Both work here and on GitHub; neither is guaranteed anywhere else.',
        },
      ],
    },
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
  },
  '/cron': {
    related: [
      ['/timestamp', 'Convert a run time to Unix seconds and back'],
      ['/docker-guide', 'Run scheduled jobs in containers'],
      ['/jwt-decoder', 'Check whether a job’s token expires before it runs'],
      ['/sql-guide', 'Write the query a nightly job runs'],
    ],
    title: 'Cron Expression Generator & Parser — Next Run Times | DevPocket',
    description:
      'Decode any cron expression into plain English and preview the next 8 run times in IST, SAST, UTC or local time. Includes common presets. Free and online.',
    heading: 'Cron Expression Generator and Parser',
    aboutLabel: 'the cron expression parser',
    deepDive: {
      heading: 'The cron rule that catches almost everyone',
      body: [
        'Five fields: minute, hour, day-of-month, month, day-of-week. The trap is what happens when you restrict both day fields at once. When day-of-month and day-of-week are both something other than *, Vixie cron — and therefore Linux, and therefore most schedulers — runs the job when EITHER matches, not both. To turn a run time into the epoch seconds a log shows, use the [Unix timestamp converter](/timestamp).',
        'So 0 0 13 * 5 does not mean "midnight on Friday the 13th". It means midnight on the 13th of every month, and also midnight every Friday. If you want Friday the 13th you need a day-of-week-only schedule plus a date check inside the job.',
      ],
      example: {
        inputLabel: 'Expression',
        input: `30 2 * * 1-5

0 */4 * * *

0 0 13 * 5

15 9 1 * *`,
        outputLabel: 'What it actually does',
        output: `02:30, Monday to Friday

Every 4 hours: 00:00, 04:00, 08:00,
12:00, 16:00, 20:00

Every 13th of the month AND every
Friday — not Friday the 13th

09:15 on the 1st of every month`,
      },
      table: {
        caption: 'Field order and the values each one accepts',
        columns: ['Position', 'Field', 'Range', 'Notes'],
        rows: [
          ['1', 'Minute', '0–59', '*/15 gives :00, :15, :30, :45'],
          ['2', 'Hour', '0–23', '24-hour clock; no AM/PM, no 24'],
          [
            '3',
            'Day of month',
            '1–31',
            'A job set for the 31st skips short months entirely',
          ],
          [
            '4',
            'Month',
            '1–12 or JAN–DEC',
            'Names are case-insensitive but not portable everywhere',
          ],
          ['5', 'Day of week', '0–7 or SUN–SAT', 'Both 0 and 7 mean Sunday'],
        ],
      },
      gotchas: [
        {
          title: 'Daylight saving eats and duplicates jobs',
          detail: 'A job scheduled at 02:30 local time runs twice on the day the clocks go back and not at all on the day they go forward. Anything in the 01:00–03:00 window should run in UTC, or be made idempotent.',
        },
        {
          title: 'Steps do not wrap around the end of a field',
          detail: '*/7 in the day-of-month field restarts at 1 each month, so the gap between the 29th and the next run is not seven days. Steps are only evenly spaced inside a single field cycle.',
        },
        {
          title: 'Five fields or six is a different expression',
          detail: 'Unix cron takes five fields; Quartz, Spring and several cloud schedulers put seconds first and take six or seven. A five-field expression pasted into Spring shifts every field by one and runs at a time you did not ask for.',
        },
        {
          title: 'Cron does not read your shell profile',
          detail: 'No PATH from .bashrc, no nvm, no locale, often no HOME. A script that works in your terminal and silently fails under cron is almost always an absolute-path problem. Log stdout and stderr somewhere you will look.',
        },
        {
          title: 'An overrunning job gets a second copy, not a queue',
          detail: 'If the run takes longer than the interval, cron simply starts another. Wrap the command in flock, or make the job take a lock itself, before you schedule anything every minute.',
        },
        {
          title: 'The weekday abbreviations are not a schedule',
          detail: '0 9 * * 1-5 is weekdays. 0 9 * * 1,5 is Mondays and Fridays. The comma and the dash are one character apart and produce very different on-call weeks.',
        },
      ],
    },
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
  },
  '/http': {
    related: [
      ['/url-parser', 'Split the request URL into its parts'],
      ['/url-encode', 'Encode query values before sending the request'],
      ['/jwt-decoder', 'Decode the bearer token behind a 401'],
      ['/json-formatter', 'Format the response body'],
      ['/cron', 'Schedule a health check against the endpoint'],
      ['/xml-formatter', 'Format a SOAP or XML response body'],
    ],
    title: 'HTTP Status Codes, Methods & Headers | DevPocket',
    description:
      'Searchable reference for HTTP status codes (200, 301, 401, 404, 409, 422, 429, 500), request methods with safe and idempotent flags, and common headers.',
    heading: 'HTTP status code, method and header reference',
    aboutLabel: 'the HTTP reference',
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
  },
  '/mock': {
    related: [
      ['/json-to-csv', 'Export the generated records as a CSV'],
      ['/sql', 'Format the generated INSERT statements'],
      ['/uuid', 'Generate IDs for extra columns'],
      ['/json-schema-generator', 'Describe the generated records as a schema'],
      ['/lorem', 'Longer placeholder text for description fields'],
    ],
    title: 'Mock Data Generator — JSON, CSV & SQL | DevPocket',
    description:
      'Generate realistic fake test data from 21 field types — names, emails, UUIDs, addresses, dates — and export as JSON, CSV or SQL INSERT. Free online.',
    heading: 'Mock and test data generator',
    aboutLabel: 'the mock data generator',
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
  },
  '/json-validator': {
    related: [
      ['/json-formatter', 'Beautify, minify or sort the JSON once it is valid'],
      ['/json-viewer', 'Browse a large document as a tree'],
      ['/json-schema-generator', 'Infer a schema from the validated JSON'],
      ['/jsonpath', 'Pull one field out with a $.path query'],
      ['/json-stats', 'Count nodes and measure nesting depth'],
    ],
    title: 'JSON Validator Online — Tree View & Errors | DevPocket',
    description:
      'Validate JSON online with the exact error line and column, a collapsible tree view, duplicate-key detection and search. Free and browser-based.',
    heading: 'JSON validator and editor',
    aboutLabel: 'the JSON validator',
    deepDive: {
      heading: 'The eight things that actually break JSON',
      body: [
        'Most JSON errors come from writing it the way JavaScript would accept it. JSON is a much smaller language than JavaScript object syntax, and the differences are exactly where people get caught. Below are the ones that account for nearly every parse failure in practice, and three that are worse — they parse cleanly and corrupt your data. Once the document is valid, the [JSON formatter](/json-formatter) re-indents, minifies or sorts it, and [JSONPath](/jsonpath) pulls out a single field.',
      ],
      example: {
        inputLabel: 'Looks fine, is not JSON',
        input: `{
  'name': 'shop-api',   // the service
  "replicas": 3,
  "ratio": .5,
  "limit": Infinity,
  "tags": ["a", "b",],
}`,
        outputLabel: 'Five separate errors',
        output: `Line 2  single-quoted key and value
Line 2  comments are not allowed
Line 4  .5 must be written 0.5
Line 5  Infinity is not a JSON value
Line 6  trailing comma in the array
Line 7  trailing comma in the object`,
      },
      gotchas: [
        {
          title: 'Trailing commas',
          detail: 'Legal in modern JavaScript, illegal in JSON. This is the single most common cause of "Unexpected token }" and it is why a hand-edited config breaks after you delete the last entry.',
        },
        {
          title: 'Single quotes and unquoted keys',
          detail: 'JSON has exactly one string form: double quotes. {name: \'x\'} is a JavaScript object literal, not JSON — which is why copying an object out of your editor and pasting it into a JSON field so often fails.',
        },
        {
          title: 'NaN, Infinity and undefined',
          detail: 'None of them exist in JSON. A serialiser that emits them (some Python and older Java stacks do) produces output that most other parsers reject. JSON.stringify turns them into null, which is its own surprise.',
        },
        {
          title: 'Comments',
          detail: 'Not part of JSON at any version. JSONC and JSON5 are separate formats that some tools accept; a strict parser will not. Strip them before sending.',
        },
        {
          title: 'Duplicate keys parse fine and lose data',
          detail: 'The spec does not forbid them, and nearly every parser keeps the last one. {"id": 1, "id": 2} validates and quietly becomes 2 — a data bug wearing a green tick, not a syntax error.',
        },
        {
          title: 'Large integers lose precision silently',
          detail: 'JSON numbers have no size limit; JavaScript numbers do. An ID like 9007199254740993 parses without error and comes back as 9007199254740992. Send anything above 2^53 as a string.',
        },
        {
          title: 'A byte-order mark at the start of the file',
          detail: 'An invisible BOM makes JSON.parse throw "Unexpected token" pointing at position 0, which is baffling until you hexdump the file. Files written by Windows tools and some spreadsheet exports carry one.',
        },
        {
          title: 'Literal control characters inside strings',
          detail: 'A real newline or tab inside a quoted string is invalid — it has to be escaped as \\\\n or \\\\t. Pasting a multi-line snippet into a JSON string field is the usual cause.',
        },
      ],
    },
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
  },
  '/json-sort-keys': {
    related: [
      ['/diff', 'Compare two documents once their keys are sorted'],
      ['/json-formatter', 'Format or minify after sorting'],
      ['/json-merge', 'Merge documents, then sort the result'],
      ['/json-validator', 'Find duplicate keys that sorting would hide'],
    ],
    title: 'JSON Sort Keys Online — Alphabetise Object Keys | DevPocket',
    description:
      'Sort JSON object keys alphabetically at every nesting level, ascending or descending. Array order is preserved. Free, runs entirely in your browser.',
    heading: 'Sort JSON keys alphabetically',
    aboutLabel: 'sorting JSON keys',
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
  },
  '/json-flatten': {
    related: [
      ['/json-unflatten', 'Rebuild the nested structure from dot keys'],
      ['/json-to-csv', 'Flatten records straight into a CSV'],
      ['/properties', 'Dot-notation keys the .properties way'],
      ['/jsonpath', 'Query nested values without flattening'],
    ],
    title: 'JSON Flattener — Nested JSON to Dot Notation | DevPocket',
    description:
      'Flatten nested JSON into single-level dot-notation keys like a.b[0].c. Useful for config files, feature flags and spreadsheet exports. Free and offline.',
    heading: 'Flatten nested JSON',
    aboutLabel: 'flattening nested JSON',
    deepDive: {
      heading: 'Dot notation, and the two cases where it cannot round-trip',
      body: [
        'Flattening turns a nested document into a single level of key-value pairs, with the path to each leaf joined by dots. It is how you get a JSON config into environment variables, how you turn an API response into CSV columns, and how you make two payloads diffable line by line instead of block by block. For CSV specifically, the [JSON to CSV converter](/json-to-csv) flattens every record and writes the columns in one step.',
        'The operation is lossy in two specific ways, and both bite when you try to [unflatten the keys back into JSON](/json-unflatten) afterwards.',
      ],
      example: {
        inputLabel: 'Nested',
        input: `{
  "service": {
    "name": "shop-api",
    "ports": [8080, 8443],
    "limits": { "cpu": "500m" }
  },
  "tags": [],
  "labels": { "app.kubernetes.io/name": "shop" }
}`,
        outputLabel: 'Flattened',
        output: `{
  "service.name": "shop-api",
  "service.ports.0": 8080,
  "service.ports.1": 8443,
  "service.limits.cpu": "500m",
  "labels.app.kubernetes.io/name": "shop"
}`,
        note: 'Note what happened to the last two keys: "tags": [] produced nothing at all, and the Kubernetes-style label key already contained dots, so its flattened form is indistinguishable from three levels of nesting.',
      },
      gotchas: [
        {
          title: 'A key that already contains a dot becomes ambiguous',
          detail: '{"a.b": 1} and {"a": {"b": 1}} both flatten to "a.b". Nothing downstream can tell them apart, so unflattening picks one and silently changes your data. Kubernetes labels, DNS names and file names hit this constantly — use a separator your keys cannot contain.',
        },
        {
          title: 'Empty arrays and empty objects disappear',
          detail: 'There is no leaf under them, so there is no pair to emit. If the difference between "absent" and "present but empty" matters — and in a config diff it usually does — keep them as an explicit sentinel value.',
        },
        {
          title: 'Array indices become plain keys',
          detail: 'items.0, items.1 are strings, not positions. Delete the middle element of a flattened array and unflattening either leaves a hole or produces an object with numeric keys, depending on the implementation.',
        },
        {
          title: 'Numeric object keys turn into array slots',
          detail: 'A map keyed by year — {"2024": …, "2025": …} — unflattens into a sparse array in naive implementations, because the key looks like an index. Check the round-trip before you rely on it.',
        },
        {
          title: 'Flatten then unflatten is not guaranteed to be the identity',
          detail: 'Given the four points above, treat the round-trip as something to verify rather than assume. If you are using flattening as a transport format, compare the rebuilt document against the original once, on a real payload with real keys.',
        },
      ],
    },
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
  },
  '/json-unflatten': {
    related: [
      ['/json-flatten', 'Flatten nested JSON back to dot keys'],
      ['/csv-to-json', 'Nest dotted CSV headers while converting'],
      ['/properties-to-yaml', 'Nest dotted Spring keys into YAML'],
      ['/json-formatter', 'Format the rebuilt document'],
    ],
    title: 'JSON Unflattener — Dot Notation to Nested JSON | DevPocket',
    description:
      'Rebuild nested JSON objects and arrays from flat dot-notation keys such as user.address.city. The exact inverse of flattening. Free, browser-based.',
    heading: 'Rebuild nested JSON from flat keys',
    aboutLabel: 'rebuilding nested JSON',
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
  },
  '/json-escape': {
    related: [
      ['/base64', 'Encode a string for transport instead of escaping it'],
      ['/url-encode', 'Percent-encode the string for a URL'],
      ['/html-entities', 'Escape the string for HTML instead'],
      ['/json-formatter', 'Format the JSON an escaped string contains'],
    ],
    title: 'JSON Escape & Unescape Online | DevPocket',
    description:
      'Escape text into a JSON string literal, or unescape one back to readable text. Handles quotes, backslashes, newlines and unicode. Free and private.',
    heading: 'Escape and unescape JSON strings',
    aboutLabel: 'escaping JSON strings',
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
  },
  '/json-remove-nulls': {
    related: [
      ['/json-remove-empty', 'Also strip empty strings, arrays and objects'],
      ['/json-merge', 'Merge documents without nulls overwriting values'],
      ['/json-formatter', 'Format the cleaned document'],
      ['/json-stats', 'Count how many nulls a payload carries'],
    ],
    title: 'Remove Nulls from JSON Online — Free Cleaner | DevPocket',
    description:
      'Strip every null value and null array entry from a JSON document, at any nesting depth. Free, instant, and nothing you paste is ever uploaded.',
    heading: 'Remove null values from JSON',
    aboutLabel: 'removing null values',
    deepDive: {
      heading: 'null, missing and empty are three different things',
      body: [
        'Stripping nulls looks like tidying. In several common contexts it changes the meaning of the document rather than its size, because null is not a synonym for absent — it is a value that some protocols and schemas treat as significant. To also drop empty strings, arrays and objects, use [Remove Empty Values](/json-remove-empty).',
        'Before removing them, it is worth knowing which of the three states your consumer actually distinguishes.',
      ],
      example: {
        inputLabel: 'A PATCH body',
        input: `{
  "name": "shop-api",
  "description": null,
  "replicas": 3
}`,
        outputLabel: 'Two very different requests',
        output: `With null kept (RFC 7386 merge patch):
  set name, DELETE description,
  set replicas

With null stripped:
  set name, LEAVE description
  exactly as it was, set replicas`,
        note: 'Same tidy-looking edit, opposite outcome for one field. This is the case where removing nulls is a bug rather than a clean-up.',
      },
      gotchas: [
        {
          title: 'In a JSON Merge Patch, null means delete',
          detail: 'RFC 7386 defines null as the instruction to remove a member. Strip nulls from a PATCH body and every intended deletion silently becomes "leave unchanged" — the request still succeeds, which is what makes it hard to spot.',
        },
        {
          title: 'JSON Schema treats null and absent separately',
          detail: '{"type": "string"} rejects null, while required only checks whether the key exists. A document that validated with the key absent can fail once you add it back as null, and vice versa.',
        },
        {
          title: 'Removing nulls from an array changes its length',
          detail: 'Objects lose a key; arrays lose a position. If anything downstream indexes by position — a CSV column, a fixed-order tuple — compacting the array shifts every value after the hole.',
        },
        {
          title: '"Empty" is a much bigger hammer than "null"',
          detail: 'Null, "", [] and {} are four distinct values. Removing all of them turns "the user cleared this field" into "the user never touched it", which matters in forms and audit trails.',
        },
        {
          title: 'Some stores index the difference',
          detail: 'Databases and document stores frequently distinguish a missing attribute from a null one for queries and indexes. A record cleaned of its nulls can stop matching a filter that a record with explicit nulls matched.',
        },
      ],
    },
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
  },
  '/json-remove-empty': {
    related: [
      ['/json-remove-nulls', 'Strip only nulls and keep empty strings'],
      ['/json-stats', 'See how many empty values there are first'],
      ['/json-validator', 'Validate the cleaned JSON'],
      ['/json-sort-keys', 'Sort keys for a stable, diffable output'],
    ],
    title: 'Remove Empty Values from JSON | DevPocket',
    description:
      'Strip nulls, empty strings, empty arrays and empty objects from JSON at every level. More aggressive than a null-only clean. Free and browser-based.',
    heading: 'Remove empty values from JSON',
    aboutLabel: 'removing empty values',
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
  },
  '/json-merge': {
    related: [
      ['/json-sort-keys', 'Sort the merged result'],
      ['/diff', 'Compare the merged result with the original'],
      ['/json-remove-nulls', 'Drop nulls before they overwrite values'],
      ['/yaml-to-json', 'Convert YAML overrides to JSON before merging'],
      ['/json-remove-empty', 'Drop empty values before merging'],
    ],
    title: 'JSON Merge Online — Deep Merge Two Documents | DevPocket',
    description:
      'Merge two JSON documents with a deep or shallow strategy. Nested objects combine recursively; the second document wins on conflicts. Free and private.',
    heading: 'Merge two JSON documents',
    aboutLabel: 'merging JSON documents',
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
  },
  '/json-viewer': {
    related: [
      ['/json-formatter', 'Format and search the same document'],
      ['/jsonpath', 'Select values by path once you have found them'],
      ['/json-stats', 'Measure the document’s size and depth'],
      ['/json-validator', 'Find the error when the tree will not load'],
      ['/json-remove-nulls', 'Strip null fields that clutter the tree'],
    ],
    title: 'JSON Viewer Online — Collapsible Tree View | DevPocket',
    description:
      'View any JSON payload as a collapsible tree with typed, colour-coded values. Far easier than scrolling a large raw response. Free, no upload.',
    heading: 'JSON Viewer',
    aboutLabel: 'the JSON tree viewer',
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
  },
  '/json-stats': {
    related: [
      ['/json-viewer', 'Browse the document you just analysed'],
      ['/json-schema-generator', 'Infer the structure as a JSON Schema'],
      ['/json-remove-empty', 'Strip the empty values the stats found'],
      ['/json-validator', 'Check for duplicate keys and precision loss'],
    ],
    title: 'JSON Statistics — Node Count, Depth & Types | DevPocket',
    description:
      'Analyse a JSON payload: total nodes, maximum nesting depth, unique key count, size in bytes and a breakdown by type. Free and runs in your browser.',
    heading: 'Analyse a JSON payload',
    aboutLabel: 'JSON statistics',
    deepDive: {
      heading: 'Reading a payload by its numbers',
      body: [
        'Size, depth and node count answer different questions. Bytes tell you what the response costs on the wire; depth tells you whether a parser will refuse it; node count predicts parse time far better than bytes do, because the work is per value, not per character. To see where the nodes are, [browse the document as a tree](/json-viewer).',
        'The most useful number is usually the ratio between them. A 2 MB payload with 40,000 nodes is a large collection and will parse in milliseconds. A 2 MB payload with 900,000 nodes is a pathological shape and will not.',
      ],
      example: {
        inputLabel: 'Payload',
        input: `An array of 5,000 order objects,
each with 12 fields and one nested
address object of 6 fields`,
        outputLabel: 'What the numbers say',
        output: `Nodes      ~95,000
Keys       90,000 (18 x 5,000)
Depth      4
Bytes      ~3.1 MB
Gzipped    ~280 KB

The key names are 18 strings repeated
5,000 times — which is why gzip takes
roughly 90% off and why a columnar
format would take more.`,
      },
      gotchas: [
        {
          title: 'Depth is a denial-of-service surface',
          detail: 'Most parsers recurse. Jackson, Python json and many others fail somewhere around 1,000 levels, and a few blow the stack instead of raising. A few hundred bytes of nested brackets can take down an endpoint that never checks depth.',
        },
        {
          title: 'Byte size is not transfer size',
          detail: 'JSON compresses extremely well because the key names repeat on every record — 80 to 95% is normal. Judge a response budget on the gzipped or brotli size, not the raw one, or you will optimise the wrong thing.',
        },
        {
          title: 'Repeated keys are most of a large payload',
          detail: 'In an array of records, the field names are stored once per record. That is the real argument for shortening key names in high-volume APIs, and the reason a columnar or binary format wins so decisively at scale.',
        },
        {
          title: 'Node count predicts parse cost, bytes do not',
          detail: 'One 2 MB string is a single node and parses almost instantly. Two megabytes of small values is hundreds of thousands of allocations. If a payload parses slowly for its size, count the nodes.',
        },
        {
          title: 'Deeply nested does not mean large',
          detail: 'Depth and size are independent. A shallow million-element array and a 900-level nested object fail for completely different reasons, and a size limit catches only one of them.',
        },
      ],
    },
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
  },
  '/jsonpath': {
    related: [
      ['/json-viewer', 'Find a path by browsing the tree'],
      ['/json-flatten', 'List every path in dot notation'],
      ['/regex-tester', 'Match text patterns inside the values'],
      ['/json-formatter', 'Format the matched result'],
    ],
    title: 'JSONPath Evaluator Online — Test $.path Queries | DevPocket',
    description:
      'Run JSONPath expressions against a document and see the matches instantly. Supports dot paths, array indexes, wildcards and recursive descent. Free.',
    heading: 'Evaluate JSONPath expressions',
    aboutLabel: 'the JSONPath evaluator',
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
  },
  '/json-schema-generator': {
    related: [
      ['/codegen', 'Generate typed models from the same sample'],
      ['/json-validator', 'Validate the sample before inferring'],
      ['/mock', 'Generate records that fit the schema'],
      ['/csv-to-json', 'Turn tabular data into JSON to describe'],
    ],
    title: 'JSON Schema Generator — Infer a Schema from JSON | DevPocket',
    description:
      'Generate a draft 2020-12 JSON Schema from a sample payload, with types, required fields and detected date-time and email formats. Free and offline.',
    heading: 'Generate a JSON Schema from a sample',
    aboutLabel: 'the JSON Schema generator',
    deepDive: {
      heading: 'What a generated schema gets right, and what you have to fix by hand',
      body: [
        'Inference reads one sample and describes exactly that sample. It gives you the skeleton — types, nesting, property names — in seconds, which is the tedious part. What it cannot know is the difference between a field that happened to be present and a field that is always present, or between a string and a date. If what you need is code rather than a schema, [generate typed models](/codegen) from the same sample.',
        'Treat the output as a first draft: generate, then prune the required list, widen the types that can be null, and add the formats and constraints that carry the real rules.',
      ],
      example: {
        inputLabel: 'Sample payload',
        input: `{
  "id": 4021,
  "email": "ada@example.com",
  "createdAt": "2026-09-15T09:00:00Z",
  "score": 4,
  "tags": [],
  "manager": null
}`,
        outputLabel: 'Inferred schema',
        output: `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id":        { "type": "integer" },
    "email":     { "type": "string" },
    "createdAt": { "type": "string" },
    "score":     { "type": "integer" },
    "tags":      { "type": "array", "items": {} },
    "manager":   { "type": "null" }
  },
  "required": [
    "id", "email", "createdAt",
    "score", "tags", "manager"
  ]
}`,
        note: 'Four things in that output are wrong for real traffic: score is an integer only because this sample had no decimal, tags has no element type because the array was empty, createdAt is a plain string, and manager is typed null forever.',
      },
      gotchas: [
        {
          title: 'Every key in the sample lands in required',
          detail: 'A field that is optional in real traffic will be marked required, and the first payload that legitimately omits it fails validation. Pruning required is the first edit to make, every time.',
        },
        {
          title: 'An empty array tells the generator nothing',
          detail: '"tags": [] produces items: {}, which accepts anything. Feed a sample with at least one element of every array, or write the item schema yourself.',
        },
        {
          title: 'null becomes a type, not a possibility',
          detail: 'A field that was null in the sample is typed "null". What you almost always want is ["string", "null"] — nullable, not always-null.',
        },
        {
          title: 'Whole numbers become integers',
          detail: 'A price that happened to be 4 in the sample is typed integer, and 4.5 then fails. If a field can be fractional, widen it to number by hand.',
        },
        {
          title: 'Formats cannot be inferred safely',
          detail: 'An ISO-8601 timestamp, a UUID and an email are all just strings. Adding "format": "date-time" / "uuid" / "email" is manual, and it is where most of the value of a schema actually lives.',
        },
        {
          title: 'The draft you target changes the keywords',
          detail: 'Tuple validation moved from items: [...] in draft-07 to prefixItems in 2020-12, and $id / definitions were renamed. A schema pasted into a validator running a different draft can silently stop enforcing what you meant.',
        },
      ],
    },
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
  },
  '/password': {
    related: [
      ['/hash-generator', 'See why a fast hash like SHA-256 is not password storage'],
      ['/jwt-encoder', 'Sign test tokens with a random secret'],
      ['/uuid', 'Generate identifiers rather than secrets'],
      ['/base64', 'Encode random key bytes as Base64'],
    ],
    title: 'Password Generator — Strong Random Passwords | DevPocket',
    description:
      'Generate strong random passwords with configurable length and character sets, plus an entropy estimate. Uses browser crypto and never transmits them.',
    heading: 'Generate strong passwords',
    aboutLabel: 'the password generator',
    deepDive: {
      heading: 'What actually makes a password hard to guess',
      body: [
        'Strength is a property of how a password was generated, not how it looks. A password picked uniformly at random from a known alphabet has entropy you can calculate: length multiplied by log2(alphabet size). A password a human invented to satisfy a strength meter has far less, because the ways humans substitute characters are few and well known to cracking tools. And storing one needs a slow, salted hash such as Argon2 or bcrypt — not the fast digests in the [hash generator](/hash-generator).',
        'That is why this generator does two things and no more: it draws from crypto.getRandomValues — the browser\'s cryptographic random source, not Math.random — and it tells you the resulting entropy in bits, so the number is something you can reason about rather than a coloured bar.',
      ],
      table: {
        caption: 'Time to exhaust half the keyspace at one trillion guesses a second — an offline attack on a fast hash. A properly salted bcrypt or Argon2 hash is millions of times slower than this.',
        columns: ['Password', 'Entropy', 'Offline guessing time'],
        rows: [
          ['12 chars, a–z and 0–9', '62 bits', 'About a month'],
          ['12 chars, mixed case + digits', '71 bits', 'About 50 years'],
          [
            '16 chars, mixed case + digits',
            '95 bits',
            'Hundreds of millions of years',
          ],
          ['16 chars, + symbols', '105 bits', 'Beyond any practical attack'],
          ['20 chars, + symbols', '131 bits', 'Beyond any practical attack'],
          ['4-word passphrase (7776-word list)', '52 bits', 'Under an hour'],
          [
            '6-word passphrase (7776-word list)',
            '78 bits',
            'A few thousand years',
          ],
        ],
      },
      gotchas: [
        {
          title: 'Math.random() is not for secrets',
          detail: 'It is a fast pseudo-random generator seeded from state an attacker can often recover, and a sequence of its outputs can be predicted from earlier ones. Anything that guards an account needs crypto.getRandomValues or a server-side CSPRNG.',
        },
        {
          title: 'Strength meters measure the wrong thing',
          detail: 'Tr0ub4dor&3 satisfies every composition rule and is weak, because leetspeak substitution is the first thing a cracking rule set tries. A meter scores the string; only the generation method decides the entropy.',
        },
        {
          title: 'Composition rules shrink the space',
          detail: '"Must contain exactly one symbol, at the end" narrows the keyspace instead of widening it, and pushes people to Password1!. Length with a full alphabet beats any rule about which characters must appear.',
        },
        {
          title: 'Reuse cancels length',
          detail: 'A 30-character password used on two sites is one breach away from compromising both. Uniqueness matters more than strength past about 80 bits, which is the argument for a password manager rather than a memorable scheme.',
        },
        {
          title: 'The clipboard remembers',
          detail: 'Clipboard managers keep history, and on some systems any application can read the clipboard. Paste it straight into the password manager, then copy something harmless over it.',
        },
        {
          title: 'A four-word passphrase is weaker than it feels',
          detail: 'Diceware-style passphrases are excellent for things you must type from memory, but the entropy comes from the word list size and the count, not the length in characters. Four words from a 7776-word list is 52 bits — use six for anything that matters.',
        },
      ],
    },
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
  },
  '/lorem': {
    related: [
      ['/mock', 'Generate realistic records instead of Latin'],
      ['/markdown', 'Draft a document around placeholder text'],
      ['/case-converter', 'Turn placeholder words into identifiers'],
      ['/color', 'Pick colors for the mock-up'],
    ],
    title: 'Lorem Ipsum Generator — Words & Paragraphs | DevPocket',
    description:
      'Generate placeholder Lorem Ipsum text by word, sentence or paragraph count, with the classic opening line optional. Free, instant and offline.',
    heading: 'Generate placeholder text',
    aboutLabel: 'the placeholder text generator',
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
  },
  '/url-parser': {
    related: [
      ['/url-encode', 'Encode or decode a single query value'],
      ['/http', 'Look up the status code the request returned'],
      ['/base64', 'Decode a Base64URL value found in the query'],
      ['/regex-tester', 'Match URLs in logs with a pattern'],
      ['/jwt-decoder', 'Decode a token passed as a query parameter'],
    ],
    title: 'URL Parser & Query String Editor Online | DevPocket',
    description:
      'Split any URL into protocol, host, port, path, query and fragment, decode every parameter, edit them as rows and copy the rebuilt URL. Runs in your browser.',
    heading: 'URL parser and query string editor',
    aboutLabel: 'the URL parser',
    blurb:
      'Paste a URL to see it the way a browser does: every part named, the path split into decoded segments, and each query parameter decoded into its own row that you can edit, remove or add to before copying the rebuilt URL or the query as JSON.',
    deepDive: {
      heading: 'A URL is parsed by rules, not by splitting on "?" and "&"',
      body: [
        'Most bugs with URLs come from reading them with string functions. Splitting on "?" breaks when the fragment contains one, splitting on "&" breaks when a value was not encoded, and a hand-written decoder gets "+" wrong half the time. This page uses the same WHATWG URL parser your browser uses for fetch() and the address bar, so what you see here is what the server will receive. To encode or decode one value on its own, use the [URL encoder](/url-encode).',
        'The query string is where the confusion lives. Parameter names can repeat (tag=a&tag=b is two values, not a typo), order is preserved and sometimes significant, and each value is percent-encoded independently. The parameter table shows every pair decoded, marks repeated keys, and rebuilds the query with correct encoding when you edit a row — so you can change a filter or strip a tracking parameter without hand-encoding anything.',
      ],
      example: {
        inputLabel: 'Pasted URL',
        input: 'https://api.example.com:8443/v2/orders/%E2%82%AC-refunds?status=open&tag=vip&tag=eu&q=caf%C3%A9+latte#results',
        outputLabel: 'What the parser reads',
        output: `host      api.example.com:8443
path      /v2/orders/€-refunds  (decoded)
status    open
tag       vip   (repeated)
tag       eu    (repeated)
q         café latte
fragment  #results`,
        note: 'The "+" in q became a space because URLSearchParams and HTML forms read it that way. A server that decodes with decodeURIComponent would keep it as "+" — one of the warnings the tool raises.',
      },
      gotchas: [
        {
          title: '"+" means space only in the query',
          detail: 'Form encoding (application/x-www-form-urlencoded) turns spaces into "+", so query parsers read "+" as a space. In the path, "+" is a literal plus. Encode a real plus in a query value as %2B.',
        },
        {
          title: 'Double encoding hides in plain sight',
          detail: '%2520 is an encoded %20: something encoded a value that was already encoded. The server then sees the text "%20" instead of a space. The tool flags %25 followed by hex digits for exactly this reason.',
        },
        {
          title: 'The fragment never reaches the server',
          detail: 'Everything after "#" stays in the browser. Putting a token or a filter there means the server never sees it, and moving one out of the fragment into the query means it starts appearing in server logs.',
        },
        {
          title: 'Credentials in a URL leak everywhere',
          detail: 'user:password@host works, but the URL ends up in browser history, proxy and server logs, and Referer headers. Browsers increasingly strip or block it. Use an Authorization header instead.',
        },
      ],
    },
    howItWorks: [
      'Paste a URL. A bare host like example.com/path is read as https://.',
      'Every part is listed: protocol, credentials, host, port, origin, path, query and fragment.',
      'Query parameters appear decoded, one row each, with repeated keys marked.',
      'Edit, add or remove rows; the rebuilt URL updates with correct encoding.',
      'Copy the rebuilt URL, or the query string as a JSON object.',
    ],
    useCases: [
      'Reading a long redirect or callback URL from a log line',
      'Stripping utm_ and other tracking parameters before sharing a link',
      'Checking what a signed or pre-signed URL actually contains',
      'Debugging why a server receives "+" instead of a space',
      'Turning a query string into JSON for a test fixture',
    ],
    faq: [
      {
        q: 'Is the URL sent anywhere to be parsed?',
        a: 'No. Parsing uses the URL class built into your browser. Nothing is fetched, not even the URL you paste.',
      },
      {
        q: 'Why did my port disappear from the rebuilt URL?',
        a: 'Port 443 for https and port 80 for http are the defaults, so the normalised URL leaves them out. The request goes to the same place either way.',
      },
      {
        q: 'How are repeated parameters converted to JSON?',
        a: 'A key that appears once becomes a string; a key that appears more than once becomes an array of its values, in order.',
      },
      {
        q: 'Does it handle internationalised domain names?',
        a: 'Yes. A host with non-ASCII characters is converted to its punycode form (xn--…), which is what browsers actually send in the request.',
      },
    ],
  },
  '/html-entities': {
    related: [
      ['/url-encode', 'Encode for URLs rather than HTML'],
      ['/markdown', 'Preview how escaped HTML renders in Markdown'],
      ['/json-escape', 'Escape for JSON string literals instead'],
      ['/xml-formatter', 'Check that escaped text leaves XML well-formed'],
    ],
    title: 'HTML Entity Encoder & Decoder Online | DevPocket',
    description:
      'Escape text for HTML with minimal, named or ASCII-only entities, or decode &amp;, &#233; and &#xE9; back to characters. Free and private, in your browser.',
    heading: 'HTML entity encoder and decoder',
    aboutLabel: 'HTML entity encoding',
    blurb:
      'Escape text so it is safe to put inside HTML, choosing how much to escape, or paste HTML full of &entities; and get readable text back, with a breakdown of every reference found and a warning for ones missing their closing semicolon.',
    deepDive: {
      heading: 'Which characters actually need escaping — and where',
      body: [
        'In HTML only a handful of characters are dangerous: < and & start markup, and " or \' end an attribute value. Escaping those five is enough to display any text safely inside an element or a quoted attribute, and it is what the Minimal mode does. Everything else, including accented letters and emoji, is valid as-is in a UTF-8 page. Text going into a URL needs [percent-encoding](/url-encode) instead, and text going into JSON needs [JSON string escaping](/json-escape).',
        'The other two modes exist for other destinations. Named mode writes common symbols as readable names (&copy;, &mdash;, &nbsp;) for hand-edited templates. All-non-ASCII mode turns every character above U+007F into a numeric reference, for the rare pipeline that is not UTF-8 clean — old email systems, some XML tools, a database column with the wrong charset.',
      ],
      example: {
        inputLabel: 'Text to put in a page',
        input: `<p>Tom & Jerry's "R&D" — €1,200</p>`,
        outputLabel: 'Minimal and ASCII-only',
        output: `Minimal:
&lt;p&gt;Tom &amp; Jerry&#39;s &quot;R&amp;D&quot; — €1,200&lt;/p&gt;

All non-ASCII:
&lt;p&gt;Tom &amp; Jerry&#39;s &quot;R&amp;D&quot; &#x2014; &#x20AC;1,200&lt;/p&gt;`,
        note: 'The dash and the euro sign are left alone by Minimal because a UTF-8 page displays them correctly. Only the five markup characters change.',
      },
      gotchas: [
        {
          title: 'Escaping HTML is not escaping JavaScript or URLs',
          detail: 'Entities protect text inside HTML. Inside a <script> block, an onclick handler or an href, different rules apply: use JSON encoding for script, and URL encoding (then HTML escaping) for links.',
        },
        {
          title: 'Encode once, at output',
          detail: 'Escaping on input and again on output gives &amp;amp; on screen. Store the raw text and escape it once, when it is written into the page.',
        },
        {
          title: 'A missing semicolon still decodes — sometimes',
          detail: 'Browsers decode &amp without a semicolon for legacy names, so "&copy2024" can become "©2024" by accident. The decoder lists references without a closing ; so you can spot them.',
        },
        {
          title: '&nbsp; is not a space',
          detail: 'It decodes to U+00A0, which looks like a space but does not match " " in code, breaks string comparisons and survives trim(). The breakdown shows it as [nbsp] so it cannot hide.',
        },
      ],
    },
    howItWorks: [
      'Choose Encode or Decode.',
      'For encoding, pick Minimal, Named or All non-ASCII.',
      'Paste text, or upload an .html or .txt file.',
      'In Decode mode, every entity reference is listed with the character it becomes.',
      'Copy the result or download it as a file.',
    ],
    useCases: [
      'Showing a code sample or user-supplied text inside an HTML page',
      'Reading an HTML-escaped string copied out of a template or API response',
      'Making a snippet safe for an ASCII-only email or legacy system',
      'Finding a stray &nbsp; that breaks a string comparison',
    ],
    faq: [
      {
        q: 'Is this enough to prevent XSS?',
        a: 'Minimal encoding makes text safe inside element content and quoted attribute values. It does not make text safe inside script, style, unquoted attributes or URLs; those need their own encoding.',
      },
      {
        q: 'How many named entities does the decoder know?',
        a: 'In the browser it uses the browser’s own HTML parser, which knows all 2,231 named references in the HTML standard. It builds an inert document, so nothing in the text runs or loads.',
      },
      {
        q: 'Why is &#39; used for the apostrophe instead of &apos;?',
        a: '&apos; is not defined in HTML 4 and some older parsers ignore it. &#39; works everywhere.',
      },
    ],
  },
  '/case-converter': {
    related: [
      ['/regex-tester', 'Rename with a pattern when case rules are not enough'],
      ['/properties', 'Rename .properties keys between cases'],
      ['/codegen', 'Generate models with idiomatic field names'],
      ['/diff', 'Compare before and after a rename'],
    ],
    title: 'Case Converter — camelCase, snake_case & More | DevPocket',
    description:
      'Convert names between camelCase, PascalCase, snake_case, SCREAMING_SNAKE, kebab-case and seven more. Handles acronyms like XMLHttp, one name or a list.',
    heading: 'Case converter for code identifiers',
    aboutLabel: 'the case converter',
    blurb:
      'Type an identifier or a phrase and see it in twelve naming conventions at once, or paste a whole list — column names, JSON keys, environment variables — and convert every line to one convention in a single pass.',
    deepDive: {
      heading: 'Converting case is really about finding word boundaries',
      body: [
        'Joining words is easy; finding them is the hard part. "user_id", "userId", "UserID" and "user-id" have to become the same two words before they can become anything else, and a naive splitter that breaks on every capital turns "XMLHttpRequest" into x, m, l, http, request. This converter treats a run of capitals followed by a lowercase word as an acronym and a separate word, so it comes out as xml, http, request. When a rename follows a pattern that is not about case, [test a regular expression](/regex-tester) instead.',
        'Digits stay attached to the word before them (utf8, v2, line1). That keeps version suffixes and numbered fields intact through a round trip, which is what you want when renaming database columns or mapping JSON keys to struct fields. The detector also tells you which convention the first line already uses, which helps when you are auditing a file with mixed styles.',
      ],
      example: {
        inputLabel: 'Mixed input, one per line',
        input: `XMLHttpRequest
user_id
first-name
SHIPPING_ADDRESS_LINE_1`,
        outputLabel: 'Converted to camelCase',
        output: `xmlHttpRequest
userId
firstName
shippingAddressLine1`,
      },
      table: {
        caption: 'Where each convention is usually expected',
        columns: ['Convention', 'Typical home'],
        rows: [
          ['camelCase', 'JavaScript and Java variables, JSON keys in most web APIs'],
          ['PascalCase', 'Classes, types, React components, C# members'],
          ['snake_case', 'Python, Ruby, SQL columns, Postgres identifiers'],
          ['SCREAMING_SNAKE_CASE', 'Constants and environment variables'],
          ['kebab-case', 'URLs, CSS classes, CLI flags, Kubernetes resource names'],
          ['dot.case', 'Java properties and Spring configuration keys'],
        ],
      },
      gotchas: [
        {
          title: 'Acronyms do not survive a round trip',
          detail: 'XMLHttpRequest → xml_http_request → XmlHttpRequest. The capitals were information the snake_case form cannot hold. Style guides disagree on acronyms (Go wants URLID, Java prefers UrlId), so check the result.',
        },
        {
          title: 'Renaming a JSON key is an API change',
          detail: 'Switching a response from user_id to userId breaks every client that reads it. Map at the boundary — a serializer naming strategy — rather than renaming stored data.',
        },
        {
          title: 'Case-insensitive systems merge names',
          detail: 'Environment variables on Windows, MySQL table names on macOS and most SQL identifiers without quotes ignore case, so UserId and userid collide. Pick one convention per system.',
        },
      ],
    },
    howItWorks: [
      'Type or paste one name per line, or upload a text file.',
      'The first line is shown in all twelve conventions, each with its own copy button.',
      'Choose a target convention to convert every line of the list.',
      'Copy the converted list or download it as a file.',
    ],
    useCases: [
      'Mapping database column names to object properties',
      'Turning JSON keys into environment variable names',
      'Renaming CSS classes or URL slugs consistently',
      'Checking which convention a legacy file uses',
    ],
    faq: [
      {
        q: 'How are numbers handled?',
        a: 'A digit stays attached to the letters before it, so line1 and utf8 remain single words. A digit after a separator starts a new word.',
      },
      {
        q: 'Does it keep accented and non-Latin letters?',
        a: 'Yes. Letters and digits in any script count as parts of a word, so "Ça va déjà" becomes çaVaDéjà. Turn on Strip accents to get ASCII-safe names instead (caVaDeja), for code or systems that only accept A–Z.',
      },
      {
        q: 'Can I convert a whole file?',
        a: 'Yes. Upload or paste it; every non-empty line is converted on its own and blank lines are kept, so line numbers still match.',
      },
    ],
  },
  '/number-base': {
    related: [
      ['/color', 'Convert hex color codes to RGB'],
      ['/hash-generator', 'See digests in hex or Base64'],
      ['/timestamp', 'Read a timestamp written in hex'],
      ['/base64', 'Encode raw bytes as Base64'],
    ],
    title: 'Number Base Converter — Binary, Hex, Octal | DevPocket',
    description:
      "Convert numbers between binary, octal, decimal and hexadecimal exactly, at any size, with 8- to 64-bit two's complement views. Free and runs in your browser.",
    heading: 'Number base converter',
    aboutLabel: 'number base conversion',
    blurb:
      "Enter a number in binary, octal, decimal or hex — or with a 0x, 0b or 0o prefix — and read it in every base at once, exactly, however many digits it has, along with its unsigned and two's complement signed value at 8, 16, 32 and 64 bits.",
    deepDive: {
      heading: 'Why a hex converter needs more than parseInt',
      body: [
        "JavaScript numbers are 64-bit floats, so parseInt('FFFFFFFFFFFFFFFF', 16) returns 18446744073709552000 — close, and wrong. That matters for exactly the numbers developers convert most: 64-bit IDs, hashes, memory addresses and bit masks. This converter works on BigInt throughout, so a 64-bit or 256-bit value converts digit for digit — a SHA-256 from the [hash generator](/hash-generator), say.",
        "The fixed-width table answers the other common question: what does this bit pattern mean as a signed integer? The same eight bits, 11001000, are 200 as an unsigned byte and -56 as a signed one. Seeing both side by side is how you debug an overflow, a sign-extension bug or a checksum that came back negative.",
      ],
      example: {
        inputLabel: 'Input (hex)',
        input: '0xFFFFFFFE',
        outputLabel: 'Read back',
        output: `Binary       1111 1111 1111 1111 1111 1111 1111 1110
Decimal      4,294,967,294
32-bit       unsigned 4294967294 · signed -2
64-bit       unsigned 4294967294 · signed 4294967294`,
        note: 'The same value is -2 as a signed 32-bit integer and 4294967294 as a 64-bit one. That difference is a classic source of bugs when a 32-bit field is read into a wider type.',
      },
      gotchas: [
        {
          title: 'A leading zero once meant octal',
          detail: 'In old JavaScript, C and many config parsers, 010 is eight, not ten. File modes like 0755 are octal for this reason. Use an explicit 0o prefix where the language allows it.',
        },
        {
          title: 'Doubles are exact only up to 2^53',
          detail: 'Integers above 9,007,199,254,740,991 cannot all be represented as JavaScript numbers. IDs from 64-bit databases should travel as strings or BigInt, never as plain JSON numbers.',
        },
        {
          title: "Negative hex depends on the width",
          detail: "-1 is FF in 8 bits, FFFF in 16 and FFFFFFFF in 32. A bare '-0x1' has no fixed width, which is why the table shows each width separately.",
        },
      ],
    },
    howItWorks: [
      'Pick the base you are typing in, or use a 0x, 0b or 0o prefix.',
      'Type the number. Separators like _, spaces and commas are ignored.',
      'Read it in binary, octal, decimal and hex, optionally grouped.',
      "Check the 8-, 16-, 32- and 64-bit rows for its unsigned and two's complement values.",
      'Copy any representation with its prefix.',
    ],
    useCases: [
      'Reading a hex error code or memory address as a decimal number',
      'Checking a bit mask or permission flags in binary',
      'Converting 64-bit IDs without losing precision',
      'Debugging a signed/unsigned overflow',
    ],
    faq: [
      {
        q: 'Is there a size limit?',
        a: 'No practical one. Conversion uses BigInt, so a 256-bit hash converts as exactly as a single byte.',
      },
      {
        q: "What is two's complement?",
        a: 'The way almost every CPU stores negative integers: the top bit has a negative weight. It is why 0xFF is -1 as a signed byte and 255 as an unsigned one.',
      },
      {
        q: 'Can I enter negative numbers?',
        a: "Yes, with a leading minus in any base. The fixed-width rows then show the two's complement bit pattern for each width it fits in.",
      },
      {
        q: 'Does it support fractions or floating point?',
        a: 'No. It converts integers only. Fractional values in another base are rarely exact and are better handled by a float inspector.',
      },
    ],
  },
  '/privacy': {
    collapsedContent: false,
    title: 'Privacy — How Your Data Is Handled | DevPocket',
    description:
      'DevPocket runs entirely client-side: no backend, no analytics, no cookies, no error tracking. See what is stored locally and how to verify it yourself.',
    heading: 'How DevPocket actually handles your data',
    aboutLabel: 'this privacy page',
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
  },
  '/about': {
    collapsedContent: false,
    title: 'About — Built by Sourabh Kumar | DevPocket',
    description:
      'DevPocket is a local-first developer toolbox built by Sourabh Kumar, a backend developer. No trackers, no ads, and nothing you paste leaves your browser.',
    heading: 'About DevPocket',
    // The page's own header reads "About"; keep that as its one <h1>.
    h1: 'About DevPocket',
    aboutLabel: 'this project',
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
  },
  ...encodingPages,
  ...formatPages,
  ...timePages,
  ...idPages,
  ...jwtPages,
  ...springPages,
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
