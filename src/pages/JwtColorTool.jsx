import { useMemo, useState } from 'react'
import { KeyRound } from 'lucide-react'
import { base64UrlDecode, syntaxHighlightJson, hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from '../lib/utils'
import { Panel, CopyButton, TextArea, Input, ErrorBanner, OutputBlock, PageHeader } from '../components/ui'

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzk5OTk5OTk5fQ.dQw4w9WgXcQ-dummySignature'

function JwtSection() {
  const [token, setToken] = useState(SAMPLE_JWT)

  const decoded = useMemo(() => {
    const parts = token.trim().split('.')
    if (parts.length < 2) return { error: 'A JWT should have 3 dot-separated parts (header.payload.signature).' }
    try {
      const header = JSON.parse(base64UrlDecode(parts[0]))
      const payload = JSON.parse(base64UrlDecode(parts[1]))
      return { header, payload, signature: parts[2] || '' }
    } catch (e) {
      return { error: `Could not decode token: ${e.message}` }
    }
  }, [token])

  const dateFields = ['iat', 'exp', 'nbf']

  return (
    <Panel title="JWT Decoder" description="Decodes header & payload locally. Signature is shown but not verified.">
      <TextArea rows={4} value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste a JWT…" />
      {decoded.error ? (
        <div className="mt-3">
          <ErrorBanner>{decoded.error}</ErrorBanner>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs t-muted">
              <span>Header</span>
              <CopyButton text={JSON.stringify(decoded.header, null, 2)} label="" />
            </div>
            <OutputBlock html={syntaxHighlightJson(JSON.stringify(decoded.header, null, 2))} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs t-muted">
              <span>Payload</span>
              <CopyButton text={JSON.stringify(decoded.payload, null, 2)} label="" />
            </div>
            <OutputBlock html={syntaxHighlightJson(JSON.stringify(decoded.payload, null, 2))} />
            {dateFields.some((f) => decoded.payload?.[f]) && (
              <div className="mt-2 space-y-1 text-xs t-muted">
                {dateFields
                  .filter((f) => decoded.payload?.[f])
                  .map((f) => (
                    <div key={f}>
                      <span className="t-faint">{f}: </span>
                      {new Date(decoded.payload[f] * 1000).toLocaleString()}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Panel>
  )
}

function ColorSection() {
  const [hex, setHex] = useState('#10b981')
  const [error, setError] = useState('')

  const rgb = useMemo(() => hexToRgb(hex), [hex])
  const hsl = useMemo(() => (rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null), [rgb])

  const updateFromHex = (val) => {
    setHex(val)
    setError(hexToRgb(val) ? '' : 'Invalid hex color')
  }
  const updateFromRgbField = (key, val) => {
    if (!rgb) return
    const next = { ...rgb, [key]: Number(val) || 0 }
    setHex(rgbToHex(next.r, next.g, next.b))
  }
  const updateFromHslField = (key, val) => {
    if (!hsl) return
    const next = { ...hsl, [key]: Number(val) || 0 }
    const next_rgb = hslToRgb(next.h, next.s, next.l)
    setHex(rgbToHex(next_rgb.r, next_rgb.g, next_rgb.b))
  }

  return (
    <Panel title="Color Converter" description="Convert between HEX, RGB and HSL.">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-col items-center gap-2">
          <input
            type="color"
            value={hexToRgb(hex) ? hex : '#000000'}
            onChange={(e) => updateFromHex(e.target.value)}
            className="h-16 w-16 cursor-pointer rounded-lg border bd bg-transparent"
          />
          <CopyButton text={hex} label="Copy" />
        </div>
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs t-muted">HEX</label>
            <Input value={hex} onChange={(e) => updateFromHex(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs t-muted">RGB</label>
            <div className="flex gap-1.5">
              {['r', 'g', 'b'].map((k) => (
                <Input key={k} type="number" min="0" max="255" value={rgb ? rgb[k] : ''} onChange={(e) => updateFromRgbField(k, e.target.value)} />
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs t-muted">HSL</label>
            <div className="flex gap-1.5">
              {['h', 's', 'l'].map((k) => (
                <Input key={k} type="number" value={hsl ? hsl[k] : ''} onChange={(e) => updateFromHslField(k, e.target.value)} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2">
        <ErrorBanner>{error}</ErrorBanner>
      </div>
    </Panel>
  )
}

function UnitConverter() {
  const [base, setBase] = useState(16)
  const [px, setPx] = useState(24)

  const rem = px / base
  const em = rem
  const pt = px * 0.75

  return (
    <Panel title="CSS Unit Converter" description="Convert pixels to rem / em / pt using a root font size.">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs t-muted">Root font size (px)</label>
          <Input type="number" value={base} onChange={(e) => setBase(Number(e.target.value) || 16)} className="w-32" />
        </div>
        <div>
          <label className="mb-1 block text-xs t-muted">px</label>
          <Input type="number" value={px} onChange={(e) => setPx(Number(e.target.value) || 0)} className="w-32" />
        </div>
        <div className="flex gap-3 text-sm">
          <Row label="rem" value={`${rem.toFixed(3)}rem`} />
          <Row label="em" value={`${em.toFixed(3)}em`} />
          <Row label="pt" value={`${pt.toFixed(2)}pt`} />
        </div>
      </div>
    </Panel>
  )
}

function Row({ label, value }) {
  return (
    <div className="rounded-lg border bd sunken px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide t-faint">{label}</div>
      <div className="mono t-main">{value}</div>
    </div>
  )
}

export default function JwtColorTool() {
  return (
    <div>
      <PageHeader icon={KeyRound} title="JWT & Color Tools" subtitle="Decode JWTs and work with colors & CSS units." accent="cyan" />
      <div className="space-y-4 p-4 sm:p-6">
        <JwtSection />
        <ColorSection />
        <UnitConverter />
      </div>
    </div>
  )
}
