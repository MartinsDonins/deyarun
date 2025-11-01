import ProtectedLayout from '../components/layout/ProtectedLayout'
import DataTable from '../components/DataTable'
import Chart from '../components/Chart'
import { withAuth } from '../contexts/AuthContext'

function TrainingsPage() {
  const trainings = [
    { date: '2025-06-20', duration: '30min', distance: '5km' },
    { date: '2025-06-21', duration: '42min', distance: '7km' }
  ]

  const chartData = [
    { name: 'Pirmdiena', value: 5 },
    { name: 'Otrdiena', value: 7 },
    { name: 'Trešdiena', value: 4 },
    { name: 'Ceturtdiena', value: 6 },
    { name: 'Piektdiena', value: 8 },
    { name: 'Sestdiena', value: 3 },
    { name: 'Svētdiena', value: 0 }
  ]

  return (
    <ProtectedLayout title="Treniņi">
      <div className="space-y-8">
        <DataTable
          headers={['Datums', 'Ilgums', 'Distance']}
          rows={trainings.map(t => [t.date, t.duration, t.distance])}
        />
        <Chart data={chartData} />
      </div>
    </ProtectedLayout>
  )
}

export default withAuth(TrainingsPage)
