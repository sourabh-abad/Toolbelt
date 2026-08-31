import { useCallback, useEffect, useState } from 'react'
import { Type, RefreshCw } from 'lucide-react'
import { useToast } from '../lib/toast'
import { Panel, Button, CopyButton, Input, Checkbox, PageHeader, Tabs } from '../components/ui'

const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ')

const rand = (n) => Math.floor(Math.random() * n)
const pick = () => WORDS[rand(WORDS.length)]

const sentence = () => {
  const len = 8 + rand(10)
  const words = Array.from({ length: len }, pick)
  const text = words.join(' ')
  return text.charAt(0).toUpperCase() + text.slice(1) + '.'
}

const paragraph = () => Array.from({ length: 3 + rand(3) }, sentence).join(' ')

export default function LoremTool() {
  const [unit, setUnit] = useState('paragraphs')
  const [count, setCount] = useState(3)
  const [classic, setClassic] = useState(true)
  const [output, setOutput] = useState('')
  const toast = useToast()

  const generate = useCallback(() => {
    const n = Math.min(100, Math.max(1, Number(count) || 1))
    let parts
    if (unit === 'words') parts = [Array.from({ length: n }, pick).join(' ')]
    else if (unit === 'sentences') parts = [Array.from({ length: n }, sentence).join(' ')]
    else parts = Array.from({ length: n }, paragraph)

    let text = parts.join('\n\n')
    if (classic) {
      // Convention: the first paragraph opens with the canonical phrase.
      text = text.replace(/^\S[^.]*\./, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.')
    }
    setOutput(text)
  }, [unit, count, classic])

  useEffect(() => { generate() }, [generate])

  const words = output.trim() ? output.trim().split(/\s+/).length : 0

  return (
    <div>
      <PageHeader icon={Type} title="Lorem Ipsum Generator" subtitle="Placeholder copy by words, sentences or paragraphs." accent="amber" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-end gap-5">
            <Tabs
              value={unit}
              onChange={setUnit}
              options={[
                { value: 'paragraphs', label: 'Paragraphs' },
                { value: 'sentences', label: 'Sentences' },
                { value: 'words', label: 'Words' },
              ]}
            />
            <div>
              <label className="t-muted mb-1 block text-xs">How many</label>
              <Input type="number" min="1" max="100" value={count} onChange={(e) => setCount(e.target.value)} className="w-24" />
            </div>
            <Checkbox checked={classic} onChange={(e) => setClassic(e.target.checked)} label="Start with “Lorem ipsum…”" />
            <Button onClick={generate} type="button"><RefreshCw className="h-3.5 w-3.5" />Regenerate</Button>
          </div>
        </Panel>

        <Panel
          title="Output"
          description={`${words} words · ${output.length} characters`}
          actions={<CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />}
        >
          <div className="bd sunken t-main max-h-[460px] space-y-3 overflow-auto rounded-xl border p-4 text-sm leading-relaxed">
            {output.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
