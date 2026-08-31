import { Eraser } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import JsonToolPage from '../components/JsonToolPage'
import { removeNulls, removeEmpty } from '../lib/jsonops'

/**
 * Two routes, one component: /json-remove-nulls strips only nulls, while
 * /json-remove-empty also drops "", [] and {}. Sharing the implementation
 * keeps the two behaviours from drifting apart.
 */
export default function JsonClean() {
  const { pathname } = useLocation()
  const strict = pathname.includes('empty')

  return (
    <JsonToolPage
      icon={Eraser}
      title={strict ? 'Remove Empty Values from JSON' : 'Remove Nulls from JSON'}
      subtitle={
        strict
          ? 'Strip nulls, empty strings, empty arrays and empty objects at every level.'
          : 'Strip every null value and null array entry, at every level.'
      }
      accent={strict ? 'rose' : 'amber'}
      workerOp={strict ? 'removeEmpty' : 'removeNulls'}
      transform={(v) => JSON.stringify(strict ? removeEmpty(v) : removeNulls(v), null, 2)}
    />
  )
}
