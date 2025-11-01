import { ReactNode } from 'react'

interface DataTableProps {
  headers: string[]
  rows: (string | number | ReactNode)[][]
}

export default function DataTable({ headers, rows }: DataTableProps) {
  return (
    <table className="min-w-full text-sm divide-y divide-gray-700">
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} className="px-4 py-2 text-left text-gray-400">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {rows.map((row, idx) => (
          <tr key={idx} className="hover:bg-[#1a1a1a]">
            {row.map((cell, i) => (
              <td key={i} className="px-4 py-2">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
