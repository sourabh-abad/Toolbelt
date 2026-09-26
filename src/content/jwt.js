// Page copy for the JWT decoder and the JWT encoder. Merged into SEO in
// src/lib/seo.js.

export default {
  '/jwt-decoder': {
    title: 'JWT Decoder Online — Decode Token & Check Expiry | DevPocket',
    description:
      'Decode a JSON Web Token, see a live expiry countdown and every claim explained, and verify the signature locally with a secret, PEM, JWK or JWKS. Nothing is sent.',
    heading: 'JWT Decoder',
    aboutLabel: 'JSON Web Tokens',
    blurb:
      'Paste a JWT — or a whole "Authorization: Bearer …" header — and read its header and payload, with each claim explained and exp, nbf and iat turned into dates and a live countdown. Verify the signature with a shared secret, a PEM public key or certificate, a JWK or a pasted JWKS, using Web Crypto in this tab.',
    related: [
      ['/jwt-encoder', 'Create and sign a test token with your own claims'],
      ['/base64', 'Decode a single Base64URL segment by hand'],
      ['/timestamp', 'Convert exp and iat values to dates in any zone'],
      ['/json-formatter', 'Format a large payload and search its claims'],
      ['/hash-generator', 'Compute the HMAC that an HS256 signature is built from'],
    ],
    deepDive: {
      heading: 'Decoding a token is not the same as trusting it',
      body: [
        'A JSON Web Token (RFC 7519) is three Base64URL segments joined by dots: a header naming the algorithm, a payload of claims, and a signature over the first two. The header and payload are only encoded, so anyone holding the token can read them — never put secrets in a payload. Decoding shows what the issuer claimed; the signature is what proves the issuer actually said it and that nobody changed a byte since.',
        'Verification here runs on Web Crypto without leaving the page. For HS256, HS384 and HS512 the key is a shared secret; tick the Base64 box when your provider hands the secret out encoded, as Auth0 and many others do. For RS, PS and ES algorithms paste the public key as a PEM, a certificate, a JWK, or the whole JWKS from the issuer’s /.well-known/jwks.json, and the key is chosen by the token’s kid. The page never fetches a JWKS itself — a token can name a jku URL, and a verifier that follows it lets the attacker choose the key. To make a token to test against, [sign one with the JWT encoder](/jwt-encoder).',
        'Time claims are seconds since 1970. The countdown uses your device’s clock, and a token whose nbf is a few seconds in the future usually means the issuer’s clock is ahead, not that the token is bad; most libraries accept 30 to 60 seconds of leeway. A 13-digit exp is a common bug — milliseconds written where seconds belong — and is flagged, because it makes a token look valid for more than 50,000 years. The [Timestamp Converter](/timestamp) shows any claim in other time zones.',
      ],
      example: {
        inputLabel: 'Token (HS256, secret "your-256-bit-secret")',
        input: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        outputLabel: 'Decoded',
        output: `Header   {"alg":"HS256","typ":"JWT"}
Payload  {"sub":"1234567890","name":"John Doe",
          "iat":1516239022}
iat      2018-01-18T01:30:22Z
exp      none — this token never expires
Signature verified with the secret`,
        note: 'The well-known example token. Change one character of the payload and verification fails, while decoding still works — which is exactly why decoding alone proves nothing.',
      },
      gotchas: [
        {
          title: 'Trusting a decoded token',
          detail: 'Any client can build a token with admin: true. A server must verify the signature and check exp, nbf, iss and aud before using a single claim.',
        },
        {
          title: 'alg: none and algorithm confusion',
          detail: 'Reject unsigned tokens, and fix the expected algorithm per key. Libraries that let the token pick HS256 with an RSA public key as the "secret" have been exploited.',
        },
        {
          title: 'A Base64-encoded secret used as text',
          detail: 'If the provider shows the secret Base64-encoded, the signing key is the decoded bytes. Using the string itself produces a different signature and a confusing "invalid signature".',
        },
        {
          title: 'exp in milliseconds',
          detail: 'Date.now() is milliseconds; JWT NumericDate is seconds. An exp of 1767229200000 means the year 57,971, so the token effectively never expires.',
        },
        {
          title: 'Pasting the whole header',
          detail: 'Authorization: Bearer eyJ… is not a token. This page strips the prefix and quotes and says so; your own code needs to do the same before verifying.',
        },
      ],
    },
    howItWorks: [
      'Paste a token or an Authorization header; prefixes, quotes and line breaks are removed.',
      'Read the header and payload, with each claim explained and times converted.',
      'Watch the expiry countdown and the nbf and iat checks.',
      'Paste a secret, PEM, JWK or JWKS to verify the signature locally.',
    ],
    useCases: [
      'Finding out why an API returns 401 for a token',
      'Checking the scopes, audience and expiry an identity provider issued',
      'Verifying a webhook or service-to-service token against a public key',
      'Debugging clock skew between an issuer and an API',
    ],
    faq: [
      {
        q: 'Is it safe to paste a production token here?',
        a: 'The token, secret and keys stay in this tab: decoding and verification run locally with Web Crypto and nothing is sent over the network. A token is still a credential, so treat the screen like any other place it appears.',
      },
      {
        q: 'Can this page verify a JWT signature?',
        a: 'Yes, for HS256/384/512 with a secret (plain or Base64), RS256/384/512 and PS256/384/512 with an RSA key, ES256/384/512 with an EC key, and EdDSA where the browser supports Ed25519.',
      },
      {
        q: 'Why is my token valid here but rejected by the server?',
        a: 'The server also checks the audience, the issuer, the expected algorithm and the key. A mismatch in aud or iss, a rotated key or a clock-skew nbf are the usual causes.',
      },
      {
        q: 'Why won’t it fetch the JWKS for me?',
        a: 'Fetching would send a request from this page, and a token-supplied jku URL is exactly what an attacker controls. Open the issuer’s jwks.json yourself and paste it.',
      },
      {
        q: 'Can it decode an encrypted token (JWE)?',
        a: 'No. A JWE has five parts and its payload is encrypted for the recipient. The page recognises one and shows the header, which is not encrypted.',
      },
    ],
  },

  '/jwt-encoder': {
    title: 'JWT Encoder — Create & Sign a Token Locally | DevPocket',
    description:
      'Create a signed JSON Web Token with your own header and claims. HS256 secrets, RS, PS, ES and EdDSA keys; set iat and exp in one click. Keys never leave the tab.',
    heading: 'JWT Encoder',
    aboutLabel: 'signing JWTs',
    blurb:
      'Write the header and claims as JSON, pick an algorithm, paste a secret or a private key — or generate a throwaway one — and get a signed JWT as you type. Quick buttons set iat to now and exp 15 minutes to 7 days ahead, and the token opens in the decoder with one click.',
    related: [
      ['/jwt-decoder', 'Decode the token you made and verify its signature'],
      ['/password', 'Generate a strong random secret for HS256'],
      ['/timestamp', 'Pick exact exp and nbf values as Unix seconds'],
      ['/uuid', 'Generate a unique jti claim'],
      ['/json-validator', 'Check a large claims object before signing it'],
    ],
    deepDive: {
      heading: 'Signing a test token without handing your key to a website',
      body: [
        'Testing an API that expects a JWT means producing tokens with specific claims: an expired one, one for another audience, one with an extra scope. This encoder builds them locally. The header and payload are serialised as JSON, Base64URL-encoded and joined with a dot; that string is signed with Web Crypto and the signature appended. The secret or private key lives only in this component’s memory — it is not written to storage, put in the URL or sent anywhere, and it is gone when you close the tab.',
        'HS algorithms use a shared secret, which the API needs too; RFC 7518 requires at least as many random bytes as the hash, so 32 for HS256, and the Random secret button makes one. RS, PS, ES and EdDSA use a private key to sign and the public key to verify. Paste a PKCS#8 PEM (BEGIN PRIVATE KEY), a PKCS#1 RSA key or a private JWK, or generate a test key pair: the public half appears alongside so you can configure the API or [verify the token in the decoder](/jwt-decoder).',
        'Times in JWTs are Unix seconds. iat = now and the exp buttons write the right numbers for you; for a specific moment, get it from the [Timestamp Converter](/timestamp). Remember that anyone can read the payload — sign test data, not real personal information.',
      ],
      example: {
        inputLabel: 'Header, payload and secret',
        input: `{"alg":"HS256","typ":"JWT"}
{"sub":"42","exp":1767229200}
secret: devpocket-demo-secret`,
        outputLabel: 'Signed token',
        output: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsImV4cCI6MTc2NzIyOTIwMH0.MFUOH3wQhlEK3CSbpIwxoL6m-90LGY72SJNFciVHNNY',
        note: 'exp 1767229200 is 2026-01-01T01:00:00Z. Change a space in the JSON and the middle segment — and the signature — change with it.',
      },
      gotchas: [
        {
          title: 'Short or guessable HS256 secrets',
          detail: 'HMAC secrets can be brute-forced offline from a single token. Use 32 random bytes or more, never a word or a password.',
        },
        {
          title: 'Signing with the wrong key type',
          detail: 'RS256 needs an RSA private key, ES256 a P-256 EC key. A key of another type fails to import; the error names what was expected.',
        },
        {
          title: 'SEC1 EC keys',
          detail: 'Keys that begin "BEGIN EC PRIVATE KEY" must be converted to PKCS#8 first: openssl pkcs8 -topk8 -nocrypt -in key.pem.',
        },
        {
          title: 'Forgetting exp',
          detail: 'A token without exp is valid forever unless the API enforces its own limit. Add one, even to test tokens.',
        },
      ],
    },
    howItWorks: [
      'Choose the algorithm; the header’s alg follows.',
      'Edit the payload and use the iat and exp buttons for times.',
      'Paste a secret or private key, or generate a test one.',
      'Copy the signed token or open it in the JWT decoder.',
    ],
    useCases: [
      'Testing how an API handles expired or not-yet-valid tokens',
      'Producing tokens with extra scopes or roles for local development',
      'Checking that a service accepts RS256 tokens from a new key pair',
      'Demonstrating JWT structure in a code review or a workshop',
    ],
    faq: [
      {
        q: 'Is my signing key sent anywhere?',
        a: 'No. Signing uses Web Crypto in this tab. The key is kept only in memory — not in storage, the URL or any request — and disappears when you close the page.',
      },
      {
        q: 'Which algorithms can it sign with?',
        a: 'HS256, HS384 and HS512 with a secret; RS256/384/512 and PS256/384/512 with an RSA key; ES256, ES384 and ES512 with an EC key; and EdDSA (Ed25519) where the browser supports it.',
      },
      {
        q: 'How do I make a token that expires in an hour?',
        a: 'Press "exp +1 hour". It sets iat to the current time if it is missing and exp to now plus 3,600 seconds.',
      },
      {
        q: 'Can it create unsigned (alg: none) tokens?',
        a: 'No. Unsigned tokens are a common attack, and APIs should reject them, so the encoder always signs.',
      },
    ],
  },
}
