/**
 * JSON Web Token decoding, local signature verification and signing, for the
 * JWT Decoder and JWT Encoder pages. Everything runs on Web Crypto in this
 * tab; nothing here fetches a key, a JWKS or anything else from the network.
 */
import { encodeBytes, decodeToBytes } from './base64.js'

const te = new TextEncoder()
const td = new TextDecoder('utf-8', { fatal: true })

/* -------------------------------------------------------------- cleaning */

/**
 * What people paste is rarely just the token: an Authorization header, a
 * quoted string from JSON, a value wrapped across lines. Strip those and say
 * what was removed.
 */
export function cleanToken(raw) {
  let t = raw
  const notices = []
  const before = t
  t = t.trim()
  if (/^authorization\s*:/i.test(t)) {
    t = t.replace(/^authorization\s*:\s*/i, '')
    notices.push('Removed the "Authorization:" header name')
  }
  if (/^bearer\s+/i.test(t)) {
    t = t.replace(/^bearer\s+/i, '')
    notices.push('Removed the "Bearer " prefix')
  }
  if (/^(["'`]).*\1$/s.test(t)) {
    t = t.slice(1, -1)
    notices.push('Removed surrounding quotes')
  }
  const squeezed = t.replace(/\s+/g, '')
  if (squeezed !== t) notices.push('Removed whitespace and line breaks inside the token')
  if (!notices.length && before !== squeezed && before.trim() !== squeezed) notices.push('Removed surrounding whitespace')
  return { token: squeezed, notices }
}

/* -------------------------------------------------------------- decoding */

const b64urlJson = (seg, name) => {
  let bytes
  try {
    bytes = decodeToBytes(seg, { url: true })
  } catch (e) {
    throw new Error(`The ${name} is not valid Base64URL: ${e.message}`)
  }
  let text
  try {
    text = td.decode(bytes)
  } catch {
    throw new Error(`The ${name} decodes to bytes that are not UTF-8 text`)
  }
  try {
    return JSON.parse(text)
  } catch (e) {
    throw new Error(`The ${name} is not JSON: ${e.message}`)
  }
}

export function decodeJwt(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length === 5) {
    let header = null
    try {
      header = b64urlJson(parts[0], 'header')
    } catch {
      // fall through with no header
    }
    return { jwe: true, header, error: 'This is an encrypted token (JWE, five parts). Its payload can only be read with the recipient’s private key.' }
  }
  if (parts.length !== 3) return { error: `A signed JWT has 3 dot-separated parts (header.payload.signature) — this has ${parts.length}.` }
  try {
    const header = b64urlJson(parts[0], 'header')
    const payload = b64urlJson(parts[1], 'payload')
    if (header === null || typeof header !== 'object' || Array.isArray(header)) throw new Error('The header must be a JSON object')
    return { header, payload, parts, signingInput: `${parts[0]}.${parts[1]}`, signature: parts[2] }
  } catch (e) {
    return { error: e.message, parts }
  }
}

/* ---------------------------------------------------------------- claims */

export const CLAIMS = {
  iss: ['Issuer', 'Who created and signed the token — usually the identity provider’s URL'],
  sub: ['Subject', 'Whom the token is about: a user or client ID, unique within the issuer'],
  aud: ['Audience', 'Which API or app the token is meant for; a resource server must reject other audiences'],
  exp: ['Expiration time', 'After this instant the token must be rejected'],
  nbf: ['Not before', 'Before this instant the token must be rejected'],
  iat: ['Issued at', 'When the token was created'],
  jti: ['JWT ID', 'A unique ID, used to stop the same token being replayed'],
  azp: ['Authorized party', 'The client the token was issued to (OpenID Connect)'],
  scope: ['Scope', 'Space-separated permissions granted (OAuth 2.0)'],
  scp: ['Scopes', 'Permissions granted, as used by Azure AD / Okta'],
  roles: ['Roles', 'Application roles assigned to the subject'],
  nonce: ['Nonce', 'Value from the login request, checked to prevent replay (OpenID Connect)'],
  auth_time: ['Authentication time', 'When the user actually logged in'],
  sid: ['Session ID', 'The login session this token belongs to'],
  acr: ['Authentication context', 'How strongly the user was authenticated'],
  amr: ['Authentication methods', 'How the user authenticated, e.g. pwd, mfa, otp'],
  email: ['Email', 'The user’s email address'],
  email_verified: ['Email verified', 'Whether the issuer has verified the email address'],
  name: ['Name', 'The user’s full name'],
  preferred_username: ['Preferred username', 'The name the user signs in with'],
  tid: ['Tenant ID', 'The directory or tenant the user belongs to (Azure AD)'],
  client_id: ['Client ID', 'The OAuth client that requested the token'],
  cnf: ['Confirmation', 'Key the token is bound to (proof-of-possession)'],
}

export const HEADER_FIELDS = {
  alg: ['Algorithm', 'How the signature was made; "none" means unsigned'],
  typ: ['Type', 'Media type of the token, usually JWT or at+jwt'],
  kid: ['Key ID', 'Which key in the issuer’s JWKS signed this token'],
  cty: ['Content type', 'Set to JWT when the payload is itself a token'],
  jku: ['JWK Set URL', 'Where the issuer publishes keys. Never fetch keys from a URL the token itself names'],
  x5u: ['X.509 URL', 'Where a certificate chain can be fetched. Do not trust it without pinning'],
  x5c: ['X.509 chain', 'Certificate chain embedded in the header'],
  x5t: ['X.509 thumbprint', 'SHA-1 thumbprint of the signing certificate'],
}

export const TIME_CLAIMS = ['exp', 'nbf', 'iat', 'auth_time']

/** A time claim in milliseconds instead of seconds is a common bug. */
export const looksLikeMs = (v) => typeof v === 'number' && Math.abs(v) > 1e11

/** Time claims checked against `nowMs`, with a skew allowance. */
export function timeChecks(payload, nowMs, leewaySec = 60) {
  const now = nowMs / 1000
  const out = {}
  if (!payload || typeof payload !== 'object') return out
  for (const c of ['exp', 'nbf', 'iat']) {
    const v = payload[c]
    if (v === undefined) continue
    if (typeof v !== 'number') {
      out[c] = { bad: `${c} must be a number of seconds, found ${typeof v}` }
      continue
    }
    out[c] = { value: v, ms: looksLikeMs(v), delta: v - now }
  }
  const exp = out.exp
  if (exp && !exp.bad) exp.expired = exp.value <= now
  const nbf = out.nbf
  if (nbf && !nbf.bad) {
    nbf.notYet = nbf.value > now
    nbf.skew = nbf.notYet && nbf.value - now <= 5 * 60
    nbf.withinLeeway = nbf.notYet && nbf.value - now <= leewaySec
  }
  const iat = out.iat
  if (iat && !iat.bad) iat.future = iat.value > now + leewaySec
  return out
}

/** "2h 05m 09s" */
export function duration(sec) {
  let s = Math.floor(Math.abs(sec))
  const d = Math.floor(s / 86400)
  s -= d * 86400
  const h = Math.floor(s / 3600)
  s -= h * 3600
  const m = Math.floor(s / 60)
  s -= m * 60
  const p = (n) => String(n).padStart(2, '0')
  if (d >= 365) return `${Math.floor(d / 365)}y ${d % 365}d`
  if (d) return `${d}d ${p(h)}h ${p(m)}m`
  if (h) return `${h}h ${p(m)}m ${p(s)}s`
  if (m) return `${m}m ${p(s)}s`
  return `${s}s`
}

/* ------------------------------------------------------------ algorithms */

const HASH = { 256: 'SHA-256', 384: 'SHA-384', 512: 'SHA-512' }

export const ALGORITHMS = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'ES512', 'EdDSA']

