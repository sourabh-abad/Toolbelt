import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext({ toast: () => {} })

const STYLES = {
  success: { icon: CheckCircle2, cls: 'text-emerald-500', ring: 'border-emerald-500/30' },
  error: { icon: AlertCircle, cls: 'text-rose-500', ring: 'border-rose-500/30' },
  info: { icon: Info, cls: 'text-sky-500', ring: 'border-sky-500/30' },
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setItems((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message, type = 'success') => {
      const id = ++idRef.current
      setItems((list) => [...list, { id, message, type }])
      setTimeout(() => dismiss(id), 2600)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
        {items.map(({ id, message, type }) => {
          const s = STYLES[type] || STYLES.info
          const Icon = s.icon
          return (
            <div
              key={id}
              className={`animate-toast-in panel pointer-events-auto flex items-center gap-2.5 rounded-xl border ${s.ring} px-3.5 py-2.5 text-sm shadow-lg`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${s.cls}`} />
              <span className="t-main max-w-xs">{message}</span>
              <button onClick={() => dismiss(id)} className="t-faint hover:t-main ml-1" type="button">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext).toast
