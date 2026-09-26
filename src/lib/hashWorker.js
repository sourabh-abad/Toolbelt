/** Hashes a file off the main thread, so a large one does not freeze the tab. */
import { digestAll } from './hashing.js'

self.onmessage = async (e) => {
  const { id, buffer } = e.data
  try {
    const digests = await digestAll(new Uint8Array(buffer))
    self.postMessage({ id, ok: true, digests })
  } catch (err) {
    self.postMessage({ id, ok: false, error: err?.message || String(err) })
  }
}
