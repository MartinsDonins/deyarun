interface UserBadgeProps {
  name: string
  status: string
}

export default function UserBadge({ name, status }: UserBadgeProps) {
  return (
    <div className="flex items-center space-x-2 rounded-lg bg-[#121212] px-3 py-2">
      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-bg font-semibold">
        {name.charAt(0)}
      </div>
      <div>
        <p className="text-sm font-medium leading-none">{name}</p>
        <p className="text-xs text-gray-400">{status}</p>
      </div>
    </div>
  )
}
