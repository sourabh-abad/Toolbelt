# Graph Report - .  (2026-09-30)

## Corpus Check
- 184 files · ~201,856 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 975 nodes · 2667 edges · 50 communities (43 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Editors and UI
- Base64 Decoding
- JSON Tree Utilities
- Navigation and Favorites
- Syntax Highlighting
- Properties Conversion
- Static Site Prerendering
- Timestamp Conversion
- Build Verification
- Guide Page UI
- CSV and Mock Data
- YAML Processing
- Navigation and Content
- Route Loading
- Brand Icons
- Runtime Dependencies
- Build Dependencies
- Feedback Delivery
- SEO Content
- XML Processing
- Error Recovery
- Regex Utilities
- Data Converter Pages
- Site Metadata and Assets
- Tool Navigation Cards
- Case Conversion
- HTML Entities
- Number Base Conversion
- Deployment Pipeline
- Code Generation
- URL Encoding
- Cron Parsing
- Lint Configuration
- NPM Scripts
- Cloudflare Cache Management
- HTTP Reference
- URL Parsing
- Project Metadata
- Redirect CSV Generation
- Brand Image Assets
- Asset Retention
- Lorem Ipsum Generation
- Profile Assets
- Analytics Privacy
- Lucide Icons
- MD5 Library
- Mermaid Diagrams
- SQL Formatting
- Feedback Documentation

## God Nodes (most connected - your core abstractions)
1. `useToast()` - 69 edges
2. `react` - 68 edges
3. `PageHeader()` - 45 edges
4. `Panel()` - 43 edges
5. `Button()` - 42 edges
6. `CopyButton()` - 37 edges
7. `useDebounced()` - 33 edges
8. `Input()` - 29 edges
9. `CodeViewer()` - 25 edges
10. `Checkbox()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `UUID Generator Interface Screenshot` --references--> `DevPocket`  [EXTRACTED]
  Claude outputs/about-card.png → README.md
- `DevPocket Social Sharing Card` --references--> `DevPocket`  [EXTRACTED]
  public/og.png → README.md
- `Release Asset Retention` --semantically_similar_to--> `Chunk Compatibility Recovery`  [INFERRED] [semantically similar]
  .github/workflows/deploy.yml → README.md
- `Asset Load Recovery` --semantically_similar_to--> `Chunk Compatibility Recovery`  [INFERRED] [semantically similar]
  index.html → README.md
- `Sourabh Kumar JPEG Portrait` --references--> `Sourabh Kumar`  [INFERRED]
  public/sourabh.jpg → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **GitHub Pages Release Flow** — _github_workflows_deploy_build_job, _github_workflows_deploy_github_pages_job, _github_workflows_deploy_cloudflare_purge_job, _github_workflows_deploy_release_asset_retention [EXTRACTED 1.00]
- **DevPocket Brand Icon System** — public_apple_touch_icon_devpocket_brandmark, public_favicon_96_devpocket_brandmark, public_favicon_devpocket_brandmark, public_icon_192_devpocket_brandmark, public_icon_512_devpocket_brandmark [INFERRED 0.95]

## Communities (50 total, 7 thin omitted)

### Community 0 - "Editors and UI"
Cohesion: 0.07
Nodes (80): react, CodeEditor(), PLAIN_ABOVE, CodeViewer(), more(), ACCEPT, FileDrop(), UploadButton() (+72 more)

### Community 1 - "Base64 Decoding"
Cohesion: 0.06
Nodes (69): RFC-4648, Base64Error, bytesToText(), decodeToBytes(), describe(), encodeBytes(), encodeText(), looksLikeBase64() (+61 more)

### Community 2 - "JSON Tree Utilities"
Cohesion: 0.05
Nodes (52): AUTO_COLLAPSE_NODES, buildRows(), TYPE_TONE, typeOf(), ConvertError, csvField(), csvToJson(), DELIMS (+44 more)

### Community 3 - "Navigation and Favorites"
Cohesion: 0.07
Nodes (51): CommandPalette(), IdInspector(), FavoriteButton(), commit(), favArray, favSet, getSnapshot(), isFavorite() (+43 more)

### Community 4 - "Syntax Highlighting"
Cohesion: 0.07
Nodes (44): cache, CLASS_FOR_GROUP, CODE_LANGUAGES, COMMENT, highlightCode(), highlightProperties(), highlightYaml(), highlightYamlValue() (+36 more)

### Community 5 - "Properties Conversion"
Cohesion: 0.12
Nodes (44): convert(), coerce(), compareKeys(), compareValues(), continues(), escapeKey(), escapeText(), escapeValue() (+36 more)

### Community 6 - "Static Site Prerendering"
Cohesion: 0.09
Nodes (28): appSrc, buildDate, buildLdJson(), chunkClosure(), dist, esc(), faqLd(), gitDate() (+20 more)

### Community 7 - "Timestamp Conversion"
Cohesion: 0.18
Nodes (24): RFC-2822, batchCsv(), convertBatch(), DEFAULT_ZONES, isoIn(), offsetOf(), pad(), parseDateString() (+16 more)

### Community 8 - "Build Verification"
Cohesion: 0.08
Nodes (16): byDesc, byTitle, dist, errors, home, inbound, pages, relatedSig (+8 more)

### Community 9 - "Guide Page UI"
Cohesion: 0.13
Nodes (12): CHIP_TONES, DEFAULT_LABELS, GuidePage(), KIND_TONES, CATEGORIES, ENTRIES, KINDS, SAMPLE_STACK (+4 more)

### Community 10 - "CSV and Mock Data"
Cohesion: 0.11
Nodes (18): coerce(), csvToObjects(), escapeField(), RFC-4180, objectsToCsv(), parseCsv(), CITIES, COMPANIES (+10 more)

### Community 11 - "YAML Processing"
Cohesion: 0.25
Nodes (18): collapseBlanks(), DUMP_DEFAULTS, eachLine(), findIndentTabs(), format(), indentOf(), opensBlockScalar(), splitLineComment() (+10 more)

### Community 12 - "Navigation and Content"
Cohesion: 0.19
Nodes (13): Link, NavLink, Logo(), SeoFooter(), relatedTools(), teaserFor(), ToolContentSections(), TopNav() (+5 more)

### Community 13 - "Route Loading"
Cohesion: 0.16
Nodes (15): App(), LAZY, lazyFor(), LOADERS, Page(), prefetch(), prefetched, preloadRoute() (+7 more)

### Community 14 - "Brand Icons"
Cohesion: 0.18
Nodes (11): Avatar(), InstagramIcon(), LinkedinIcon(), MediumIcon(), activeLinks(), mailto(), PROFILE, SITE_URL (+3 more)

### Community 15 - "Runtime Dependencies"
Cohesion: 0.12
Nodes (17): cronstrue, diff, fast-xml-parser, js-yaml, marked, dependencies, cronstrue, diff (+9 more)

### Community 16 - "Build Dependencies"
Cohesion: 0.12
Nodes (17): gh-pages, oxlint, devDependencies, gh-pages, oxlint, tailwindcss, @tailwindcss/vite, @types/react (+9 more)

### Community 17 - "Feedback Delivery"
Cohesion: 0.25
Nodes (14): draft, FeedbackDialog(), ICONS, ACCESS_KEY, FEEDBACK_TO, FeedbackError, isConfigured(), MAX_MESSAGE (+6 more)

### Community 18 - "SEO Content"
Cohesion: 0.15
Nodes (8): MAPPING, canonicalUrl(), ROUTES, SEO, SITE_NAME, SITE_ORIGIN, setMeta(), useSeo()

### Community 19 - "XML Processing"
Cohesion: 0.24
Nodes (13): decode(), escAttr(), escText(), lineCol(), openTag(), parseXml(), searchAttributes(), serialize() (+5 more)

### Community 20 - "Error Recovery"
Cohesion: 0.23
Nodes (7): ErrorBoundary, isChunkLoadError(), reloadOnce(), readInitial(), ThemeContext, ThemeProvider(), root

### Community 21 - "Regex Utilities"
Cohesion: 0.34
Nodes (11): CHEATSHEET, compile(), countGroups(), findMatches(), FLAGS, highlightHtml(), insertToken(), MAX_MATCHES (+3 more)

### Community 23 - "Site Metadata and Assets"
Cohesion: 0.15
Nodes (13): UUID Generator Interface Screenshot, JWT Security Guidance Screenshot, DevPocket WebApplication Structured Data, Search and Social Metadata, DevPocket Social Sharing Card, Accessible Responsive Interface, DevPocket, Indexable Prerendering (+5 more)

### Community 24 - "Tool Navigation Cards"
Cohesion: 0.24
Nodes (9): ToolCard(), PrivacyBadge(), getRecent(), NAV_GROUPS, isApplePlatform(), shortcutLabel(), BADGES, Home() (+1 more)

### Community 25 - "Case Conversion"
Cohesion: 0.33
Nodes (9): CASES, convertAll(), convertLines(), detectCase(), prepare(), splitWords(), stripAccents(), as() (+1 more)

### Community 26 - "HTML Entities"
Cohesion: 0.36
Nodes (9): COMMON, decodeBasic(), decodeEntities(), encodeEntities(), findReferences(), fromCodePoint(), MODES, NAME_FOR (+1 more)

### Community 27 - "Number Base Conversion"
Cohesion: 0.38
Nodes (9): BASES, bitLength(), convert(), fixedWidths(), group(), parseInBase(), PREFIX, toBase() (+1 more)

### Community 28 - "Deployment Pipeline"
Cohesion: 0.27
Nodes (10): Build Job, GitHub Pages CI Deployment, Cloudflare Cache Purge Job, GitHub Pages Deploy Job, Release Asset Retention, Archived GitHub Pages CI Deployment, Asset Load Recovery, Chunk Compatibility Recovery (+2 more)

### Community 29 - "Code Generation"
Cohesion: 0.38
Nodes (9): camel(), collect(), DEFAULT_LANGUAGE, generate(), kindOf(), pascal(), renderType(), snake() (+1 more)

### Community 30 - "URL Encoding"
Cohesion: 0.44
Nodes (7): RFC-3986, decode(), encode(), encodedCharacters(), findMalformed(), looksDoubleEncoded(), UrlEncodeTool()

### Community 31 - "Cron Parsing"
Cohesion: 0.36
Nodes (8): CRON_PRESETS, DAYS, MONTHS, nextRuns(), normalizeNames(), parseCron(), parseField(), RANGES

### Community 32 - "Lint Configuration"
Cohesion: 0.25
Nodes (7): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, warn

### Community 33 - "NPM Scripts"
Cohesion: 0.25
Nodes (8): scripts, build, deploy, dev, lint, predeploy, preview, test

### Community 34 - "Cloudflare Cache Management"
Cohesion: 0.32
Nodes (5): CACHE_RULES, cf(), HEADER_RULES, mergePhase(), purge()

### Community 35 - "HTTP Reference"
Cohesion: 0.39
Nodes (4): CATEGORY_STYLES, HEADERS, METHODS, STATUS_CODES

### Community 36 - "URL Parsing"
Cohesion: 0.50
Nodes (6): paramsToJson(), parseUrl(), safeDecode(), warningsFor(), withParams(), UrlParserTool()

### Community 37 - "Project Metadata"
Cohesion: 0.33
Nodes (5): description, name, private, type, version

### Community 38 - "Redirect CSV Generation"
Cohesion: 0.33
Nodes (4): file, root, src, want

### Community 39 - "Brand Image Assets"
Cohesion: 0.40
Nodes (5): DevPocket Apple Touch Brandmark, DevPocket PNG Favicon Brandmark, DevPocket SVG Favicon Brandmark, DevPocket 192px App Brandmark, DevPocket 512px App Brandmark

### Community 40 - "Asset Retention"
Cohesion: 0.50
Nodes (4): now, origin, text(), toCarry()

### Community 41 - "Lorem Ipsum Generation"
Cohesion: 0.80
Nodes (5): LoremTool(), paragraph(), pick(), rand(), sentence()

### Community 42 - "Profile Assets"
Cohesion: 0.67
Nodes (3): Sourabh Kumar JPEG Portrait, Sourabh Kumar WebP Portrait, Sourabh Kumar

## Knowledge Gaps
- **200 isolated node(s):** `$schema`, `oxc`, `react/rules-of-hooks`, `warn`, `name` (+195 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Editors and UI` to `Lint Configuration`, `Base64 Decoding`, `JSON Tree Utilities`, `Navigation and Favorites`, `Syntax Highlighting`, `HTTP Reference`, `Timestamp Conversion`, `Guide Page UI`, `YAML Processing`, `Navigation and Content`, `Route Loading`, `Brand Icons`, `Feedback Delivery`, `SEO Content`, `Error Recovery`, `Regex Utilities`, `Tool Navigation Cards`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **Why does `useToast()` connect `Editors and UI` to `Base64 Decoding`, `Navigation and Favorites`, `Syntax Highlighting`, `Properties Conversion`, `URL Parsing`, `Timestamp Conversion`, `Guide Page UI`, `Lorem Ipsum Generation`, `CSV and Mock Data`, `YAML Processing`, `XML Processing`, `Regex Utilities`, `Data Converter Pages`, `Case Conversion`, `HTML Entities`, `Number Base Conversion`, `URL Encoding`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `PageHeader()` connect `Editors and UI` to `Base64 Decoding`, `HTTP Reference`, `Syntax Highlighting`, `Navigation and Favorites`, `Timestamp Conversion`, `Guide Page UI`, `YAML Processing`, `Navigation and Content`, `Brand Icons`, `Regex Utilities`, `Tool Navigation Cards`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `$schema`, `oxc`, `react/rules-of-hooks` to the rest of the system?**
  _200 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Editors and UI` be split into smaller, more focused modules?**
  _Cohesion score 0.07063112326270221 - nodes in this community are weakly interconnected._
- **Should `Base64 Decoding` be split into smaller, more focused modules?**
  _Cohesion score 0.05730238025271819 - nodes in this community are weakly interconnected._
- **Should `JSON Tree Utilities` be split into smaller, more focused modules?**
  _Cohesion score 0.05297297297297297 - nodes in this community are weakly interconnected._