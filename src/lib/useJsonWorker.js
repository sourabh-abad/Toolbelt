import { useEffect, useRef, useState } from 'react'

// Below this, parsing inline is faster than the round trip to a worker.
const WORKER_THRESHOLD = 50_000

/**
 * Runs a JSON transform, on the main thread for small inputs and in a worker
 * once the payload is large enough that parsing would visibly block. Falls
 * back to inline work if workers are unavailable.
 */
export function useJsonWorker(text, op, options, inlineTransform) {
  const [state, setState] = useState({ result: '', error: '', busy: false })
  const workerRef = useRef(null)
  const requestId = useRef(0)
  const optionsKey = JSON.stringify(options ?? {})

  useEffect(() => {
    return () => workerRef.current?.terminate()
  }, [])

  useEffect(() => {
    const parsedOptions = JSON.parse(optionsKey)

    if (!text.trim()) {
      setState({ result: '', error: '', busy: false })
      return
    }

    // Small payload: do it inline, no worker latency.
    if (text.length < WORKER_THRESHOLD || typeof Worker === 'undefined') {
      try {
        setState({ result: inlineTransform(JSON.parse(text), parsedOptions), error: '', busy: false })
      } catch (e) {
        setState({ result: '', error: e.message, busy: false })
      }
      return
    }

    if (!workerRef.current) {
      try {
        workerRef.current = new Worker(new URL('./jsonWorker.js', import.meta.url), { type: 'module' })
      } catch {
        // No worker support — fall back rather than break the tool.
        try {
          setState({ result: inlineTransform(JSON.parse(text), parsedOptions), error: '', busy: false })
        } catch (e) {
          setState({ result: '', error: e.message, busy: false })
        }
        return
      }
    }

    const id = ++requestId.current
    setState((s) => ({ ...s, busy: true }))

    const onMessage = (e) => {
      // Ignore results from superseded requests.
      if (e.data.id !== requestId.current) return
      workerRef.current.removeEventListener('message', onMessage)
      setState(
        e.data.ok
          ? { result: e.data.result, error: '', busy: false }
          : { result: '', error: e.data.error, busy: false }
      )
    }

    workerRef.current.addEventListener('message', onMessage)
    workerRef.current.postMessage({ id, text, op, options: parsedOptions })

    return () => workerRef.current?.removeEventListener('message', onMessage)
  }, [text, op, optionsKey, inlineTransform])

  return state
}