export function algParams(alg) {
  const m = /^(HS|RS|PS|ES)(256|384|512)$/.exec(alg || '')
  if (alg === 'EdDSA' || alg === 'Ed25519') return { family: 'OKP', importAlg: { name: 'Ed25519' }, signAlg: { name: 'Ed25519' } }
  if (!m) return null
  const [, fam, bits] = m
  const hash = HASH[bits]
  if (fam === 'HS') return { family: 'HS', importAlg: { name: 'HMAC', hash }, signAlg: { name: 'HMAC' } }
  if (fam === 'RS') return { family: 'RSA', importAlg: { name: 'RSASSA-PKCS1-v1_5', hash }, signAlg: { name: 'RSASSA-PKCS1-v1_5' } }
  if (fam === 'PS') return { family: 'RSA', importAlg: { name: 'RSA-PSS', hash }, signAlg: { name: 'RSA-PSS', saltLength: Number(bits) / 8 } }
  const curve = { 256: 'P-256', 384: 'P-384', 512: 'P-521' }[bits]
  return { family: 'EC', curve, importAlg: { name: 'ECDSA', namedCurve: curve }, signAlg: { name: 'ECDSA', hash } }
}

/* ------------------------------------------------------------------- DER */

function derLen(n) {
  if (n < 128) return [n]
  const out = []
  while (n) {
    out.unshift(n & 0xff)
    n >>= 8
  }
  return [0x80 | out.length, ...out]
}
const tlv = (tag, body) => Uint8Array.from([tag, ...derLen(body.length), ...body])
const RSA_ALG_ID = Uint8Array.from([0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00])

