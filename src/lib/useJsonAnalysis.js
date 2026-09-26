import { useEffect, useMemo, useRef, useState } from 'react'
import { analyzeJson } from './jsonvalidate.js'
import { reviveLossless } from './jsonparse.js'
import { useDebounced } from './useDebounced'

// Below this, analysing inline is faster than the round trip to a worker and
// keeps feedback instant while typing.
export const WORKER_THRESHOLD = 50_000
const DEBOUNCE_MS = 250

const PENDING = analyzeJson('')

/**
 * The JSON Validator's analysis of `input`: inline and synchronous for small
 * documents, debounced and in a Web Worker for large ones. `busy` is true
 * while a newer answer is on its way; the previous result stays on screen in
 * the meantime so the page does not flash empty.
 */
export function useJsonAnalysis(input, options) {
  const large = input.length >= WORKER_THRESHOLD
  const optionsKey = JSON.stringify(options)

  const inline = useMemo(
    () => (large ? null : analyzeJson(input, JSON.parse(optionsKey))),
    [large, input, optionsKey]
  )

  const debounced = useDebounced(large ? input : '', DEBOUNCE_MS)
  // The last answer and what it was computed from; busy is derived from it.
  const [remote, setRemote] = useState({ result: null, text: null, optionsKey: null })
  const workerRef = useRef(null)
  const requestId = useRef(0)

  useEffect(() => () => workerRef.current?.terminate(), [])

  useEffect(() => {
    if (!large || !debounced) return
    const id = ++requestId.current
    const opts = JSON.parse(optionsKey)
    const finish = (result) => {
      if (id !== requestId.current) return
      setRemote({ result: { ...result, value: reviveLossless(result.value, result.bigNumbers) }, text: debounced, optionsKey })
    }
    const runInline = () => setTimeout(() => finish(analyzeJson(debounced, opts)), 0)


    if (typeof Worker === 'undefined') {
      runInline()
      return
    }
    if (!workerRef.current) {
      try {
        workerRef.current = new Worker(new URL('./jsonValidateWorker.js', import.meta.url), { type: 'module' })
      } catch {
        runInline()
        return
      }
    }
    const worker = workerRef.current
    const onMessage = (e) => {
      if (e.data.id !== id) return
      cleanup()
      if (e.data.ok) finish(e.data.result)
      else runInline()
    }
    const onError = () => {
      cleanup()
      worker.terminate()
      workerRef.current = null
      runInline()
    }
    const cleanup = () => {
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
    }
    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)
    worker.postMessage({ id, text: debounced, options: opts })
    return cleanup
  }, [large, debounced, optionsKey])

  if (!large) return { ...inline, busy: false }
  const busy = debounced !== input || remote.text !== debounced || remote.optionsKey !== optionsKey
  return { ...(remote.result ?? PENDING), busy, empty: false }
}
