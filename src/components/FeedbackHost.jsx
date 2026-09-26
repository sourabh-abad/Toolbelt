import { Suspense, lazy, useEffect, useState } from 'react'

// The form's code loads the first time someone opens it, not with every page.
const FeedbackDialog = lazy(() => import('./FeedbackDialog'))

/** Listens for openFeedback() (src/lib/feedback.js) and shows the dialog. */
export default function FeedbackHost() {
  const [open, setOpen] = useState(null)
  useEffect(() => {
    const onOpen = (e) => setOpen({ type: e.detail?.type, at: Date.now() })
    window.addEventListener('devpocket:feedback', onOpen)
    return () => window.removeEventListener('devpocket:feedback', onOpen)
  }, [])
  if (!open) return null
  return (
    <Suspense fallback={null}>
      <FeedbackDialog key={open.at} initialType={open.type} onClose={() => setOpen(null)} />
    </Suspense>
  )
}