function readTlv(bytes, at) {
  const tag = bytes[at]
  let len = bytes[at + 1]
  let head = 2
  if (len & 0x80) {
    const n = len & 0x7f
    len = 0
    for (let i = 0; i < n; i++) len = (len << 8) | bytes[at + 2 + i]
    head = 2 + n
  }
  return { tag, start: at, body: at + head, end: at + head + len }
}
function children(bytes, node) {
  const out = []
  for (let at = node.body; at < node.end; ) {
    const c = readTlv(bytes, at)
    out.push(c)
    at = c.end
  }
  return out
}

/** The SubjectPublicKeyInfo inside an X.509 certificate. */
export function spkiFromCertificate(der) {
  const cert = readTlv(der, 0)
  const tbs = children(der, cert)[0]
  const fields = children(der, tbs)
  const offset = fields[0].tag === 0xa0 ? 1 : 0
  const spki = fields[offset + 5]
  if (!spki || spki.tag !== 0x30) throw new Error('Could not find the public key in this certificate')
  return der.slice(spki.start, spki.end)
}

export function pemBlocks(text) {
  const out = []
  const re = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/g
  let m
  while ((m = re.exec(text))) out.push({ label: m[1], der: decodeToBytes(m[2].replace(/\s+/g, '')) })
  return out
}

export function toPem(der, label) {
  const b64 = encodeBytes(der)
  return `-----BEGIN ${label}-----\n${b64.match(/.{1,64}/g).join('\n')}\n-----END ${label}-----\n`
}

/* ------------------------------------------------------------------ keys */

function secretBytes(secret, encoding) {
  if (encoding === 'base64') {
    try {
      return decodeToBytes(secret.trim())
    } catch {
      return decodeToBytes(secret.trim(), { url: true })
    }
  }
  return te.encode(secret)
}

const PRIVATE_JWK = ['d', 'p', 'q', 'dp', 'dq', 'qi']

function prepareJwk(jwk, alg, usage) {
  if (!jwk || typeof jwk !== 'object' || !jwk.kty) throw new Error('This JSON is not a JWK (no "kty")')
  if (jwk.alg && jwk.alg !== alg) throw new Error(`This key is marked for ${jwk.alg}, but the token uses ${alg}`)
  const k = { ...jwk }
  delete k.alg
  delete k.use
  delete k.key_ops
  if (usage === 'verify') for (const f of PRIVATE_JWK) delete k[f]
  if (usage === 'sign' && k.kty !== 'oct' && !k.d) throw new Error('This JWK is a public key; signing needs the private key (with "d")')
  return k
}

/**
 * Imports a key for `alg` from what the user pasted: a secret (HS*), a PEM
 * (public key, certificate, or PKCS#1/PKCS#8 private key), a JWK or a JWKS.
 * For a JWKS the key is chosen by `kid`.
 */
