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
