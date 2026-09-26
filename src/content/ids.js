// Page copy for the UUID generator and the UUID v7 page. Merged into SEO in
// src/lib/seo.js.

export default {
  '/uuid': {
    title: 'UUID Generator — v4 & v7, Bulk, Copy or Download | DevPocket',
    description:
      'Generate UUID v4 or time-ordered v7, ULIDs and Nano IDs — up to 1,000 at once, as .txt, .csv or .json. Inspect any UUID’s version and timestamp. In your browser.',
    heading: 'UUID Generator',
    aboutLabel: 'UUIDs',
    blurb:
      'Generate random UUID v4s, time-ordered UUID v7s, ULIDs or Nano IDs — one or a thousand — and copy them or download them as text, CSV or JSON. Paste any UUID to see its version, its variant and, for v1, v6 and v7, the moment it was created.',
    related: [
      ['/uuid-v7-generator', 'See the v7 bit layout and why it indexes better'],
      ['/timestamp', 'Convert the time inside a v7 or ULID to a date'],
      ['/password', 'Generate random secrets rather than identifiers'],
      ['/mock', 'Fill test records with IDs, names and emails'],
      ['/hash-generator', 'Derive a stable ID from content with a hash'],
    ],
    deepDive: {
      heading: 'Which identifier to generate',
      body: [
        'A UUID is 128 bits written as 32 hexadecimal digits in five groups (8-4-4-4-12). RFC 9562, which replaced RFC 4122 in 2024, defines the versions: the digit after the second hyphen says which one you have. Version 4 is 122 random bits, the safe default when nothing about the ID needs to mean anything. Version 7 puts the Unix time in milliseconds in the first 48 bits, so IDs sort in creation order — which keeps database indexes compact — at the cost of revealing when each ID was made. The [UUID v7 generator](/uuid-v7-generator) shows its layout bit by bit.',
        'ULID is a separate format with the same idea as v7: 48 bits of time and 80 of randomness, written as 26 Crockford base32 characters that sort as text and avoid easily confused letters. Nano ID trades the fixed format for a shorter URL-safe string; 21 characters carry about as much randomness as a v4. The nil UUID (all zeros) and max UUID (all f) are reserved values, useful as "none" and "end of range" sentinels.',
        'Every ID here comes from crypto.getRandomValues, the same generator browsers use for keys, never Math.random. The inspector reads any UUID with or without hyphens, braces or a urn:uuid: prefix. For time-based versions it decodes the embedded timestamp — v1 and v6 count 100-nanosecond steps since 15 October 1582, v7 counts milliseconds since 1970 — and you can [open that time in the Timestamp Converter](/timestamp).',
      ],
      example: {
        inputLabel: 'Inspect',
        input: 'C232AB00-9414-11EC-B3C8-9F6BDECED846',
        outputLabel: 'Result',
        output: `Valid UUID v1 — time-based (Gregorian, with node ID)
Canonical  c232ab00-9414-11ec-b3c8-9f6bdeced846
Variant    RFC 9562 (the standard one)
Created    2022-02-22T19:22:22.000Z`,
        note: 'The example v1 UUID from RFC 9562. Its time fields are stored low-order first, which is why v1 IDs do not sort by time and v6 and v7 were added.',
      },
      gotchas: [
        {
          title: 'Assuming a UUID is secret',
          detail: 'A v4 is hard to guess, but a v7 or v1 reveals its creation time, and v1 can include a MAC address. Do not use any UUID as a password-reset or session token; use a random secret for that.',
        },
        {
          title: 'Case and hyphens in comparisons',
          detail: 'The canonical form is lowercase with hyphens, but systems accept uppercase and bare hex. Normalise before comparing strings, or store UUIDs in a native uuid column.',
        },
        {
          title: 'Random v4 keys in a clustered index',
          detail: 'Inserting random keys into a B-tree touches pages all over the index. On large MySQL (InnoDB) or SQL Server tables, time-ordered v7 keys insert faster and fragment less.',
        },
        {
          title: 'Storing UUIDs as 36-character strings',
          detail: 'A text column takes 36 bytes plus overhead; a binary or native uuid type takes 16. Use PostgreSQL uuid, MySQL BINARY(16) or SQL Server uniqueidentifier.',
        },
      ],
    },
    howItWorks: [
      'Choose UUID v4, UUID v7, ULID, Nano ID or the nil and max values.',
      'Set how many (up to 1,000), and the case and hyphens for UUIDs.',
      'Copy one, copy all, or download .txt, .csv or .json.',
      'Paste any ID into the inspector to check its version and timestamp.',
    ],
    useCases: [
      'Seeding test fixtures and mock rows with unique keys',
      'Choosing between v4 and v7 for a new table’s primary key',
      'Finding out when a v7 ID or ULID in a log was created',
      'Generating idempotency keys or correlation IDs while testing',
    ],
    faq: [
      {
        q: 'What is the difference between UUID v4 and v7?',
        a: 'v4 is entirely random. v7 starts with a millisecond Unix timestamp followed by random bits, so v7 IDs sort by creation time and insert efficiently into database indexes, while revealing when they were made.',
      },
      {
        q: 'Are these UUIDs random enough for production?',
        a: 'Yes. They come from crypto.getRandomValues, the browser’s cryptographic random number generator, and follow the RFC 9562 layout exactly.',
      },
      {
        q: 'Can two UUIDs collide?',
        a: 'In practice, no. With 122 random bits you would need to generate about 2.7 quintillion v4s for a 50% chance of a single collision.',
      },
      {
        q: 'What is a ULID?',
        a: 'A 128-bit ID with a 48-bit millisecond timestamp and 80 random bits, written as 26 Crockford base32 characters. It sorts as text, like UUID v7, but is not a UUID.',
      },
    ],
  },

  '/uuid-v7-generator': {
    title: 'UUID v7 Generator — Time-Ordered UUIDs (RFC 9562) | DevPocket',
    description:
      'Generate UUID v7 — time-ordered UUIDs from RFC 9562 that sort by creation time. See the bit layout, compare v4 and v7, and extract a v7’s timestamp. In your browser.',
    heading: 'UUID v7 Generator',
    aboutLabel: 'UUID v7',
    blurb:
      'Generate UUID version 7 identifiers, which start with the current Unix time in milliseconds and so sort in the order they were created. See exactly which bits hold the time, the version, the variant and the randomness, compare v7 with v4, and paste any v7 to read back when it was made.',
    related: [
      ['/uuid', 'Generate v4, ULID or Nano ID in bulk instead'],
      ['/timestamp', 'Convert a v7’s millisecond timestamp to a date'],
      ['/number-base', 'Read the 48-bit timestamp as hex, binary or decimal'],
      ['/sql', 'Format the DDL for a table keyed by UUID v7'],
      ['/sql-guide', 'Look up primary-key and index syntax per database'],
    ],
    deepDive: {
      heading: 'Why UUID v7 exists: random keys are hard on indexes',
      body: [
        'Databases store primary keys in a B-tree, which works best when new keys arrive in order and land at the end. A random UUID v4 lands anywhere, so each insert may load a different page, split it, and leave the index fragmented and larger than it needs to be. On a table with millions of rows that shows up as slower inserts and more I/O. UUID v7, standardised in RFC 9562 in 2024, keeps what makes UUIDs useful — generated anywhere without coordination, practically unique — and makes them roughly sequential.',
        'The layout is simple. The first 48 bits are the Unix timestamp in milliseconds, big-endian, so the leading hex digits are the time. Then come the 4-bit version (7), 12 bits called rand_a, the 2-bit variant (binary 10), and 62 random bits. RFC 9562 lets rand_a act as a counter within one millisecond; this generator does that, so a thousand IDs made in the same millisecond still sort in the order they were created. The time is readable by anyone, which matters if creation time is sensitive; the [Timestamp Converter](/timestamp) turns it into a date.',
        'Database support is arriving: PostgreSQL 18 has a built-in uuidv7() function, and earlier versions store v7 in the ordinary uuid type, generated by the application. MySQL and MariaDB store it as BINARY(16) — do not use UUID_TO_BIN(…, 1), whose byte swap exists for v1 and would scramble the order of v7. SQL Server sorts uniqueidentifier by its last bytes first, so v7 does not help its clustered indexes; a sequential key suits it better.',
      ],
      example: {
        inputLabel: 'UUID v7 (RFC 9562 example)',
        input: '017f22e2-79b0-7cc3-98c4-dc0c0c07398f',
        outputLabel: 'Decoded',
        output: `unix_ts_ms  017f22e279b0 = 1645557742000
            = 2022-02-22T19:22:22.000Z
ver         7
rand_a      cc3
var         10 (the "9" in 98c4)
rand_b      18c4dc0c0c07398f (62 bits)`,
        note: 'The first 12 hex digits are the millisecond timestamp — sort v7 strings and you have sorted by time.',
      },
      gotchas: [
        {
          title: 'It leaks the creation time',
          detail: 'Anyone who sees a v7 can read when it was generated. Use v4 for IDs that are public and where timing is sensitive, such as invitation links.',
        },
        {
          title: 'Clock skew between servers',
          detail: 'Ordering is only as good as the clocks. IDs from two machines whose clocks differ by a second interleave by that second; that is still far better for an index than random keys.',
        },
        {
          title: 'MySQL UUID_TO_BIN swap flag',
          detail: 'The swap flag reorders v1 time fields. Applied to v7 it moves the timestamp away from the front and destroys the ordering. Store v7 bytes as they are.',
        },
        {
          title: 'Parsing the time from the wrong digits',
          detail: 'Only the first 48 bits (12 hex digits, ignoring the hyphen) are time. Including the version digit in the number gives a date thousands of years out.',
        },
      ],
    },
    howItWorks: [
      'Choose how many v7 UUIDs you need and press Regenerate.',
      'Read the bit layout of the first one, field by field.',
      'Compare v4 and v7 in the table to choose a key type.',
      'Paste any v7 into the extractor to read its timestamp.',
    ],
    useCases: [
      'Choosing a primary-key format for a new PostgreSQL table',
      'Replacing v4 keys that fragment a large index',
      'Reading when an order or event was created from its ID',
      'Generating sortable IDs for fixtures and event logs',
    ],
    faq: [
      {
        q: 'What is UUID v7?',
        a: 'A UUID whose first 48 bits are the Unix time in milliseconds, followed by the version, the variant and 74 random bits. It is defined in RFC 9562 and sorts by creation time.',
      },
      {
        q: 'Should I use UUID v7 as a primary key?',
        a: 'Usually yes for PostgreSQL and MySQL tables with many inserts: v7 keys keep B-tree indexes compact. Prefer v4 when the creation time must not be visible.',
      },
      {
        q: 'Are UUID v7s unique if two are made in the same millisecond?',
        a: 'Yes. 74 bits are random, and this generator also uses rand_a as a counter within a millisecond, so IDs are unique and stay in generation order.',
      },
      {
        q: 'How do I get the timestamp out of a UUID v7?',
        a: 'Take the first 12 hex digits, read them as a hexadecimal number, and you have milliseconds since 1970. The extractor on this page does it for you.',
      },
    ],
  },
}
