import { useMemo, useState } from 'react'
import { useTenant } from '../hooks/useTenant'
import { formatDisplayDate } from '../lib/date'

interface PredictedAbsentee {
  studentId: string
  rollNumber: string
  studentName: string
  className: string
  subjectName: string
  probability: number
  reason: string
}

const dummyPredictions: PredictedAbsentee[] = [
  {
    studentId: '1',
    rollNumber: 'SCIT2201',
    studentName: 'Rajesh Kumar',
    className: 'CSE-2A',
    subjectName: 'Data Structures',
    probability: 0.87,
    reason: '3 consecutive absences in last week'
  },
  {
    studentId: '2',
    rollNumber: 'SCIT2202',
    studentName: 'Priya Sharma',
    className: 'CSE-2A',
    subjectName: 'Operating Systems',
    probability: 0.78,
    reason: 'Absence pattern matches historical trend'
  },
  {
    studentId: '3',
    rollNumber: 'SCIT2210',
    studentName: 'Anil Reddy',
    className: 'CSE-2B',
    subjectName: 'Database Management',
    probability: 0.92,
    reason: '5 absences in last 10 sessions for this subject'
  },
  {
    studentId: '4',
    rollNumber: 'SCIT2215',
    studentName: 'Sneha Patel',
    className: 'ECE-2A',
    subjectName: 'Digital Electronics',
    probability: 0.81,
    reason: 'Recent streak + 48% overall absence rate'
  },
  {
    studentId: '5',
    rollNumber: 'SCIT2220',
    studentName: 'Vijay Singh',
    className: 'ECE-2A',
    subjectName: 'Signals and Systems',
    probability: 0.75,
    reason: 'Weekend pattern + late arrivals'
  },
  {
    studentId: '6',
    rollNumber: 'SCIT2225',
    studentName: 'Kavya Nair',
    className: 'MECH-2A',
    subjectName: 'Thermodynamics',
    probability: 0.89,
    reason: 'Missed 4 out of last 6 sessions'
  }
]

export const PredictedAbsenteesPage = () => {
  const { tenant } = useTenant()
  const [selectedClass, setSelectedClass] = useState<string>('all')

  const classes = useMemo(() => {
    const unique = Array.from(
      new Set(dummyPredictions.map((p) => p.className))
    )
    return unique.sort()
  }, [])

  const filteredPredictions = useMemo(() => {
    if (selectedClass === 'all') return dummyPredictions
    return dummyPredictions.filter((p) => p.className === selectedClass)
  }, [selectedClass])

  const tomorrowDate = useMemo(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return formatDisplayDate(tomorrow.toISOString())
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-primary-dark">
          Predictive Analytics
        </p>
        <h1 className="text-xl font-semibold text-slate-900">
          Students likely to be absent tomorrow ({tomorrowDate})
        </h1>
        <p className="text-sm text-slate-600">
          Based on historical attendance patterns, absence streaks, and subject-specific trends.
          Use this list to proactively notify parents or schedule interventions.
        </p>
      </header>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setSelectedClass('all')}
          className={[
            'rounded-full border px-4 py-2 text-sm font-semibold transition',
            selectedClass === 'all'
              ? 'border-primary bg-primary text-white'
              : 'border-slate-300 bg-white text-slate-600 hover:border-primary hover:text-primary'
          ].join(' ')}
        >
          All Classes ({dummyPredictions.length})
        </button>
        {classes.map((cls) => {
          const count = dummyPredictions.filter((p) => p.className === cls).length
          return (
            <button
              key={cls}
              type="button"
              onClick={() => setSelectedClass(cls)}
              className={[
                'rounded-full border px-4 py-2 text-sm font-semibold transition',
                selectedClass === cls
                  ? 'border-primary bg-primary text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-primary hover:text-primary'
              ].join(' ')}
            >
              {cls} ({count})
            </button>
          )
        })}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Roll Number</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Probability</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPredictions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-600">
                    No predictions available for the selected class.
                  </td>
                </tr>
              ) : (
                filteredPredictions.map((prediction) => {
                  const probabilityPercent = Math.round(prediction.probability * 100)
                  const probabilityColor =
                    prediction.probability >= 0.85
                      ? 'bg-danger/10 text-danger border-danger/20'
                      : prediction.probability >= 0.75
                        ? 'bg-warning/10 text-warning border-warning/20'
                        : 'bg-primary/10 text-primary border-primary/20'

                  return (
                    <tr key={prediction.studentId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {prediction.rollNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {prediction.studentName}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {prediction.className}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {prediction.subjectName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${probabilityColor}`}
                        >
                          {probabilityPercent}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {prediction.reason}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        Predictions refresh nightly. The ML model analyzes rolling 45-day windows and recent streaks.
        Proactively contact guardians or schedule counseling for high-probability cases.
      </footer>
    </div>
  )
}


