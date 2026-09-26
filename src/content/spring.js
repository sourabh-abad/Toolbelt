// Page copy for the Spring .properties ⇄ YAML converters. Merged into SEO in
// src/lib/seo.js.

const MAPPING = {
  caption: 'How each .properties construct maps to YAML, and back',
  columns: ['.properties', 'application.yml', 'Notes'],
  codeColumns: [0, 1],
  rows: [
    ['server.port=8080', 'server:\n  port: 8080', 'Each dot is one level of nesting'],
    ['app.hosts[0]=a\napp.hosts[1]=b', 'app:\n  hosts:\n    - a\n    - b', '[n] indexes become a list, in index order'],
    ['app.servers[0].port=9000', 'app:\n  servers:\n    - port: 9000', 'Objects inside lists work the same way'],
    ['#---', '---', 'Starts a new document (Spring Boot 2.4+)'],
    ['spring.config.activate.on-profile=prod', 'spring.config.activate.on-profile: prod', 'Activates that document for a profile'],
    ['url=${DB_HOST:localhost}', 'url: ${DB_HOST:localhost}', 'Placeholders are copied verbatim; Spring resolves them'],
    ['name=Caf\\u00e9', 'name: Café', 'Escapes decoded to YAML; re-escaped for .properties'],
    ['flag=on', "flag: 'on'", 'Quoted: SnakeYAML would read on as true'],
    ['# comment', '# comment', 'Kept above the key that follows it'],
  ],
}

