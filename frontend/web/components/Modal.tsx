import { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export default function Modal({ open, onClose, children, title }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-[#121212] p-6">
        {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
        {children}
        <div className="mt-6 text-right">
          <button onClick={onClose} className="text-sm text-primary hover:underline">
            Aizvērt
          </button>
        </div>
      </div>
    </div>
  )
}
