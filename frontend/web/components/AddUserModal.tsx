import { useState, FormEvent } from 'react'
import Modal from './Modal'
import { adminLogger } from '../lib/logger'

interface AddUserModalProps {
  open: boolean
  onClose: () => void
  onAdd: (email: string) => void
}

export default function AddUserModal({ open, onClose, onAdd }: AddUserModalProps) {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    adminLogger.logUserAction('add_user_form_submit', 'AddUserModal', { 
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2') // Partially mask email for privacy
    })
    
    try {
      onAdd(email)
      setEmail('')
      onClose()
      
      adminLogger.info('USER_MANAGEMENT', 'User add form submitted successfully')
    } catch (error) {
      adminLogger.logError('AddUserModal.handleSubmit', error as Error, { email: 'masked' })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Pievienot lietotāju">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-pasts"
          className="w-full rounded-md bg-[#1A1A1A] p-2 text-sm focus:border-primary focus:outline-none"
        />
        <div className="text-right">
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-bg">
            Saglabāt
          </button>
        </div>
      </form>
    </Modal>
  )
}
