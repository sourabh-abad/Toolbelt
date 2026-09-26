import { useEffect, useMemo, useState } from 'react'
import { Binary, Trash2, Download, FileText } from 'lucide-react'
import {
  encodeText,
  encodeBytes,
  decodeToBytes,
  bytesToText,
  looksLikeBase64,
  looksLikeBase64Url,
  sniff,
  splitDataUri,
} from '../lib/base64'
import { downloadFile, readBytes, formatBytes } from '../lib/files'
import { takeHandoff } from '../lib/handoff'
import { useDebounced } from '../lib/useDebounced'
import { useToast } from '../lib/toast'
import SplitPane from '../components/SplitPane'
import { FileDrop, UploadButton } from '../components/FileDrop'
import { Panel, Button, CopyButton, TextArea, ErrorBanner, PageHeader, Tabs, Checkbox } from '../components/ui'

const SAMPLES = {
  encode: 'Hello, DevPocket! Ünïcödé and emoji work too 🚀',
  decode: 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImFkbWluIjp0cnVlfQ',
}

/**
 * Live Base64 / Base64URL encoder and decoder. Text is encoded as UTF-8; a
 * dropped file is encoded byte for byte and also offered as a data: URI.
 * Decoded bytes that are not text are identified by their magic bytes, shown
 * as an image preview where they are one, and offered as a download.
 */
