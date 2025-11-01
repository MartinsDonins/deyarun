import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartProps {
  data: { name: string; value: number }[]
  color?: string
}

export default function Chart({ data, color = '#00C896' }: ChartProps) {
  return (
    <div className="bg-[#121212] p-4 rounded-xl">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <XAxis dataKey="name" stroke="#B0B0B0" />
          <YAxis stroke="#B0B0B0" />
          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
