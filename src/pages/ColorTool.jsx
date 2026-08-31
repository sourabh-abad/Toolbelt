import { useMemo, useState } from 'react'
import { Palette } from 'lucide-react'
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from '../lib/utils'
import { Panel, CopyButton, Input, ErrorBanner, PageHeader } from '../components/ui'

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

export default function ColorTool() {
  return (
    <div>
      <PageHeader
        icon={Palette}
        title="Colour & CSS Units"
        subtitle="Convert between HEX, RGB and HSL, and between px, rem, em and pt."
        accent="pink"
      />
      <div className="space-y-4 p-4 sm:p-6">
        <ColorSection />
        <UnitConverter />
      </div>
    </div>
  )
}
