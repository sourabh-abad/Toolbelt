import { useState } from 'react'
import md5 from 'md5'
import { Binary } from 'lucide-react'
import { bytesToBase64, sha } from '../lib/utils'
import { Panel, Button, CopyButton, TextArea, ErrorBanner, PageHeader } from '../components/ui'

function Base64Section() {
  const [input, setInput] = useState('Hello, world!')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const encode = () => {
    try {
      const bytes = new TextEncoder().encode(input)
      setOutput(bytesToBase64(bytes))
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }
  const decode = () => {
    try {
      const binary = atob(input.trim())
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
      setOutput(new TextDecoder().decode(bytes))
      setError('')
    } catch {
      setError('Invalid Base64 input.')
    }
  }

  return (
    <Panel title="Base64" description="Encode text to Base64 or decode a Base64 string, with full Unicode support.">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Text or Base64…" />
          <div className="mt-3 flex gap-2">
            <Button onClick={encode} type="button">Encode →</Button>
            <Button variant="subtle" onClick={decode} type="button">Decode →</Button>
          </div>
        </div>
        <div>
          <TextArea rows={6} value={output} readOnly placeholder="Result…" />
          <div className="mt-3">
            <CopyButton text={output} />
          </div>
        </div>
      </div>
      <div className="mt-2">
        <ErrorBanner>{error}</ErrorBanner>
      </div>
    </Panel>
  )
}

function UrlSection() {
  const [input, setInput] = useState('https://example.com/search?q=hello world&lang=en')
  const [output, setOutput] = useState('')
  const [full, setFull] = useState(false)

  const encode = () => setOutput(full ? encodeURI(input) : encodeURIComponent(input))
  const decode = () => {
    try {
      setOutput(full ? decodeURI(input) : decodeURIComponent(input))
    } catch {
      setOutput('Invalid encoded input.')
    }
  }

  return (
    <Panel title="URL Encode / Decode" description="encodeURIComponent by default, or full-URI mode which preserves reserved characters like : / ? &.">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <TextArea rows={5} value={input} onChange={(e) => setInput(e.target.value)} placeholder="URL or text…" />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button onClick={encode} type="button">Encode →</Button>
            <Button variant="subtle" onClick={decode} type="button">Decode →</Button>
            <label className="flex items-center gap-1.5 text-xs t-muted">
              <input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} className="accent-emerald-500" />
              Full URI mode
            </label>
          </div>
        </div>
        <div>
          <TextArea rows={5} value={output} readOnly placeholder="Result…" />
          <div className="mt-3">
            <CopyButton text={output} />
          </div>
        </div>
      </div>
    </Panel>
  )
}

function HashSection() {
  const [input, setInput] = useState('Hello, world!')
  const [hashes, setHashes] = useState(null)
  const [busy, setBusy] = useState(false)

  const compute = async () => {
    setBusy(true)
    try {
      const [sha1, sha256, sha384, sha512] = await Promise.all([
        sha('SHA-1', input),
        sha('SHA-256', input),
        sha('SHA-384', input),
        sha('SHA-512', input),
      ])
      setHashes({ MD5: md5(input), 'SHA-1': sha1, 'SHA-256': sha256, 'SHA-384': sha384, 'SHA-512': sha512 })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel title="Hash Generator" description="MD5 and SHA family digests of the text below, computed locally.">
      <TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Text to hash…" />
      <div className="mt-3">
        <Button onClick={compute} disabled={busy} type="button">{busy ? 'Hashing…' : 'Generate hashes'}</Button>
      </div>
      {hashes && (
        <div className="mt-4 space-y-2">
          {Object.entries(hashes).map(([algo, value]) => (
            <div key={algo} className="flex items-center gap-3 rounded-lg border bd sunken px-3 py-2">
              <span className="w-20 shrink-0 text-xs font-semibold t-muted">{algo}</span>
              <span className="mono flex-1 truncate text-xs t-main">{value}</span>
              <CopyButton text={value} label="" />
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

export default function EncodeDecodeTool() {
  return (
    <div>
      <PageHeader icon={Binary} title="Encode / Decode" subtitle="Base64, URL encoding and hashing — all computed locally in your browser." accent="violet" />
      <div className="space-y-4 p-4 sm:p-6">
        <Base64Section />
        <UrlSection />
        <HashSection />
      </div>
    </div>
  )
}
