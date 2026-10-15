// Page copy for the encoding tools split out of the old /encode-decode/ page.
// Merged into SEO in src/lib/seo.js. Guide paragraphs may contain
// [anchor text](/route) or [anchor](https://…) links.

export default {
  '/base64': {
    title: 'Base64 Decode & Encode Online — Text, Files, Base64URL | DevPocket',
    description:
      'Decode or encode Base64 instantly with full UTF-8 support. Handles Base64URL, files and images, with auto-detection. Free and private — runs entirely in your browser.',
    heading: 'Base64 Decode and Encode',
    aboutLabel: 'Base64 encoding',
    blurb:
      'Paste text to encode it, or paste Base64 and it is detected and decoded as you type — standard or URL-safe alphabet, with or without padding. Drop a file to get its Base64 and a ready-made data: URI; decode Base64 back into a file, with a preview when it is an image.',
    related: [
      ['/jwt-decoder', 'A JWT is three Base64URL segments — decode all of them at once'],
      ['/url-encode', 'Percent-encode Base64 before it goes into a query string'],
      ['/hash-generator', 'Get a digest as Base64 instead of hex'],
      ['/html-entities', 'Escape text for HTML rather than for transport'],
      ['/json-escape', 'Escape a string for a JSON literal instead'],
    ],
    deepDive: {
      heading: 'Base64 is a way to carry bytes through text, not a way to hide them',
      body: [
        'Base64 (RFC 4648) turns every 3 bytes into 4 characters from a 64-letter alphabet, so binary data can travel through systems that only handle text: JSON fields, HTTP headers, email bodies, data: URIs. Anyone can reverse it; it is an encoding, not encryption. The output is always about 33% larger than the input, because 6 bits of payload ride in every 8-bit character.',
        'There are two alphabets. Standard Base64 uses + and / and pads with =. Base64URL (RFC 4648 §5) swaps in - and _ so the result is safe in URLs and filenames, and usually drops the padding — which is what JWTs, WebAuthn and many APIs use. This page reads either alphabet when decoding and detects which one you pasted; to decode a whole token rather than one segment, [open it in the JWT decoder](/jwt-decoder).',
        'Text is always converted to UTF-8 bytes before encoding, which is why an emoji or an accented letter works here while the browser’s own btoa() throws. The formal definition is in [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648).',
      ],
      example: {
        inputLabel: 'Text',
        input: 'café ☕',
        outputLabel: 'Base64 and Base64URL',
        output: `Base64      Y2Fmw6kg4piV
Base64URL   Y2Fmw6kg4piV

"ü?"  →  w7w/   (standard)
       →  w7w_   (URL-safe)`,
        note: 'The first string has no + or /, so both alphabets agree. "ü?" encodes to a / in standard Base64, which becomes _ in Base64URL — the only difference between the two.',
      },
      gotchas: [
        {
          title: 'Garbled characters after decoding',
          detail: 'The bytes decoded fine but were not UTF-8 — often Latin-1 or UTF-16 text from an older system. Decoding them as UTF-8 produces Ã© where é should be. The tool shows binary data instead of guessing when the bytes are not valid UTF-8.',
        },
        {
          title: 'Mixing the two alphabets',
          detail: 'A standard decoder rejects - and _, and a strict URL-safe decoder rejects + and /. If a token fails to decode, check which alphabet the producer used before assuming it is corrupt.',
        },
        {
          title: 'Missing or extra padding',
          detail: 'Base64URL usually omits =, and some decoders insist on it. Length is the tell: a valid unpadded string is never 1 more than a multiple of 4 characters.',
        },
        {
          title: 'Line breaks from MIME and PEM',
          detail: 'Email and certificate formats wrap Base64 at 64 or 76 characters. The line breaks are not part of the data; this decoder ignores whitespace, but some libraries do not.',
        },
        {
          title: 'Using Base64 to "secure" a value',
          detail: 'Basic auth headers, Kubernetes Secrets and many config files store Base64, which anyone can decode. Treat the value as plain text when deciding who may see it.',
        },
      ],
    },
    howItWorks: [
      'Type or paste. Input that looks like Base64 switches the direction to Decode automatically.',
      'Base64URL is detected from - and _ or missing padding; tick the box to force it.',
      'Drop a file to encode its bytes and get a data: URI.',
      'Decoded bytes that are not text are identified (PNG, JPEG, PDF…), previewed if they are an image, and offered as a download.',
    ],
    useCases: [
      'Reading a Base64 value from a Kubernetes Secret or a config file',
      'Turning an icon into a data: URI for CSS or an email',
      'Decoding one segment of a JWT or a WebAuthn payload',
      'Checking what an API returned in a Base64 field',
    ],
    faq: [
      {
        q: 'Is Base64 encryption?',
        a: 'No. It is a reversible encoding with no key; anyone with the string can decode it. Use it to carry data, and encryption (or no storage at all) to protect it.',
      },
      {
        q: 'Why is Base64 about 33% larger?',
        a: 'Each output character carries 6 bits, so 3 bytes (24 bits) become 4 characters. Padding can add up to two more characters at the end.',
      },
      {
        q: 'What is Base64URL?',
        a: 'The URL- and filename-safe variant from RFC 4648 §5: - and _ replace + and /, and the = padding is usually left off. JWTs and many web APIs use it.',
      },
      {
        q: 'Why do I see garbled characters after decoding?',
        a: 'The original text was not UTF-8, or the data is binary. When the bytes are not valid UTF-8 this tool reports binary data and offers a download instead of showing mojibake.',
      },
      {
        q: 'How do I turn an image into Base64?',
        a: 'Drop the image onto the input or use Upload. You get the raw Base64 and a complete data:image/…;base64 URI ready to paste into HTML or CSS.',
      },
    ],
  },

  '/url-encode': {
    title: 'URL Encode & Decode Online — Percent-Encoding Tool | DevPocket',
    description:
      'Encode or decode URLs and query parameters. Choose encodeURIComponent or full-URI mode, and space as %20 or +. Instant and private in your browser.',
    heading: 'URL Encoder and Decoder',
    aboutLabel: 'URL encoding',
    blurb:
      'Percent-encode a value so it survives inside a URL, or decode one you copied from a log. Pick the scope — a single component or a whole URL — and whether spaces become %20 or +. Double encoding is detected and undone in one click.',
    related: [
      ['/url-parser', 'See every part of a URL and edit its query parameters as rows'],
      ['/base64', 'Encode binary or JSON into a URL-safe Base64 string instead'],
      ['/html-entities', 'Escape the same text for HTML, which uses different rules'],
      ['/http', 'Look up the status code the encoded request came back with'],
      ['/json-escape', 'Escape quotes and backslashes for JSON instead'],
    ],
    deepDive: {
      heading: 'Percent-encoding depends on which part of the URL you are writing',
      body: [
        'Percent-encoding (RFC 3986) replaces a byte with % and two hex digits, so %20 is a space and %C3%A9 is é in UTF-8. Which characters must be encoded depends on where the text goes: & and = are fine in a path but end a query parameter, and / is fine in a query value but splits a path segment.',
        'JavaScript gives you two functions for that. encodeURIComponent encodes everything except letters, digits and - _ . ! ~ * \' ( ), which is right for one query value or path segment. encodeURI leaves the characters that give a URL its structure — : / ? # & = — alone, which is right for a whole URL that only needs its spaces and non-ASCII text escaped. To see how a finished URL splits into those parts, [inspect it in the URL parser](/url-parser).',
        'Spaces have two spellings. RFC 3986 uses %20; HTML form submission (application/x-www-form-urlencoded) uses +. Servers decode + as a space only in the query string, so choose to match what the receiver expects. The grammar is in [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986).',
      ],
      example: {
        inputLabel: 'Query value',
        input: 'café & crème/2',
        outputLabel: 'Two scopes',
        output: `Component  caf%C3%A9%20%26%20cr%C3%A8me%2F2
Full URI   caf%C3%A9%20&%20cr%C3%A8me/2

?q=caf%C3%A9%20%26%20cr%C3%A8me%2F2  ← one value
?q=caf%C3%A9%20&%20cr%C3%A8me/2      ← & starts a new parameter`,
        note: 'Encoding a query value with encodeURI leaves & unescaped, and the server reads everything after it as a second, broken parameter.',
      },
      gotchas: [
        {
          title: 'Double encoding',
          detail: 'Encoding an already-encoded value turns %20 into %2520. The server then decodes once and sees the literal text %20. This tool flags %25XX in decoded output and offers a second decode.',
        },
        {
          title: '+ is only a space in the query',
          detail: 'A + in a path is a literal plus. A + in a query value is read as a space by form parsers, so a real plus (in a phone number or a Base64 string) must be sent as %2B.',
        },
        {
          title: 'Encoding the whole URL with encodeURIComponent',
          detail: 'It escapes the :// and every /, producing https%3A%2F%2F… which is no longer a link. Encode each component, then join them.',
        },
        {
          title: 'A lone % in the text',
          detail: '"100%" is not valid percent-encoding; decoders throw. Encode a literal percent sign as %25 — the error here names the exact position.',
        },
      ],
    },
    howItWorks: [
      'Choose Encode or Decode, then the scope: one component or a full URI.',
      'Choose whether spaces are written as %20 or +.',
      'Type or paste; the result updates as you type, with any malformed sequence pointed out.',
      'Copy the result, or send it to the URL parser to see its parts.',
    ],
    useCases: [
      'Building a redirect_uri or callback parameter by hand',
      'Reading an encoded URL from an access log or an error report',
      'Fixing a link that arrives double-encoded',
      'Checking what a form submission actually sends',
    ],
    faq: [
      {
        q: 'What is the difference between encodeURI and encodeURIComponent?',
        a: 'encodeURIComponent escapes the separators & = ? / # too, for a single value. encodeURI keeps them, for a whole URL. Use the component form for anything you insert into a URL.',
      },
      {
        q: 'Should a space be %20 or +?',
        a: 'Both are common. %20 is correct everywhere in a URL; + means space only in form-encoded query strings. When in doubt, use %20.',
      },
      {
        q: 'What is double encoding?',
        a: 'Encoding text that was already encoded, so %20 becomes %2520. It usually happens when two layers of code each encode the same value. Decode twice, and fix the code so only one layer encodes.',
      },
      {
        q: 'Which characters must be encoded?',
        a: 'Anything outside A–Z a–z 0–9 - . _ ~ when it is data rather than structure, plus every non-ASCII character (encoded as its UTF-8 bytes).',
      },
    ],
  },

  '/hash-generator': {
    title: 'SHA-256 & MD5 Hash Generator — Text and Files | DevPocket',
    description:
      'Generate SHA-256, SHA-1, SHA-512 and MD5 hashes of text or files instantly, and verify checksums. Uses the Web Crypto API — nothing is uploaded.',
    heading: 'Hash Generator (SHA-256, MD5, SHA-512)',
    aboutLabel: 'hashing',
    blurb:
      'Type text or drop a file and see its MD5, SHA-1, SHA-256, SHA-384 and SHA-512 digests together, in hex or Base64. Paste an expected checksum to confirm a download, or switch to HMAC to sign a message with a secret key — all computed by your browser, nothing uploaded.',
    related: [
      ['/password', 'Generate the secret for an HMAC or an API key'],
      ['/base64', 'Decode a Base64 digest back to bytes'],
      ['/uuid', 'Generate IDs where you do not need a content hash'],
      ['/jwt-decoder', 'Check an HS256 token signature with the same secret'],
      ['/jwt-encoder', 'Sign a JWT with HMAC-SHA256 in one step'],
      ['/bcrypt', 'Hash a password properly — slow and salted — instead of digesting it'],
    ],
    deepDive: {
      heading: 'A hash identifies content; it does not hide it or protect it',
      body: [
        'A cryptographic hash turns input of any size into a fixed-size digest: 256 bits for SHA-256, 128 for MD5. The same input always gives the same digest, and a one-bit change gives a completely different one, which is why digests are used as checksums, cache keys and content addresses. A hash has no key and cannot be reversed, but it can be guessed: short or common inputs are found by trying candidates.',
        'MD5 and SHA-1 are broken for security — attackers can create two different files with the same digest — so use them only to spot accidental corruption. SHA-256 is the default for anything that matters. When the digest also has to prove who produced it, use an HMAC: the same hash mixed with a secret key, which is what webhook signatures and [HS256 JWTs](/jwt-decoder) are.',
        'The most common "wrong hash" is not a bug at all: the input differs by a trailing newline, a byte-order mark or a different text encoding. Hashes are over bytes, and this page hashes exactly the UTF-8 bytes shown. If you need a random secret for an HMAC, [generate one with the password generator](/password).',
      ],
      example: {
        inputLabel: 'Text',
        input: 'abc',
        outputLabel: 'Digests',
        output: `MD5      900150983cd24fb0d6963f7d28e17f72
SHA-1    a9993e364706816aba3e25717850c26c9cd0d89d
SHA-256  ba7816bf8f01cfea414140de5dae2223
         b00361a396177a9cb410ff61f20015ad

echo "abc" | sha256sum   → edeaaff3…  (hashes "abc\\n")
echo -n "abc" | sha256sum → ba7816bf…`,
        note: 'These are the published test vectors for "abc". The echo lines show why a terminal and a web page disagree: echo adds a newline unless you pass -n.',
      },
      gotchas: [
        {
          title: 'The trailing newline',
          detail: 'Files and echo output usually end with \\n, and it changes the digest. The tool warns when your text ends with a line break.',
        },
        {
          title: 'Hashing passwords with SHA-256',
          detail: 'A fast hash lets an attacker try billions of guesses per second. Passwords need a slow, salted algorithm — Argon2id, scrypt or bcrypt — not a plain digest.',
        },
        {
          title: 'Comparing hex case or Base64 with hex',
          detail: 'A1B2 and a1b2 are the same digest; Base64 and hex are the same bytes in different spellings. The checksum field accepts all of them and compares bytes.',
        },
        {
          title: 'MD5 for integrity against an attacker',
          detail: 'MD5 still catches a truncated download, but anyone can craft a malicious file with a chosen MD5. Verify against SHA-256 when the source might be hostile.',
        },
      ],
    },
    howItWorks: [
      'Type text, or drop or upload a file; all five digests appear together.',
      'Choose lower-case hex, upper-case hex or Base64 output.',
      'Paste an expected checksum to see ✓ match or ✗ mismatch, and which algorithm matched.',
      'Switch to HMAC, enter a secret, and get HMAC-SHA256, -SHA384 and -SHA512.',
    ],
    useCases: [
      'Verifying a downloaded ISO or release archive against its published SHA-256',
      'Checking a webhook signature (HMAC-SHA256) while debugging',
      'Producing a stable cache key or ETag for a piece of content',
      'Comparing two files without uploading either',
    ],
    faq: [
      {
        q: 'Can a SHA-256 hash be decoded?',
        a: 'No. A hash is one-way. Sites that "decrypt" hashes look them up in tables of precomputed digests of common inputs, which only works for short or popular strings.',
      },
      {
        q: 'MD5 or SHA-256?',
        a: 'SHA-256 for anything that matters. MD5 is fine for catching accidental corruption but can be forged deliberately, and many security tools reject it.',
      },
      {
        q: 'Why is my hash different from sha256sum?',
        a: 'Almost always a trailing newline (echo adds one), a different text encoding, or Windows line endings. Hash the exact same bytes and the digests match.',
      },
      {
        q: 'Should I hash passwords with SHA-256?',
        a: 'No. Use Argon2id, scrypt or bcrypt, which are deliberately slow and salted. A plain SHA-256 of a password can be brute-forced quickly.',
      },
    ],
  },
  '/bcrypt': {
    title: 'Bcrypt Generator — Hash & Verify Passwords | DevPocket',
    description:
      'Hash a password with bcrypt at any cost factor, or verify a password against an existing $2a$, $2b$ or $2y$ hash. Runs in your browser — nothing is uploaded.',
    heading: 'Bcrypt Hash Generator and Verifier',
    aboutLabel: 'bcrypt',
    blurb:
      'Type a password, pick a cost factor and a prefix, and get a bcrypt hash ready to paste into a users table, a Spring Security config, an htpasswd file or a seed migration. Switch to Verify to check a password against a hash you already have, with its version, cost and salt picked apart. Hashing runs in a Web Worker in your browser; the password never leaves the tab.',
    related: [
      ['/hash-generator', 'Fast digests like SHA-256 and MD5, for checksums rather than passwords'],
      ['/password', 'Generate a strong random password to hash'],
      ['/jwt-encoder', 'Issue a signed token once the password has been verified'],
      ['/jwt-decoder', 'Inspect the token a login returned'],
      ['/mock', 'Generate the test users that go with the hashes'],
    ],
    deepDive: {
      heading: 'Why bcrypt is slow on purpose, and what the cost factor means',
      body: [
        'bcrypt (Provos and Mazières, 1999) is built on the expensive key setup of the Blowfish cipher, run over and over: cost 10 means 2^10 = 1,024 passes, and every step up doubles the work. That is the whole point. A fast digest such as the ones in the [hash generator](/hash-generator) lets an attacker with a leaked database test billions of guesses a second; bcrypt at a sensible cost holds them to a few thousand. The output is one 60-character string: a prefix ($2b$), the two-digit cost, a 22-character salt and a 31-character hash, the last two in bcrypt’s own base64 alphabet. The salt is 128 random bits chosen for every hash, so the same password produces a different string each time, and a verifier works by reading the cost and salt out of the stored string and running the password through the same computation.',
        'Pick the cost by time, not by number. The usual target is 100–250 ms per hash on the server that will actually run it — slow enough to blunt an offline attack, fast enough that a login does not feel sluggish. In 2026 that is typically 10 to 12: Spring Security, Node’s bcrypt, Go’s x/crypto and PHP before 8.4 default to 10; Rails and PHP 8.4 use 12; OWASP’s floor is 10. This page measures each run in your browser, but JavaScript is several times slower than native bcrypt, so treat the timings as a way to feel the doubling, not as a production benchmark. Hashes carry their own cost, so raising it later only affects new hashes — re-hash old ones at the next successful login.',
        'The prefix is a label for the implementation’s history, not a different algorithm. $2a$ is the original; $2x$ and $2y$ came from a 2011 bug in the crypt_blowfish library used by PHP, where $2y$ marks hashes made after the fix; $2b$ was OpenBSD’s 2014 marker for a fix to a wraparound bug with passwords over 255 characters. For any password a human would type, all three produce identical bytes, which is why this page lets you choose the label: PHP writes $2y$, Spring and Go write $2a$, Node and OpenBSD write $2b$, and modern verifiers accept all three. If you need a password to hash in the first place, [generate one](/password) rather than inventing one.',
      ],
      example: {
        inputLabel: 'Password, cost 10, prefix $2b$',
        input: 'correct horse battery staple',
        outputLabel: 'Hash (60 characters)',
        output: `$2b$10$oWv0KBo0TjFErdsxHPZ6S.GGO7a2bG.12giquryTI7537Aa5JQdPq
 │   │  └────────┬────────┘└─────────────┬─────────────┘
 │   │       salt (22)              hash (31)
 │   └ cost 10 → 2^10 = 1,024 rounds
 └ version $2b$

Generate again, same password:
$2b$10$JWIStxGfUZokrlc9FCxdN.w2i8AMTUf3b/F0yBuVE5MJITzatWSG6`,
        note: 'The second run has a different salt, so the whole string differs — and both verify against the same password. That is why you never compare two bcrypt strings with ==; you check a password against one of them.',
      },
      gotchas: [
        {
          title: 'Only the first 72 bytes count',
          detail: 'bcrypt silently ignores everything after the 72nd byte of the password, so a long passphrase, or a password with a long pepper appended, verifies against a hash of its first 72 bytes. Most libraries truncate without a word; Go’s returns an error. If you must support longer inputs, pre-hash with SHA-256, Base64-encode the digest, and bcrypt that — the Base64 step matters, because raw digest bytes can contain a NUL, which C implementations treat as the end of the string.',
        },
        {
          title: 'Comparing hashes instead of verifying passwords',
          detail: 'Hashing the submitted password again and comparing the two strings never matches, because the second run gets a new salt. Use the library’s checker (matches, compare, checkpw, password_verify), which extracts the salt from the stored hash and compares in constant time.',
        },
        {
          title: 'A library that rejects the prefix',
          detail: 'Older Java jBCrypt builds only accept $2a$, so a $2y$ hash exported from a PHP system fails with "Invalid salt revision" even though the password is right. Rewrite the prefix — the salt and hash are unchanged — or move to Spring Security’s encoder, which accepts $2a$, $2b$ and $2y$.',
        },
        {
          title: 'The cost that was fine years ago',
          detail: 'Hardware keeps getting faster, so a cost chosen in 2016 is a fraction of the protection today. Because the cost lives inside each hash, you can raise the default without breaking anything: verify with the stored cost, and if it is below the current setting, hash again and overwrite. Spring Security’s upgradeEncoding and PHP’s password_needs_rehash exist for exactly this.',
        },
        {
          title: 'Bytes, not characters',
          detail: 'bcrypt sees UTF-8 bytes. An é typed as one code point and as e plus a combining accent are different bytes and different hashes, and a Windows-1252 byte differs from its UTF-8 form. Normalise to NFC and encode as UTF-8 before hashing, on every platform that takes the password.',
        },
      ],
    },
    howItWorks: [
      'Type a password, choose a cost factor (4–16) and a prefix, and click Generate or press Enter.',
      'Copy the 60-character hash; the breakdown beside it shows the version, cost, salt and hash segments.',
      'Generate again to watch a fresh salt produce a different hash of the same password.',
      'Switch to Verify, paste a hash and a password, and see Match or No match as you type — plus why, if the hash is malformed.',
    ],
    useCases: [
      'Seeding an admin user in a migration, a Docker entrypoint or a Helm values file without running the app first',
      'Working out why a login fails: wrong password, a prefix the library rejects, or a hash that was cut off in a column',
      'Creating a basic-auth entry for nginx, Apache htpasswd, Traefik or Caddy',
      'Feeling how long cost 10, 12 and 14 take before choosing one for production',
    ],
    faq: [
      {
        q: 'Can a bcrypt hash be decrypted?',
        a: 'No. bcrypt is a one-way function with no key, so there is nothing to decrypt. Sites that offer "bcrypt decrypt" just try guesses against the hash, which is exactly what the cost factor is there to slow down. The Verify tab here does the honest version: it checks one password you supply.',
      },
      {
        q: 'Which cost factor should I use?',
        a: 'The one that takes about 100–250 ms on your server. For most hardware in 2026 that is 10 to 12. Below 10 is only for tests; above 14 makes logins slow for little extra security compared with longer passwords.',
      },
      {
        q: 'Why is the hash different every time I click Generate?',
        a: 'Each run draws a new 128-bit random salt, which becomes part of the output. Every hash produced this way verifies the same password; the salt is there so two users with the same password get different hashes and precomputed tables are useless.',
      },
      {
        q: 'Should I use $2a$, $2b$ or $2y$?',
        a: 'Whichever your stack writes — $2y$ for PHP, $2a$ for Spring and Go, $2b$ for Node and OpenBSD. The algorithm is the same, and nearly every modern verifier accepts all three; the prefix matters only to the few old libraries that check it literally.',
      },
      {
        q: 'Is the password sent anywhere?',
        a: 'No. Hashing and verification run in a Web Worker in your browser, using the bcryptjs library bundled with the page. Open the Network tab of your dev tools and use the tool: no request is made.',
      },
    ],
  },
}