export default {
  '/properties-to-yaml': {
    title: 'Properties to YAML — Spring Boot application.yml | DevPocket',
    description:
      'Convert Spring Boot application.properties to application.yml. Dotted keys nest, [0] indexes become lists, #--- profiles become YAML documents, comments are kept.',
    heading: 'Properties to YAML Converter',
    aboutLabel: 'converting .properties to YAML',
    blurb:
      'Paste an application.properties file and get the equivalent application.yml: dotted keys nested, [0]-style indexes turned into lists, #--- documents with spring.config.activate.on-profile turned into YAML documents, ${placeholders} left alone and comments carried across above the keys they describe.',
    related: [
      ['/yaml-to-properties', 'Convert application.yml back to .properties'],
      ['/properties', 'Check the file for duplicate keys and hidden whitespace first'],
      ['/properties-compare', 'Compare two .properties files key by key'],
      ['/yaml', 'Lint and format the YAML you produced'],
      ['/json-to-yaml', 'Convert a JSON config to YAML instead'],
    ],
    deepDive: {
      heading: 'Same configuration, different shape',
      body: [
        'Spring Boot reads application.properties and application.yml into the same flat set of keys, so converting between them should change nothing about how the application is configured. In .properties every key is spelled out in full — spring.datasource.url, spring.datasource.username — while YAML writes the shared prefix once and nests the rest under it. This converter uses the same parser as the [Properties Viewer](/properties), so escapes, line continuations and all three separators (=, : and a space) are read exactly as java.util.Properties reads them.',
        'Lists use indexes in .properties — app.hosts[0], app.hosts[1] — and become YAML sequences; objects inside lists, such as app.servers[0].port, become sequences of maps. A file split into documents with #--- (Spring Boot 2.4 and later) becomes a multi-document YAML file separated by ---, and spring.config.activate.on-profile moves along with its document, so profile-specific overrides keep applying to the same profiles. ${…} placeholders are copied as they are for Spring to resolve at startup.',
        'Values are typed where it is safe: 8080 and true are written unquoted, while strings YAML would misread — on, off, yes, no, leading zeros — are quoted. Spring binds either form to the same property, so this only changes how the file reads. When a key is both a value and a parent (a=1 next to a.b=2), YAML cannot express it; the key is kept flat and flagged. To go the other way, use [YAML to Properties](/yaml-to-properties).',
      ],
      table: MAPPING,
      example: {
        inputLabel: 'application.properties',
        input: `spring.datasource.url=jdbc:mysql://\${DB_HOST}/shop
spring.datasource.hikari.maximum-pool-size=10
app.admins[0]=ada@example.com
app.admins[1]=bo@example.com
#---
spring.config.activate.on-profile=test
spring.datasource.url=jdbc:h2:mem:shop`,
        outputLabel: 'application.yml',
        output: `spring:
  datasource:
    url: jdbc:mysql://\${DB_HOST}/shop
    hikari:
      maximum-pool-size: 10
app:
  admins:
    - ada@example.com
    - bo@example.com
---
spring:
  config:
    activate:
      on-profile: test
  datasource:
    url: jdbc:h2:mem:shop`,
        note: 'The second document overrides the datasource only when the test profile is active, in both files.',
      },
      gotchas: [
        {
          title: 'A key that is also a parent',
          detail: 'logging.level=info next to logging.level.root=warn cannot both exist in YAML, because logging.level would have to be a value and a map at once. The later key is kept flat and listed in the warnings; remove or rename one of them.',
        },
        {
          title: 'Gaps in list indexes',
          detail: 'hosts[0] and hosts[2] with no [1] produce a list with a null in the middle. Spring binds that to an empty element, which is rarely what was meant.',
        },
        {
          title: 'Old-style profile documents',
          detail: 'spring.profiles=dev is the pre-2.4 way to activate a document and is rejected by newer Spring Boot versions. Use spring.config.activate.on-profile; the converter warns when it sees the old key.',
        },
        {
          title: 'Comments attached to the wrong key',
          detail: 'A comment is placed above the key that followed it. A comment describing a whole section may end up above that section’s first nested key — check section headers after converting.',
        },
      ],
    },
    howItWorks: [
      'Paste or drop an application.properties file.',
      'Choose 2 or 4 spaces, typed values and whether to keep comments.',
      'Read any warnings about keys that could not be nested.',
      'Download application.yml or swap direction to convert back.',
    ],
    useCases: [
      'Moving a Spring Boot service from .properties to application.yml',
      'Reading a long .properties file as a tree',
      'Converting profile-specific files into one multi-document YAML',
      'Preparing config for a Kubernetes ConfigMap in YAML',
    ],
    faq: [
      {
        q: 'Does Spring Boot treat the YAML exactly like the .properties file?',
        a: 'Yes — both are flattened into the same keys. Differences only appear for things YAML cannot express, such as a key that is both a value and a parent, which the converter reports.',
      },
      {
        q: 'How are profiles converted?',
        a: 'Each #--- document becomes a YAML document after ---, keeping its spring.config.activate.on-profile key, so it applies to the same profile.',
      },
      {
        q: 'Are ${…} placeholders changed?',
        a: 'No. They are copied as-is, including defaults like ${PORT:8080}, for Spring to resolve at startup.',
      },
      {
        q: 'What about \\uXXXX escapes?',
        a: 'They are decoded, so Caf\\u00e9 becomes Café in the YAML, which Spring reads as UTF-8.',
      },
    ],
  },

  '/yaml-to-properties': {
    title: 'YAML to Properties Converter for Spring Boot | DevPocket',
    description:
      'Convert Spring Boot application.yml to application.properties: nested keys flattened to dots, lists to [0] indexes, --- documents to #---, non-ASCII escaped as \\uXXXX.',
    heading: 'YAML to Properties Converter',
    aboutLabel: 'converting YAML to .properties',
    blurb:
      'Paste an application.yml and get application.properties with every nested key spelled out in dot notation, lists written as [0], [1] indexes, multiple documents separated by #---, placeholders untouched and non-ASCII characters escaped as \\uXXXX so the file reads correctly as ISO-8859-1.',
    related: [
      ['/properties-to-yaml', 'Convert .properties back to application.yml'],
      ['/properties', 'Sort, dedupe and inspect the resulting file'],
      ['/properties-compare', 'Diff the output against the file you had before'],
      ['/yaml-to-json', 'See the same YAML as JSON, anchors resolved'],
      ['/yaml', 'Find YAML syntax errors before converting'],
    ],
    deepDive: {
      heading: 'Flattening YAML the way Spring does',
      body: [
        'Spring Boot turns application.yml into flat keys before binding them, and this converter produces the same keys: each level of nesting becomes a dot, and each list item gets an index in brackets, so app.cors.allowed-origins becomes app.cors.allowed-origins[0] and [1]. Anchors, aliases and <<: merges are expanded first, because .properties has no way to share values. Full-line comments are carried across above the first key they describe; comments at the end of a line are dropped.',
        'A multi-document YAML file — documents separated by --- — becomes a .properties file split with #---, which Spring Boot 2.4 and later reads as separate documents, each with its own spring.config.activate.on-profile. ${…} placeholders are copied as they are. Choose the separator style your team uses: key=value, key: value or key = value all mean the same to java.util.Properties.',
        'Encoding is the part that bites. java.util.Properties and Spring Boot read .properties files as ISO-8859-1, so an é saved as UTF-8 is read as two garbage characters. By default the converter writes non-ASCII characters as \\uXXXX escapes, which every reader decodes the same way. To check the result for duplicate or suspicious keys, paste it into the [Properties Viewer](/properties); to see the YAML as data, [convert it to JSON](/yaml-to-json).',
      ],
      table: MAPPING,
      example: {
        inputLabel: 'application.yml',
        input: `app:
  # shown on the login page
  title: Café Élan
  ports: [8080, 8443]`,
        outputLabel: 'application.properties',
        output: `# shown on the login page
app.title=Caf\\u00e9 \\u00c9lan
app.ports[0]=8080
app.ports[1]=8443`,
        note: 'The comment moves with the key it describes, and the accented letters are escaped so the file is safe as ISO-8859-1.',
      },
      gotchas: [
        {
          title: 'UTF-8 characters in .properties',
          detail: 'Spring Boot reads .properties as ISO-8859-1. Keep \\uXXXX escaping on unless you have configured your loader for UTF-8.',
        },
        {
          title: 'Map keys that contain dots',
          detail: 'A YAML key such as "example.com": true inside a map becomes a longer dotted key. Spring needs [brackets] to keep the dot: app.hosts[example.com]=true.',
        },
        {
          title: 'Empty values',
          detail: 'key: (null) and key: [] both become key= with an empty value. Spring binds that as an empty string, not as null.',
        },
        {
          title: 'Anchors are expanded',
          detail: 'Shared blocks defined with & and reused with * or <<: are written out in full for every key that uses them, so the .properties file is longer than the YAML.',
        },
      ],
    },
    howItWorks: [
      'Paste or drop an application.yml file.',
      'Choose the separator, and whether to escape non-ASCII and keep comments.',
      'Each YAML document becomes a #--- section.',
      'Download application.properties or swap direction to convert back.',
    ],
    useCases: [
      'Moving configuration from application.yml to .properties',
      'Getting the exact key names to set as environment variables or -D flags',
      'Flattening a YAML config for a tool that only reads properties',
      'Reviewing which keys a large YAML file actually sets',
    ],
    faq: [
      {
        q: 'How are YAML lists converted?',
        a: 'Each item gets an index: hosts: [a, b] becomes hosts[0]=a and hosts[1]=b. Lists of objects become keys like servers[0].port.',
      },
      {
        q: 'Why are accented characters written as \\u00e9?',
        a: 'Spring Boot and java.util.Properties read .properties files as ISO-8859-1. \\uXXXX escapes are read the same way everywhere. Untick the option to write the characters directly.',
      },
      {
        q: 'Are comments kept?',
        a: 'Full-line comments are, placed above the first key they describe. Comments at the end of a line are dropped.',
      },
      {
        q: 'Does it handle Spring profiles?',
        a: 'Yes. Each YAML document separated by --- becomes a #--- document, keeping its spring.config.activate.on-profile key.',
      },
    ],
  },
}
