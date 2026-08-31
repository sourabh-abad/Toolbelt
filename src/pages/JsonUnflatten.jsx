import { Boxes } from 'lucide-react'
import JsonToolPage from '../components/JsonToolPage'
import { unflatten } from '../lib/jsonops'
import { Input } from '../components/ui'

const SAMPLE = `{
  "user.name": "Ada Lovelace",
  "user.address.city": "London",
  "user.tags[0]": "admin",
  "user.tags[1]": "editor",
  "active": true
}`

export default function JsonUnflatten() {
  return (
    <JsonToolPage
      icon={Boxes}
      title="JSON Unflattener"
      subtitle="Rebuild nested objects and arrays from dot-notation keys."
      accent="teal"
      sample={SAMPLE}
      defaultOptions={{ delimiter: '.' }}
      controls={(o, set) => (
        <>
          <label className="t-muted text-xs">Delimiter</label>
          <Input className="w-24" value={o.delimiter} onChange={(e) => set({ ...o, delimiter: e.target.value || '.' })} />
        </>
      )}
      transform={(v, o) => JSON.stringify(unflatten(v, o.delimiter), null, 2)}
    />
  )
}