export async function importKey(alg, material, { usage = 'verify', secretEncoding = 'utf8', kid } = {}) {
  const p = algParams(alg)
  if (!p) throw new Error(alg === 'none' ? 'alg is "none": the token is unsigned, so there is nothing to verify' : `Unsupported algorithm ${alg}`)
  const subtle = globalThis.crypto?.subtle
  if (!subtle) throw new Error('Web Crypto is not available in this browser (it needs HTTPS)')
  if (p.family === 'HS') {
    if (!material) throw new Error('Enter the shared secret')
    return { key: await subtle.importKey('raw', secretBytes(material, secretEncoding), p.importAlg, false, [usage]), source: 'secret' }
  }
  const text = (material || '').trim()
  if (!text) throw new Error(usage === 'sign' ? 'Paste a private key (PEM or JWK)' : 'Paste a public key, certificate, JWK or JWKS')
  if (text.startsWith('{')) {
    let json
    try {
      json = JSON.parse(text)
    } catch (e) {
      throw new Error(`The key is not valid JSON: ${e.message}`)
    }
    let jwk = json
    let source = 'JWK'
    if (Array.isArray(json.keys)) {
      const candidates = json.keys.filter((k) => !k.use || k.use === 'sig')
      jwk = kid ? candidates.find((k) => k.kid === kid) : candidates.length === 1 ? candidates[0] : null
      if (!jwk) {
        throw new Error(
          kid
            ? `No key with kid "${kid}" in this JWKS (it has ${json.keys.map((k) => k.kid || '(no kid)').join(', ') || 'no keys'})`
            : 'The token has no kid, and this JWKS has more than one key — paste the single key instead'
        )
      }
      source = `JWKS key "${jwk.kid || '(no kid)'}"`
    }
    const key = await subtle.importKey('jwk', prepareJwk(jwk, alg, usage), p.importAlg, false, [usage])
    return { key, source }
  }
  const blocks = pemBlocks(text)
  if (!blocks.length) throw new Error('Expected a PEM block (-----BEGIN …-----) or a JWK')
  const b = blocks[0]
  if (usage === 'verify') {
    if (b.label === 'PUBLIC KEY') return { key: await subtle.importKey('spki', b.der, p.importAlg, false, ['verify']), source: 'PEM public key' }
    if (b.label === 'CERTIFICATE') return { key: await subtle.importKey('spki', spkiFromCertificate(b.der), p.importAlg, false, ['verify']), source: 'X.509 certificate' }
    if (b.label === 'RSA PUBLIC KEY') {
      const spki = tlv(0x30, [...RSA_ALG_ID, ...tlv(0x03, [0, ...b.der])])
      return { key: await subtle.importKey('spki', spki, p.importAlg, false, ['verify']), source: 'PKCS#1 public key' }
    }
    if (/PRIVATE KEY/.test(b.label)) throw new Error('That is a private key. Verification needs only the public key — never paste a private key you do not have to')
    throw new Error(`Unsupported PEM type "${b.label}"`)
  }
  if (b.label === 'PRIVATE KEY') return { key: await subtle.importKey('pkcs8', b.der, p.importAlg, false, ['sign']), source: 'PKCS#8 private key' }
  if (b.label === 'RSA PRIVATE KEY') {
    const pkcs8 = tlv(0x30, [0x02, 0x01, 0x00, ...RSA_ALG_ID, ...tlv(0x04, b.der)])
    return { key: await subtle.importKey('pkcs8', pkcs8, p.importAlg, false, ['sign']), source: 'PKCS#1 private key' }
  }
  if (b.label === 'EC PRIVATE KEY') throw new Error('SEC1 "EC PRIVATE KEY" is not supported — convert it: openssl pkcs8 -topk8 -nocrypt -in key.pem')
  if (/PUBLIC KEY|CERTIFICATE/.test(b.label)) throw new Error('Signing needs the private key, not the public key')
  throw new Error(`Unsupported PEM type "${b.label}"`)
}

/* ------------------------------------------------------- verify and sign */

export async function verifyJwt(decoded, material, opts = {}) {
  const alg = decoded.header.alg
  const p = algParams(alg)
  const { key, source } = await importKey(alg, material, { ...opts, usage: 'verify', kid: decoded.header.kid })
  let sig
  try {
    sig = decodeToBytes(decoded.signature, { url: true })
  } catch (e) {
    throw new Error(`The signature is not valid Base64URL: ${e.message}`)
  }
  const ok = await globalThis.crypto.subtle.verify(p.signAlg, key, sig, te.encode(decoded.signingInput))
  return { ok, source, alg }
}

const segment = (obj) => encodeBytes(te.encode(JSON.stringify(obj)), { url: true })

export async function signJwt(header, payload, material, opts = {}) {
  const alg = header.alg
  const p = algParams(alg)
  if (!p) throw new Error(alg === 'none' ? 'Choose a signing algorithm — this page does not create unsigned tokens' : `Unsupported algorithm ${alg}`)
  const { key } = await importKey(alg, material, { ...opts, usage: 'sign' })
  const input = `${segment(header)}.${segment(payload)}`
  const sig = new Uint8Array(await globalThis.crypto.subtle.sign(p.signAlg, key, te.encode(input)))
  return `${input}.${encodeBytes(sig, { url: true })}`
}

/** A throwaway key pair for trying RS/PS/ES/EdDSA signing, as PEM. */
export async function generateKeyPair(alg) {
  const p = algParams(alg)
  const subtle = globalThis.crypto.subtle
  let params = p.importAlg
  if (p.family === 'RSA') params = { ...p.importAlg, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) }
  const pair = await subtle.generateKey(params, true, ['sign', 'verify'])
  const priv = new Uint8Array(await subtle.exportKey('pkcs8', pair.privateKey))
  const pub = new Uint8Array(await subtle.exportKey('spki', pair.publicKey))
  return { privatePem: toPem(priv, 'PRIVATE KEY'), publicPem: toPem(pub, 'PUBLIC KEY') }
}

/** Random secret for HS* of the hash length, as Base64URL. */
export function randomSecret(alg) {
  const bytes = new Uint8Array(Number(alg.slice(2)) / 8)
  globalThis.crypto.getRandomValues(bytes)
  return encodeBytes(bytes, { url: true })
}
