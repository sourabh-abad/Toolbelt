export const STATUS_CODES = [
  { code: 100, name: 'Continue', category: '1xx', desc: 'Client should continue with the request body.' },
  { code: 101, name: 'Switching Protocols', category: '1xx', desc: 'Server is switching protocols per the Upgrade header.' },
  { code: 103, name: 'Early Hints', category: '1xx', desc: 'Preload hints sent before the final response.' },

  { code: 200, name: 'OK', category: '2xx', desc: 'Request succeeded; response body carries the result.' },
  { code: 201, name: 'Created', category: '2xx', desc: 'Resource created — return its URI in the Location header.' },
  { code: 202, name: 'Accepted', category: '2xx', desc: 'Accepted for processing, but not yet completed.' },
  { code: 204, name: 'No Content', category: '2xx', desc: 'Success with no response body. Common for DELETE/PUT.' },
  { code: 206, name: 'Partial Content', category: '2xx', desc: 'Range request satisfied; partial body returned.' },

  { code: 301, name: 'Moved Permanently', category: '3xx', desc: 'Resource permanently moved; clients should update links.' },
  { code: 302, name: 'Found', category: '3xx', desc: 'Temporary redirect (method may change to GET).' },
  { code: 303, name: 'See Other', category: '3xx', desc: 'Redirect to a GET on another URI, typically post-POST.' },
  { code: 304, name: 'Not Modified', category: '3xx', desc: 'Cached copy is still valid (ETag/If-None-Match).' },
  { code: 307, name: 'Temporary Redirect', category: '3xx', desc: 'Temporary redirect preserving the original method.' },
  { code: 308, name: 'Permanent Redirect', category: '3xx', desc: 'Permanent redirect preserving the original method.' },

  { code: 400, name: 'Bad Request', category: '4xx', desc: 'Malformed syntax or invalid request framing.' },
  { code: 401, name: 'Unauthorized', category: '4xx', desc: 'Authentication required or failed. (Really "unauthenticated".)' },
  { code: 403, name: 'Forbidden', category: '4xx', desc: 'Authenticated but not permitted to access the resource.' },
  { code: 404, name: 'Not Found', category: '4xx', desc: 'No resource matches the URI.' },
  { code: 405, name: 'Method Not Allowed', category: '4xx', desc: 'Method not supported — respond with an Allow header.' },
  { code: 409, name: 'Conflict', category: '4xx', desc: 'State conflict, e.g. a duplicate or version mismatch.' },
  { code: 410, name: 'Gone', category: '4xx', desc: 'Resource intentionally removed and will not return.' },
  { code: 412, name: 'Precondition Failed', category: '4xx', desc: 'A conditional request header evaluated false.' },
  { code: 415, name: 'Unsupported Media Type', category: '4xx', desc: 'Content-Type not supported by the endpoint.' },
  { code: 418, name: "I'm a teapot", category: '4xx', desc: 'Short and stout. From RFC 2324, an April Fools spec.' },
  { code: 422, name: 'Unprocessable Content', category: '4xx', desc: 'Syntactically valid but semantically invalid — validation errors.' },
  { code: 429, name: 'Too Many Requests', category: '4xx', desc: 'Rate limited; pair with Retry-After.' },

  { code: 500, name: 'Internal Server Error', category: '5xx', desc: 'Unhandled server-side failure.' },
  { code: 501, name: 'Not Implemented', category: '5xx', desc: 'Server does not support the functionality required.' },
  { code: 502, name: 'Bad Gateway', category: '5xx', desc: 'Invalid response from an upstream server.' },
  { code: 503, name: 'Service Unavailable', category: '5xx', desc: 'Temporarily overloaded or down for maintenance.' },
  { code: 504, name: 'Gateway Timeout', category: '5xx', desc: 'Upstream server did not respond in time.' },
]

export const METHODS = [
  { name: 'GET', safe: true, idempotent: true, body: false, desc: 'Retrieve a representation. Cacheable, no side effects.' },
  { name: 'POST', safe: false, idempotent: false, body: true, desc: 'Submit data; typically creates a subordinate resource.' },
  { name: 'PUT', safe: false, idempotent: true, body: true, desc: 'Replace the target resource entirely with the payload.' },
  { name: 'PATCH', safe: false, idempotent: false, body: true, desc: 'Apply a partial modification to a resource.' },
  { name: 'DELETE', safe: false, idempotent: true, body: false, desc: 'Remove the target resource.' },
  { name: 'HEAD', safe: true, idempotent: true, body: false, desc: 'Like GET but headers only — useful for existence checks.' },
  { name: 'OPTIONS', safe: true, idempotent: true, body: false, desc: 'Describe communication options; drives CORS preflight.' },
]

export const HEADERS = [
  { name: 'Authorization', type: 'Request', desc: 'Credentials for the target resource, e.g. `Bearer <token>`.' },
  { name: 'Content-Type', type: 'Both', desc: 'Media type of the body, e.g. `application/json; charset=utf-8`.' },
  { name: 'Accept', type: 'Request', desc: 'Media types the client can handle, used for content negotiation.' },
  { name: 'Cache-Control', type: 'Both', desc: 'Caching directives, e.g. `no-store`, `max-age=3600`.' },
  { name: 'ETag', type: 'Response', desc: 'Opaque version identifier used with If-None-Match.' },
  { name: 'If-None-Match', type: 'Request', desc: 'Conditional request; yields 304 when the ETag matches.' },
  { name: 'Location', type: 'Response', desc: 'Target URI for redirects, or the URI of a newly created resource.' },
  { name: 'Retry-After', type: 'Response', desc: 'Seconds (or a date) to wait before retrying. Pairs with 429/503.' },
  { name: 'X-Request-Id', type: 'Both', desc: 'Correlation ID for tracing a request across services.' },
  { name: 'Access-Control-Allow-Origin', type: 'Response', desc: 'Origins permitted to read the response (CORS).' },
  { name: 'Content-Encoding', type: 'Both', desc: 'Compression applied to the body, e.g. `gzip`, `br`.' },
  { name: 'Set-Cookie', type: 'Response', desc: 'Sets a cookie. Use `HttpOnly; Secure; SameSite` in production.' },
  { name: 'X-Forwarded-For', type: 'Request', desc: 'Originating client IP when behind a proxy or load balancer.' },
  { name: 'Idempotency-Key', type: 'Request', desc: 'Client-supplied key so retried POSTs are not double-applied.' },
]

export const CATEGORY_STYLES = {
  '1xx': 'bg-slate-500/10 text-slate-500 border-slate-500/30',
  '2xx': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  '3xx': 'bg-sky-500/10 text-sky-500 border-sky-500/30',
  '4xx': 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  '5xx': 'bg-rose-500/10 text-rose-500 border-rose-500/30',
}
