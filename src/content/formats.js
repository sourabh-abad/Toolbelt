// Page copy for the formatter and converter pages that replaced /json-xml/
// and /convert/. Merged into SEO in src/lib/seo.js. Guide paragraphs may
// contain [anchor text](/route) or [anchor](https://…) links.

export default {
  '/json-formatter': {
    title: 'JSON Formatter & Beautifier Online — Free, Private | DevPocket',
    description:
      'Format, beautify or minify JSON instantly. Indent with 2, 4 or tabs, sort keys, browse a tree and search. Lenient mode accepts comments. Runs in your browser.',
    heading: 'JSON Formatter',
    aboutLabel: 'JSON formatting',
    blurb:
      'Paste minified or messy JSON and it is formatted the moment it parses: pick 2 spaces, 4 spaces or tabs, minify it back, sort the keys, or switch to a collapsible tree and search it. Lenient mode accepts comments and trailing commas, so tsconfig.json and VS Code settings format too.',
    related: [
      ['/json-validator', 'Find duplicate keys and numbers that lose precision'],
      ['/json-viewer', 'Browse a large payload as a tree without the editor'],
      ['/json-sort-keys', 'Sort keys at every level, ascending or descending'],
      ['/json-to-yaml', 'Turn the formatted JSON into YAML config'],
      ['/jsonpath', 'Pull one field out of the document with a $.path query'],
      ['/diff', 'Compare two formatted documents line by line'],
    ],
    deepDive: {
      heading: 'Formatting changes whitespace, never the data',
      body: [
        'A JSON formatter re-prints the same document with line breaks and indentation so a person can read it. Nothing about the data changes: the keys, values and array order are identical, and a machine parses the formatted and the minified versions to the same result. Minifying does the reverse and strips every optional space, which is what you want in an HTTP body or a log line where each byte counts.',
        'Formatting only works on valid JSON, so the formatter parses first and shows the first syntax error with its line and column when it cannot. For a deeper check — duplicate keys, where the last value silently wins, or IDs too large to survive JSON.parse — [open the same text in the JSON Validator](/json-validator). Sorting keys is useful before a diff: two payloads that differ only in key order become identical, and the real changes stand out when you [compare them in the Diff Checker](/diff).',
        'Strict JSON (RFC 8259) has no comments and no trailing commas, but many config files are really JSONC: tsconfig.json, .eslintrc.json, VS Code settings. Lenient mode blanks those out before parsing — every line and column stays where it was, so errors still point at the right place — and the output is strict JSON that any parser accepts. Numbers are kept exactly as written, so 12345678901234567890 does not come out as 12345678901234567000.',
      ],
      example: {
        inputLabel: 'JSONC input (lenient mode)',
        input: '{"name":"api",// service\n"ports":[8080,8443,],}',
        outputLabel: 'Formatted, 2 spaces',
        output: `{
  "name": "api",
  "ports": [
    8080,
    8443
  ]
}`,
        note: 'The // comment and both trailing commas are removed; without lenient mode the first error is reported at line 1, column 15.',
      },
      gotchas: [
        {
          title: 'Comments in "JSON" config files',
          detail: 'tsconfig.json and VS Code settings accept comments; JSON.parse, jq and most APIs do not. Format with lenient mode on, and the output is safe to send to a strict parser.',
        },
        {
          title: 'Single quotes and unquoted keys',
          detail: 'JavaScript object literals are not JSON. {name: \'api\'} fails because keys and strings need double quotes. Lenient mode does not rewrite quotes, so the error points at the first one to fix.',
        },
        {
          title: 'Large integers change when re-serialised elsewhere',
          detail: 'This formatter keeps the original digits, but a formatter built on JSON.parse rounds anything above 9007199254740991. If a formatted ID differs from the source, that is why.',
        },
        {
          title: 'Sorting keys in data where order matters',
          detail: 'JSON objects are unordered by the spec, but some consumers read the first key specially (for example a "type" discriminator). Sort for reading and diffing, not for the payload you send.',
        },
      ],
    },
    howItWorks: [
      'Paste, type or drop a .json file — the output updates as soon as the input parses.',
      'Choose Beautify with 2 spaces, 4 spaces or tabs, or Minify.',
      'Sort keys, switch to the tree, or search keys and values.',
      'Copy the result or download it as data.json.',
    ],
    useCases: [
      'Reading a minified API response or a log line',
      'Normalising two payloads before a diff',
      'Turning tsconfig.json or settings.json into strict JSON',
      'Minifying a fixture before embedding it in a test',
    ],
    faq: [
      {
        q: 'Does formatting change my JSON?',
        a: 'Only the whitespace. Keys, values and order stay the same unless you turn on Sort keys, and numbers keep their original digits.',
      },
      {
        q: 'What is the difference between the JSON Formatter and the JSON Validator?',
        a: 'The formatter is output-first: it re-prints valid JSON the way you want it. The validator focuses on the input and reports duplicate keys, precision loss and the exact position of every problem.',
      },
      {
        q: 'Can it format JSON with comments?',
        a: 'Yes — turn on Lenient (JSONC/JSON5). Comments and trailing commas are removed and the output is strict JSON. Other JSON5 syntax, such as single quotes, is still reported as an error.',
      },
      {
        q: '2 spaces or 4?',
        a: 'Either is valid. Two spaces is the common default in JavaScript projects and API docs; four is common in Python and Java codebases. Tabs keep files smallest while staying readable.',
      },
      {
        q: 'Is my JSON uploaded anywhere?',
        a: 'No. Parsing and formatting run in this tab, large documents in a Web Worker, and nothing is sent over the network.',
      },
    ],
  },

  '/xml-formatter': {
    title: 'XML Formatter & Validator Online — Pretty-Print XML | DevPocket',
    description:
      'Pretty-print or minify XML and check it is well-formed, with the exact line and column of any error. Collapsible tree, XPath and attribute search, in your browser.',
    heading: 'XML Formatter',
    aboutLabel: 'XML formatting',
    blurb:
      'Paste XML — a SOAP response, a Maven pom.xml, an RSS feed, an SVG — and get it indented and checked for well-formedness, with the line and column of the first error. Browse it as a collapsible element tree, run an XPath expression against it, or find every attribute with a given name or value.',
    related: [
      ['/json-formatter', 'Format the JSON version of the same payload'],
      ['/html-entities', 'Escape & < > and quotes for text inside XML or HTML'],
      ['/diff', 'Compare two formatted XML files line by line'],
      ['/yaml', 'Format YAML when the config moved on from XML'],
      ['/properties', 'Read the Spring .properties that replaced an XML config'],
    ],
    deepDive: {
      heading: 'Well-formed XML is the check every parser makes first',
      body: [
        'An XML document is well-formed when every start tag has a matching end tag, elements nest without overlapping, attribute values are quoted, there is exactly one root element, and every & or < in text is escaped. A parser that finds any of these problems must stop, which is why a single stray ampersand in a config file breaks a whole deployment. This formatter checks exactly those rules and reports the first failure with its line and column, then pretty-prints the document when it passes.',
        'Well-formed is not the same as valid. Validity means the document also matches a schema (XSD) or DTD — the right elements in the right order. That needs the schema, so this page does not claim it; it tells you the file will parse, which is the question behind most "invalid XML" errors. Text that is only whitespace between elements is dropped when formatting, and text inside an element is kept, so mixed content like <p>Hello <b>you</b></p> should be checked after formatting. To escape a value before pasting it into an element, use the [HTML entity encoder](/html-entities), which applies the same five escapes XML needs.',
        'XPath runs in your browser’s built-in XML engine (XPath 1.0), so expressions such as //book[price > 10]/@id or count(//item) work as they would in most server libraries. Namespaced documents are common in SOAP and Maven files: declared prefixes resolve as written, and a default namespace is available as d:, since XPath 1.0 cannot match it without a prefix.',
      ],
      example: {
        inputLabel: 'Minified XML',
        input: '<order id="7"><item sku="A1" qty="2"/><note>Leave at door &amp; ring</note></order>',
        outputLabel: 'Pretty-printed',
        output: `<order id="7">
  <item sku="A1" qty="2"/>
  <note>Leave at door &amp; ring</note>
</order>`,
        note: 'Write "door & ring" without &amp; and the formatter stops at that character: Unescaped "&" — write &amp; (or use a CDATA section).',
      },
      gotchas: [
        {
          title: 'An unescaped & in text or a URL',
          detail: 'Query strings in XML (…?a=1&b=2) must be written with &amp;. It is the most common reason a hand-edited config stops parsing.',
        },
        {
          title: 'Whitespace before the XML declaration',
          detail: '<?xml version="1.0"?> must be the very first bytes of the file. A blank line or a byte-order mark from an editor in front of it is a fatal error for strict parsers.',
        },
        {
          title: 'Default namespaces and XPath',
          detail: 'In a document with xmlns="…", //project matches nothing in XPath 1.0. Use the prefix: //d:project here, or declare a prefix in your own code.',
        },
        {
          title: 'Formatting mixed content',
          detail: 'Indenting adds whitespace around child elements. For XHTML or DocBook, where text and tags mix, that can add visible spaces; keep those files minified or format by hand.',
        },
      ],
    },
    howItWorks: [
      'Paste or drop an XML file; it is checked and formatted as you type.',
      'Choose the indent or minify, which also drops comments.',
      'Switch to Tree to expand and collapse elements.',
      'Run XPath or search attributes in the panels below.',
    ],
    useCases: [
      'Reading a SOAP or legacy API response',
      'Finding the stray character that breaks a pom.xml or web.config',
      'Extracting values from a feed or sitemap with XPath',
      'Minifying an SVG or a config before embedding it',
    ],
    faq: [
      {
        q: 'What is the difference between well-formed and valid XML?',
        a: 'Well-formed means the syntax is correct and any parser can read it. Valid means it also matches a DTD or XSD schema. This tool checks well-formedness; schema validation needs the schema file.',
      },
      {
        q: 'Why does my XML fail with an "&" error?',
        a: 'A bare & starts an entity reference. Write &amp; for a literal ampersand, including inside URLs, or wrap the text in <![CDATA[ … ]]>.',
      },
      {
        q: 'Which XPath version does it support?',
        a: 'XPath 1.0, the version built into browsers and supported by most server libraries. Functions such as count(), contains() and position predicates work.',
      },
      {
        q: 'Does minifying change the data?',
        a: 'It removes whitespace-only text between elements and comments. Text inside elements and all attributes are kept.',
      },
    ],
  },

  '/json-to-csv': {
    title: 'JSON to CSV Converter — Flatten Nested JSON Online | DevPocket',
    description:
      'Convert a JSON array to CSV for Excel or Sheets. Nested objects become dot-notation columns; choose delimiter, array handling and quoting. Private, in your browser.',
    heading: 'JSON to CSV Converter',
    aboutLabel: 'JSON to CSV conversion',
    blurb:
      'Paste a JSON array of records and get a CSV with one row per record and one column per key. Nested objects are flattened into dot-notation columns such as customer.city, arrays can stay as JSON, be joined, or spread over indexed columns, and a table preview shows exactly what a spreadsheet will see.',
    related: [
      ['/csv-to-json', 'Turn the CSV back into JSON records'],
      ['/json-flatten', 'See the dot-notation keys each record flattens to'],
      ['/json-formatter', 'Tidy the JSON before converting it'],
      ['/mock', 'Generate sample records to test the export'],
      ['/jsonpath', 'Select the array of records inside a larger response'],
    ],
    deepDive: {
      heading: 'CSV is flat, so nested JSON has to be flattened',
      body: [
        'CSV (RFC 4180) is a table: a header row, then one line per record, with fields separated by a delimiter and quoted when they contain the delimiter, a quote or a line break. JSON has no such limit — objects nest and arrays hold any number of values — so converting means deciding how each nested value becomes a column. This converter walks every record, turns nested object keys into dot-notation names (customer.name, customer.address.city) and collects every key it sees, in first-seen order, as the header. A record missing a key gets an empty cell rather than shifting the columns.',
        'Arrays have no single right answer, so there are three modes. Keep as JSON writes ["en","fr"] into one cell, which round-trips exactly. Join writes en; fr, which reads well in a spreadsheet but loses the difference between a string and a list. One column per index spreads the items over langs[0], langs[1] and so on, which suits short fixed-length arrays such as coordinates. To see the dot-notation keys a record produces before choosing, [flatten one record first](/json-flatten).',
        'Excel on Windows guesses the text encoding of a CSV it opens, and guesses wrong for UTF-8 without a byte-order mark — é turns into Ã©. Tick Add BOM for Excel and the downloaded file starts with U+FEFF, which Excel reads as a UTF-8 marker; Google Sheets and Numbers do not need it. Europe-based spreadsheets that use a comma as the decimal separator expect a semicolon as the delimiter, which the delimiter option provides.',
      ],
      example: {
        inputLabel: 'JSON array',
        input: `[
  { "id": 1, "user": { "name": "Ada", "langs": ["en", "fr"] } },
  { "id": 2, "user": { "name": "Bo" } }
]`,
        outputLabel: 'CSV (arrays kept as JSON)',
        output: `id,user.name,user.langs
1,Ada,"[""en"",""fr""]"
2,Bo,`,
        note: 'The inner quotes are doubled, as RFC 4180 requires. With arrays set to Join, the first row becomes 1,Ada,en; fr.',
      },
      gotchas: [
        {
          title: 'Excel mangles accented characters',
          detail: 'Download with Add BOM for Excel ticked, or import the file through Data → From Text/CSV and choose UTF-8.',
        },
        {
          title: 'Leading zeros and long numbers disappear in a spreadsheet',
          detail: 'The CSV keeps 02134 and 12345678901234567890 exactly; Excel converts them to numbers when it opens the file. Import the column as Text to keep them.',
        },
        {
          title: 'Records with different keys',
          detail: 'Every key from every record becomes a column, so one unusual record can add a mostly empty column. Check the header in the table preview before sharing the file.',
        },
        {
          title: 'A single object instead of an array',
          detail: 'A top-level object becomes one row. If your records sit under a key such as data or items, convert that array rather than the whole response.',
        },
      ],
    },
    howItWorks: [
      'Paste or drop a JSON array; the CSV updates as you type.',
      'Pick the delimiter and how arrays and nested objects are written.',
      'Check the Table tab to see the columns a spreadsheet will get.',
      'Copy the CSV or download it as a .csv file.',
    ],
    useCases: [
      'Opening an API response in Excel or Google Sheets',
      'Handing query results to someone who does not read JSON',
      'Preparing a CSV import for a CRM or a database',
      'Flattening event logs for a quick pivot table',
    ],
    faq: [
      {
        q: 'How are nested objects converted?',
        a: 'Each nested key becomes a dot-notation column, so {"user":{"name":"Ada"}} gives a user.name column. Turn off Flatten nested objects to keep each nested object as a JSON string in one cell.',
      },
      {
        q: 'What happens to arrays?',
        a: 'By default an array is written as JSON in one cell. You can join simple values with "; " or spread them over indexed columns such as tags[0] and tags[1].',
      },
      {
        q: 'Why does Excel show strange characters?',
        a: 'Excel assumes a legacy encoding for CSV files without a byte-order mark. Tick Add BOM for Excel before downloading, and accented letters and emoji open correctly.',
      },
      {
        q: 'Which delimiter should I use?',
        a: 'Comma for most tools; semicolon for spreadsheets set to a European locale, where the comma is the decimal separator; tab when values themselves contain commas and semicolons.',
      },
    ],
  },

  '/csv-to-json': {
    title: 'CSV to JSON Converter — Types & Nested Keys | DevPocket',
    description:
      'Convert CSV or TSV to JSON with the delimiter detected, numbers and booleans typed, and dotted headers nested. Unclosed quotes are shown by line. Runs in your browser.',
    heading: 'CSV to JSON Converter',
    aboutLabel: 'CSV to JSON conversion',
    blurb:
      'Paste CSV or TSV — or drop an export from Excel, Sheets or a database — and get a JSON array with one object per row. The delimiter is detected, numbers, booleans and empty cells are typed, dotted headers such as address.city are nested, and an unclosed quote is reported with the line it starts on.',
    related: [
      ['/json-to-csv', 'Convert the JSON back into a CSV'],
      ['/json-formatter', 'Format or minify the JSON you just made'],
      ['/json-schema-generator', 'Infer a schema from the converted records'],
      ['/codegen', 'Generate TypeScript or Go types for each row'],
      ['/json-unflatten', 'Nest dot-notation keys in an existing JSON object'],
    ],
    deepDive: {
      heading: 'Every CSV cell is text until you decide otherwise',
      body: [
        'CSV has no types: 42, true and 2024-01-15 are all just characters between delimiters. A converter has to decide what to turn into numbers and booleans, and a wrong guess silently changes data. This one converts a cell to a number only when it is written as a plain JSON number without a leading zero, so 02134 (a ZIP code) and 007 (an ID) stay strings, and so does 12345678901234567890, which a JavaScript number cannot hold exactly. true, false and null become their JSON values, and an empty cell becomes null. Turn off type detection and every value stays a string.',
        'The delimiter is detected from the first rows by finding the character — comma, semicolon, tab or pipe — that splits them into the same number of columns, while ignoring separators inside quoted fields. Quoted fields may contain the delimiter, doubled quotes ("") and line breaks, as RFC 4180 allows. An opening quote that never closes swallows the rest of the file, so the error points at the line and column where it opened rather than at the end.',
        'Headers written in dot notation — customer.name, customer.city — are rebuilt into nested objects, which is how the [JSON to CSV converter](/json-to-csv) writes them, so a round trip returns the original shape. Headers with [0] indexes rebuild arrays the same way. Once the records look right, [infer a JSON Schema from them](/json-schema-generator) to document the import.',
      ],
      example: {
        inputLabel: 'Semicolon-separated CSV',
        input: `sku;price;zip;in_stock
A-1;9.90;01234;true
B-2;12;;false`,
        outputLabel: 'JSON (types detected)',
        output: `[
  { "sku": "A-1", "price": 9.9, "zip": "01234", "in_stock": true },
  { "sku": "B-2", "price": 12, "zip": null, "in_stock": false }
]`,
        note: 'The semicolon is detected, 01234 keeps its leading zero as a string, and the empty zip cell becomes null.',
      },
      gotchas: [
        {
          title: 'An unclosed quote',
          detail: 'One stray " makes the parser read every following line as part of that field. The error names the line and column where the quote opened — look there, not at the end of the file.',
        },
        {
          title: 'Excel exports with a byte-order mark',
          detail: 'Files saved as "CSV UTF-8" start with an invisible U+FEFF that some converters glue onto the first header name. It is stripped here; strip it in your own import code too.',
        },
        {
          title: 'Rows with a different number of fields',
          detail: 'A missing or extra delimiter shifts every value after it. Rows that do not match the header length are listed as warnings so you can fix them before importing.',
        },
        {
          title: 'Dates stay strings',
          detail: 'JSON has no date type, so 2024-01-15 is kept as a string. Parse it in the consuming code, where the time zone is known.',
        },
      ],
    },
    howItWorks: [
      'Paste CSV or TSV, or drop the file — the delimiter is detected.',
      'Choose objects or arrays, and whether values are typed and headers nested.',
      'Warnings list rows with the wrong field count and duplicate headers.',
      'Copy the JSON or download it as a .json file.',
    ],
    useCases: [
      'Turning a spreadsheet export into API fixtures',
      'Seeding a database or a mock server from a CSV',
      'Checking a CSV import file before it hits production',
      'Converting a TSV copied from a SQL client',
    ],
    faq: [
      {
        q: 'How does it detect the delimiter?',
        a: 'It tries comma, semicolon, tab and pipe on the first rows and picks the one that gives the same number of columns on every row, ignoring separators inside quotes. You can also choose it yourself.',
      },
      {
        q: 'Why is my ZIP code or ID still a string?',
        a: 'Numbers with a leading zero, and integers too large for a JavaScript number, are kept as strings so no digits are lost. Turn off type detection to keep every value a string.',
      },
      {
        q: 'Can it create nested JSON?',
        a: 'Yes. Headers such as address.city or tags[0] are rebuilt into nested objects and arrays. Turn off Nest dotted headers to keep the header names as flat keys.',
      },
      {
        q: 'What if my CSV has no header row?',
        a: 'Untick First row is a header and each row becomes an array of values instead of an object.',
      },
    ],
  },

  '/json-to-yaml': {
    title: 'JSON to YAML Converter Online — Instant & Private | DevPocket',
    description:
      'Convert JSON to YAML for Kubernetes, Docker Compose or CI config. Strings YAML would misread, like "on" and "NO", are quoted. Choose indent and quoting. In your browser.',
    heading: 'JSON to YAML Converter',
    aboutLabel: 'JSON to YAML conversion',
    blurb:
      'Paste JSON and get YAML as you type — block style, two- or four-space indent, keys optionally sorted. Strings that a YAML parser would read as something else, such as "on", "NO", "3.10" or "22:22", are quoted automatically so the config means what the JSON meant.',
    related: [
      ['/yaml-to-json', 'Convert YAML back into JSON'],
      ['/yaml', 'Lint and format the YAML you produced'],
      ['/json-formatter', 'Check and tidy the JSON before converting'],
      ['/properties-to-yaml', 'Convert Spring .properties to application.yml'],
      ['/docker-guide', 'Look up the Compose and Swarm commands for the file'],
    ],
    deepDive: {
      heading: 'YAML is a superset of JSON — the risk is in the unquoted strings',
      body: [
        'Every JSON document is already valid YAML 1.2, so the conversion is about style: YAML drops the braces, brackets and most quotes and uses indentation instead, which is why Kubernetes manifests, Docker Compose files and CI pipelines are written in it. The data model is the same — maps, lists, strings, numbers, booleans and null — so nothing is lost going from JSON to YAML.',
        'What can go wrong is a string that YAML reads as another type once its quotes are gone. 3.10 becomes the number 3.1, a port mapping such as 22:22 is a base-60 number (1342) to YAML 1.1 parsers, and on, off, yes and no — including the country code NO — are booleans to PyYAML, SnakeYAML (Spring) and go-yaml v2, which also reads y and n that way. This converter quotes any string that would change meaning, so the YAML parses to the same values in both YAML 1.1 and 1.2 tools. Choose single or double quotes everywhere if your style guide asks for it.',
        'Indentation is two spaces by default, the convention for Kubernetes and Compose; list items are indented under their key. Paste the result into the [YAML formatter](/yaml) to lint it, or run it back through the [YAML to JSON converter](/yaml-to-json) to confirm the round trip.',
      ],
      example: {
        inputLabel: 'JSON',
        input: '{"version":"3.10","country":"NO","enabled":true,"ports":["80:80"],"cmd":"echo \\"hi\\"","empty":""}',
        outputLabel: 'YAML',
        output: `version: '3.10'
country: 'NO'
enabled: true
ports:
  - '80:80'
cmd: echo "hi"
empty: ''`,
        note: 'Unquoted, version would load as 3.1 and country as false in YAML 1.1 parsers. enabled is a real boolean, so it stays unquoted.',
      },
      gotchas: [
        {
          title: 'The Norway problem',
          detail: 'NO, no, on and off are booleans to YAML 1.1 parsers. The converter quotes them; if you edit the YAML by hand later, keep the quotes.',
        },
        {
          title: 'Version numbers that lose a digit',
          detail: 'python: 3.10 loads as 3.1. Any version string that looks like a number stays quoted in the output.',
        },
        {
          title: 'Tabs in YAML',
          detail: 'YAML forbids tabs for indentation. The output always uses spaces; an editor that converts them to tabs will break the file.',
        },
        {
          title: 'Key order in sorted output',
          detail: 'Sorting keys helps reviews, but some tools read the first key specially — Kubernetes does not, while some CI systems show jobs in file order. Leave sorting off when order carries meaning.',
        },
      ],
    },
    howItWorks: [
      'Paste or drop JSON; the YAML updates as you type.',
      'Pick 2 or 4 spaces and how strings are quoted.',
      'Sort keys if you want a stable order for reviews.',
      'Copy the YAML or download it as a .yaml file.',
    ],
    useCases: [
      'Writing a Kubernetes manifest from a JSON API response',
      'Converting a package.json-style config to YAML',
      'Moving CI or Compose settings from JSON to YAML',
      'Making a long JSON config easier to review',
    ],
    faq: [
      {
        q: 'Is every JSON file valid YAML?',
        a: 'Yes, for YAML 1.2. Converting still helps because block-style YAML is easier to read and edit, and it is what most config tools expect.',
      },
      {
        q: 'Why are some strings quoted in the output?',
        a: 'They would change type without quotes — "on" or "NO" would become booleans and "3.10" the number 3.1 in common YAML parsers. Quoting keeps the value a string.',
      },
      {
        q: 'Can I get double quotes everywhere?',
        a: 'Yes. Set Strings to Always "double" or Always \'single\'. Numbers, booleans and null are never quoted.',
      },
      {
        q: 'Does it keep large numbers exactly?',
        a: 'The JSON is parsed with a standard parser, so integers above 9007199254740991 are rounded. Send such IDs as strings to keep every digit.',
      },
    ],
  },

  '/yaml-to-json': {
    title: 'YAML to JSON Converter — Multi-Document & Anchors | DevPocket',
    description:
      'Convert YAML to JSON with anchors, aliases and merge keys resolved and multi-document files as an array. YAML 1.1 surprises are flagged by line. In your browser.',
    heading: 'YAML to JSON Converter',
    aboutLabel: 'YAML to JSON conversion',
    blurb:
      'Paste YAML — a Kubernetes manifest, a Compose file, a CI pipeline — and get JSON as you type. Anchors, aliases and <<: merge keys are expanded, several documents separated by --- become an array, and values that YAML 1.1 tools read differently, like on or 0755, are flagged with their line.',
    related: [
      ['/json-to-yaml', 'Convert JSON back into YAML'],
      ['/yaml', 'Format and lint the YAML itself'],
      ['/json-formatter', 'Minify or re-indent the JSON output'],
      ['/jsonpath', 'Query the converted JSON with a $.path expression'],
      ['/yaml-to-properties', 'Flatten application.yml into Spring .properties'],
      ['/json-merge', 'Merge the converted JSON with base settings'],
    ],
    deepDive: {
      heading: 'Converting YAML means resolving everything YAML adds to JSON',
      body: [
        'YAML has features JSON lacks. Anchors (&name) label a node and aliases (*name) repeat it; the <<: merge key copies a map into another, which is how Compose and CI files share defaults. Comments disappear, because JSON has nowhere to put them. A file can also hold several documents separated by ---, as kubectl manifests often do. The converter expands every alias and merge into full copies, drops comments, and returns multiple documents as a JSON array, or only the first if you untick the option.',
        'The harder part is types. This converter follows YAML 1.2, where only true and false are booleans and 0755 is the decimal number 755. Many tools still use YAML 1.1 rules: PyYAML, Ruby, SnakeYAML in Spring Boot and go-yaml v2 read yes, no, on and off as booleans and 0755 as octal 493. When the input contains such a plain value, a warning names the line, so you can quote it and get the same result everywhere. See the [YAML 1.2 specification](https://yaml.org/spec/1.2.2/) for the full rules.',
        'Errors are reported with a line and column, usually for indentation that does not line up or an unclosed [ or {. Once the JSON looks right, [query it with JSONPath](/jsonpath) or format it for a request body.',
      ],
      example: {
        inputLabel: 'YAML with an anchor, a merge and two documents',
        input: `base: &b
  image: nginx:1.27
  restart: always
web:
  <<: *b
  ports: ["80:80"]
---
kind: Second`,
        outputLabel: 'JSON array',
        output: `[
  {
    "base": { "image": "nginx:1.27", "restart": "always" },
    "web": { "image": "nginx:1.27", "restart": "always", "ports": ["80:80"] }
  },
  { "kind": "Second" }
]`,
        note: 'The merge key copies image and restart into web, and the second document becomes the second array item.',
      },
      gotchas: [
        {
          title: 'on, off, yes and no',
          detail: 'Here they are strings, as YAML 1.2 says; in PyYAML or Spring they are booleans. The warnings list each one — quote it if the value must be a string.',
        },
        {
          title: 'Octal-looking numbers',
          detail: 'file_mode: 0755 is 755 in YAML 1.2 and 493 in YAML 1.1. Write 0o755 for YAML 1.2 octal, or quote it.',
        },
        {
          title: 'Anchors inflate the output',
          detail: 'Every alias becomes a full copy, so a small YAML file with shared defaults can become a much larger JSON file. That is expected.',
        },
        {
          title: 'Indentation with tabs',
          detail: 'YAML does not allow tabs for indentation; the error points at the first one. Replace them with spaces.',
        },
      ],
    },
    howItWorks: [
      'Paste or drop YAML; the JSON updates as you type.',
      'Choose the indent, or minified output.',
      'Decide whether several documents become an array or only the first is kept.',
      'Read the YAML 1.1 warnings, then copy or download the .json file.',
    ],
    useCases: [
      'Sending a Kubernetes manifest to an API that takes JSON',
      'Checking what a Compose file with anchors really contains',
      'Feeding YAML config into jq or a JSON Schema validator',
      'Debugging a CI pipeline that reads a value differently than expected',
    ],
    faq: [
      {
        q: 'Are comments kept?',
        a: 'No. JSON has no comment syntax, so comments are dropped. Keep the YAML as the source of truth if the comments matter.',
      },
      {
        q: 'How are multiple documents handled?',
        a: 'Documents separated by --- become items of a JSON array. Untick the option to convert only the first document.',
      },
      {
        q: 'Why is "on" a string here but true in my app?',
        a: 'This converter follows YAML 1.2, where only true and false are booleans. Your app probably uses a YAML 1.1 parser. Quote the value so both agree.',
      },
      {
        q: 'Are anchors and merge keys supported?',
        a: 'Yes. Aliases are replaced with copies of the anchored node and <<: merges are applied, so the JSON contains the final values.',
      },
    ],
  },
}