export default function Base64Tool() {
  const [input, setInput] = useState(SAMPLES.encode)
  const [mode, setMode] = useState('encode')
  const [url, setUrl] = useState(false)
  // Once the user picks a direction or alphabet, stop second-guessing them
  // until the input is replaced.
  const [manual, setManual] = useState(false)
  const [file, setFile] = useState(null) // { name, type, bytes }
  const debounced = useDebounced(input, 150)
  const toast = useToast()

  // "Decode segment in Base64" from the JWT tools hands the segment over.
  useEffect(() => {
    const v = takeHandoff('/base64')
    if (typeof v === 'string') setInput(v)
  }, [])

  useEffect(() => {
    if (manual || file || !debounced.trim()) return
    const payload = splitDataUri(debounced)?.data ?? debounced
    const isB64 = Boolean(splitDataUri(debounced)) || looksLikeBase64(payload)
    setMode(isB64 ? 'decode' : 'encode')
    setUrl(isB64 && looksLikeBase64Url(payload))
  }, [debounced, manual, file])

  const result = useMemo(() => {
    if (file) {
      const b64 = encodeBytes(file.bytes, { url })
      const type = file.type || sniff(file.bytes)?.mime || 'application/octet-stream'
      return { kind: 'file', text: b64, dataUri: `data:${type};base64,${encodeBytes(file.bytes)}`, type }
    }
    if (!debounced) return { kind: 'empty' }
    if (mode === 'encode') return { kind: 'text', text: encodeText(debounced, { url }) }
    try {
      const uri = splitDataUri(debounced)
      const bytes = decodeToBytes(uri ? uri.data : debounced, { url })
      const text = bytesToText(bytes)
      const type = sniff(bytes) || (uri ? { mime: uri.mime, ext: uri.mime.split('/')[1] || 'bin', image: uri.mime.startsWith('image/') } : null)
      if (text !== null && !type?.image) return { kind: 'text', text, bytes }
      return { kind: 'binary', bytes, type }
    } catch (e) {
      return { kind: 'error', error: e.message }
    }
  }, [debounced, mode, url, file])

  const preview = useMemo(() => {
    if (result.kind === 'binary' && result.type?.image) return URL.createObjectURL(new Blob([result.bytes], { type: result.type.mime }))
    if (result.kind === 'file' && result.type.startsWith('image/')) return result.dataUri
    return null
  }, [result])
  useEffect(() => () => preview?.startsWith('blob:') && URL.revokeObjectURL(preview), [preview])

  const replaceInput = (text) => {
    setFile(null)
    setManual(false)
    setInput(text)
  }

  async function loadFile(f) {
    const bytes = await readBytes(f)
    setFile({ name: f.name, type: f.type, bytes })
    setMode('encode')
    toast(`Encoding ${f.name} locally`)
  }

  const output = result.kind === 'text' || result.kind === 'file' ? result.text : ''
  const decodedBytes = result.kind === 'binary' ? result.bytes : result.kind === 'text' && mode === 'decode' ? result.bytes : null

  return (
    <div>
      <PageHeader icon={Binary} title="Base64" subtitle="Encode and decode Base64 and Base64URL, text or files, as you type." accent="violet" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              value={mode}
              onChange={(m) => {
                setMode(m)
                setManual(true)
              }}
              options={[
                { value: 'encode', label: 'Encode' },
                { value: 'decode', label: 'Decode' },
              ]}
            />
            <Checkbox
              checked={url}
              onChange={(e) => {
                setUrl(e.target.checked)
                setManual(true)
              }}
              label="Base64URL (- _ and no padding)"
            />
            {!manual && !file && input.trim() && (
              <span className="t-muted text-xs">Direction and alphabet detected from the input — change either to override.</span>
            )}
          </div>
        </Panel>

        <SplitPane
          storageKey="devpocket-split-base64"
          left={
            <Panel
              title={file ? 'File' : mode === 'encode' ? 'Text' : 'Base64'}
              actions={
                <>
                  <UploadButton onFile={loadFile} />
                  <Button variant="ghost" type="button" onClick={() => replaceInput(SAMPLES[mode])}>Sample</Button>
                  <Button variant="ghost" type="button" onClick={() => replaceInput('')}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Clear
                  </Button>
                </>
              }
            >
              <FileDrop onFile={loadFile}>
                {file ? (
                  <div className="bd sunken flex items-center gap-3 rounded-xl border px-3 py-3 text-sm">
                    <FileText className="t-muted h-5 w-5 shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="t-main truncate font-medium">{file.name}</div>
                      <div className="t-muted text-xs">{formatBytes(file.bytes.length)} · {result.type}</div>
                    </div>
                    <Button variant="ghost" type="button" onClick={() => replaceInput('')}>Remove</Button>
                  </div>
                ) : (
                  <TextArea
                    rows={12}
                    value={input}
                    onChange={(e) => {
                      if (!e.target.value) setManual(false)
                      setInput(e.target.value)
                    }}
                    aria-label={mode === 'encode' ? 'Text to encode' : 'Base64 to decode'}
                    placeholder={mode === 'encode' ? 'Type or paste text, or drop a file…' : 'Paste Base64, Base64URL or a data: URI…'}
                  />
                )}
              </FileDrop>
              <p className="t-faint mt-2 text-xs">Drop any file here to get its Base64 and a data: URI. It is read in this tab and never uploaded.</p>
            </Panel>
          }
          right={
            <Panel
              title={mode === 'encode' ? (url ? 'Base64URL' : 'Base64') : 'Decoded'}
              description={output ? `${output.length.toLocaleString()} characters` : decodedBytes ? formatBytes(decodedBytes.length) : undefined}
              actions={
                <>
                  <CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />
                  {decodedBytes && (
                    <Button
                      variant="subtle"
                      type="button"
                      onClick={() => downloadFile(decodedBytes, `decoded.${result.type?.ext || (result.kind === 'text' ? 'txt' : 'bin')}`, result.type?.mime)}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />Download as file
                    </Button>
                  )}
                </>
              }
            >
              <div aria-live="polite">
                {result.kind === 'error' && <ErrorBanner>{result.error}</ErrorBanner>}
                {result.kind === 'binary' && (
                  <div className="bd sunken t-muted rounded-xl border px-3 py-2.5 text-sm">
                    Binary data, {formatBytes(result.bytes.length)}
                    {result.type ? ` — looks like ${result.type.mime}` : ' — not valid UTF-8 text'}. Download it to open it.
                  </div>
                )}
              </div>
              {output && <TextArea rows={12} value={output} readOnly aria-label="Result" className="mt-0" />}
              {result.kind === 'empty' && <p className="t-faint text-sm">The result appears here as you type.</p>}
              {preview && (
                <figure className="mt-3">
                  <img src={preview} alt="Preview of the decoded image" className="bd max-h-64 rounded-lg border object-contain" />
                  <figcaption className="t-faint mt-1 text-xs">Image preview, rendered locally</figcaption>
                </figure>
              )}
              {result.kind === 'file' && (
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <h3 className="t-muted text-xs font-semibold">data: URI</h3>
                    <CopyButton text={result.dataUri} onCopied={() => toast('data: URI copied')} />
                  </div>
                  <TextArea rows={4} value={result.dataUri} readOnly aria-label="data: URI" />
                </div>
              )}
            </Panel>
          }
        />
      </div>
    </div>
  )
}
