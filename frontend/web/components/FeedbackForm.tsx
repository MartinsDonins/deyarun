import { useState, FormEvent } from 'react'

interface FeedbackData {
  name: string
  email: string
  message: string
}

interface FeedbackFormProps {
  onSubmit: (data: FeedbackData) => void
}

export default function FeedbackForm({ onSubmit }: FeedbackFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ name, email, message })
    setName('')
    setEmail('')
    setMessage('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Vārds"
        className="w-full rounded-md bg-[#1A1A1A] p-2 text-sm focus:border-primary focus:outline-none"
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-pasts"
        className="w-full rounded-md bg-[#1A1A1A] p-2 text-sm focus:border-primary focus:outline-none"
      />
      <textarea
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Jūsu atsauksme"
        rows={4}
        className="w-full rounded-md bg-[#1A1A1A] p-2 text-sm focus:border-primary focus:outline-none"
      />
      <div className="text-right">
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-bg">
          Nosūtīt
        </button>
      </div>
    </form>
  )
}
