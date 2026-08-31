import { ArrowUpDown } from 'lucide-react'
import JsonToolPage from '../components/JsonToolPage'
import { sortKeys } from '../lib/jsonops'
import { Select } from '../components/ui'

export default function JsonSortKeys() {
  return (
    <JsonToolPage
      icon={ArrowUpDown}
      title="JSON Sort Keys"
      subtitle="Alphabetise object keys at every level. Array order is left untouched."
      accent="sky"
      defaultOptions={{ direction: 'asc', indent: 2 }}
      controls={(o, set) => (
        <>
          <label className="t-muted text-xs">Order</label>
          <Select value={o.direction} onChange={(e) => set({ ...o, direction: e.target.value })}>
            <option value="asc">A → Z</option>
            <option value="desc">Z → A</option>
          </Select>
        </>
      )}
      transform={(v, o) => JSON.stringify(sortKeys(v, o.direction), null, 2)}
    />
  )
}
