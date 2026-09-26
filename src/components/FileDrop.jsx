import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from './ui'

/**
 * Makes its children a drop target for one file and renders nothing extra
 * except a highlight while a file is dragged over. Files are read locally;
 * nothing is uploaded anywhere despite the word on the button.
 */
export function FileDrop({ onFile, children, className = '' }) {
  const [over, setOver] = useState(false)
  return (
    <div
      className={`relative ${className}`}
      onDragOver={(e) => {
        if (![...e.dataTransfer.types].includes('Files')) return
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        const file = e.dataTransfer.files?.[0]
        if (!file) return
        e.preventDefault()
        setOver(false)
        onFile(file)
      }}
    >
      {children}
      {over && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-500/10 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Drop the file to read it locally
        </div>
      )}
    </div>
  )
}

/** "Upload" button backed by a hidden file input. */
export function UploadButton({ onFile, accept, label = 'Upload' }) {
  const ref = useRef(null)
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
      <Button variant="ghost" type="button" onClick={() => ref.current?.click()} title="Read a file from your device (it stays in this tab)">
        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </Button>
    </>
  )
}
