interface HeaderBarProps {
  onMenuToggle?: () => void
}

export default function HeaderBar({ onMenuToggle }: HeaderBarProps) {
  return (
    <header className="flex items-center justify-between bg-[#121212] px-6 py-4">
      <button
        aria-label="Menu"
        onClick={onMenuToggle}
        className="mr-4 text-primary md:hidden"
      >
        &#9776;
      </button>
      <div className="flex flex-1 items-center justify-end">
        <span className="mr-4">Admin</span>
        <button className="text-sm text-primary hover:underline">Izlogoties</button>
      </div>
    </header>
  )
}
