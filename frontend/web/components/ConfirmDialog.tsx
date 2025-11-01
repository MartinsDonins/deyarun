interface ConfirmDialogProps {
  open: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ open, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-[#121212] p-6 text-center">
        <p className="mb-4">{message}</p>
        <div className="flex justify-end space-x-4">
          <button onClick={onCancel} className="text-sm text-gray-400 hover:underline">
            Atcelt
          </button>
          <button onClick={onConfirm} className="text-sm text-primary hover:underline">
            Apstiprināt
          </button>
        </div>
      </div>
    </div>
  )
}
