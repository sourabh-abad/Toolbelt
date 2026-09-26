import { useMemo, useState } from 'react'
import { Hash, Trash2 } from 'lucide-react'
import { BASES, convert, group } from '../lib/numbase'
import { useToast } from '../lib/toast'
import { Panel, Button, CopyButton, Input, ErrorBanner, PageHeader, Tabs, Checkbox } from '../components/ui'

const GROUP = { 2: 4, 8: 3, 10: 3, 16: 4 }

export default function NumberBaseTool() {
  const [input, setInput] = useState('0xDEADBEEF')
  const [base, setBase] = useState(16)
  const [grouped, setGrouped] = useState(true)
  const toast = useToast()

  const { result, error } = useMemo(() => {
    if (!input.trim()) return { result: null, error: '' }
    try {
      return { result: convert(input, base), error: '' }
    } catch (e) {
      return { result: null, error: e.message }
    }
  }, [input, base])

  const show = (digits, b) => {
    if (!grouped) return digits
    const neg = digits.startsWith('-')
    const body = group(neg ? digits.slice(1) : digits, GROUP[b], b === 10 ? ',' : ' ')
    return (neg ? '-' : '') + body
  }

  return (
    <div>
      <PageHeader
        icon={Hash}
        title="Number Base Converter"
        subtitle="Binary, octal, decimal and hex — exact for any size, with two's complement views."
        accent="indigo"
      />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel
          title="Number"
          actions={
            <>
              <Button variant="ghost" type="button" onClick={() => { setInput('0xDEADBEEF'); setBase(16) }}>Sample</Button>
              <Button variant="ghost" type="button" onClick={() => setInput('')}>
                <Trash2 className="h-3.5 w-3.5" />Clear
              </Button>
            </>
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={String(base)} onChange={(v) => setBase(Number(v))} options={BASES.map((b) => ({ value: String(b.base), label: `${b.label} (${b.base})` }))} />
            <Checkbox checked={grouped} onChange={(e) => setGrouped(e.target.checked)} label="Group digits" />
          </div>
          <Input
            className="mt-3"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="255, 0xFF, 0b1111_1111, -42…"
            aria-label="Number to convert"
          />
          <p className="t-muted mt-2 text-xs">
            A 0x, 0b or 0o prefix overrides the selected base. Underscores, spaces and commas between digits are ignored.
          </p>
          {error && <div className="mt-3"><ErrorBanner>{error}</ErrorBanner></div>}
        </Panel>

        {result && (
          <>
            <Panel title="In every base" description={`${result.bits}-bit magnitude${result.detected !== base ? ` · read as base ${result.detected} from its prefix` : ''}`}>
              <div className="space-y-2">
                {result.bases.map((b) => (
                  <div key={b.base} className="bd sunken flex items-center gap-3 rounded-lg border py-1 pr-1 pl-3">
                    <span className="t-muted w-28 shrink-0 text-xs">{b.label}</span>
                    <code className="t-main mono min-w-0 flex-1 text-sm break-all">{show(b.digits, b.base)}</code>
                    <CopyButton text={(b.digits.startsWith('-') ? '-' + b.prefix + b.digits.slice(1) : b.prefix + b.digits)} label="" onCopied={() => toast(`${b.label} copied`)} />
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Fixed-width integers" description="The same bits read as unsigned and as two's complement signed">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bd-strong border-b">
                      <th className="t-main py-2 pr-4 font-semibold">Width</th>
                      <th className="t-main py-2 pr-4 font-semibold">Hex</th>
                      <th className="t-main py-2 pr-4 font-semibold">Unsigned</th>
                      <th className="t-main py-2 pr-4 font-semibold">Signed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.widths.map((w) => (
                      <tr key={w.bits} className="bd border-b last:border-0">
                        <td className="mono t-main py-2 pr-4">{w.bits}-bit</td>
                        {w.fits ? (
                          <>
                            <td className="mono t-muted py-2 pr-4">{group(w.hex, 4, ' ')}</td>
                            <td className="mono t-muted py-2 pr-4">{w.unsigned.toString()}</td>
                            <td className="mono t-muted py-2 pr-4">{w.signed.toString()}</td>
                          </>
                        ) : (
                          <td colSpan={3} className="t-faint py-2 pr-4">Does not fit in {w.bits} bits</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
      </div>
    </div>
  )
}
