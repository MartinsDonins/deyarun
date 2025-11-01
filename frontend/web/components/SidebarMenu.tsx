import Link from 'next/link'
import { useRouter } from 'next/router'

const links = [
  { href: '/', label: 'Pārskats' },
  { href: '/users', label: 'Lietotāji' },
  { href: '/trainings', label: 'Treniņi' },
  { href: '/training-plan', label: 'Treniņu plāns' },
  { href: '/leaderboard', label: 'Līderi' },
  { href: '/coach-tips', label: 'Padomi' }
]

interface SidebarMenuProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
  const { pathname } = useRouter()

  const content = (
    <nav className="space-y-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`block hover:text-primary ${pathname === link.href ? 'text-primary' : ''}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )

  if (isOpen) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <aside className="w-56 bg-[#121212] p-6">{content}</aside>
        <div className="flex-1 bg-black/60" onClick={onClose} />
      </div>
    )
  }

  return (
    <aside className="hidden w-56 bg-[#121212] p-6 md:block">{content}</aside>
  )
}
