export type TenantKey = 'scee' | 'scit'

interface DemoDashboardSummary {
  subjectId: string
  subjectName: string
  attended: number
  total: number
  lastUpdated: string
}

interface DemoUpcomingSession {
  id: string
  subjectName: string
  facultyName: string
  scheduledAt: string
  location: string
}

interface DemoDashboard {
  studentName: string
  rollNumber: string
  overallPercentage: number
  summaries: DemoDashboardSummary[]
  upcomingSessions: DemoUpcomingSession[]
  syncStatus: {
    lastSyncedAt?: string
    pendingCount: number
  }
}

interface DemoReportRow {
  subjectId: string
  subjectName: string
  batchId: string
  batchName: string
  date: string
  present: number
  absent: number
  late: number
  syncedAt?: string
}

interface DemoQueueItem {
  localId: string
  studentId: string
  syncStatus: 'pending' | 'synced' | 'failed'
  capturedAt: string
  lastAttemptAt?: string
}

export interface TenantConfig {
  id: TenantKey
  name: string
  shortName: string
  accentColor: string
  whatsappCode: string
  address: string
  logoUrl: string
  contactEmail: string
  contactPhone: string
  whatsappSenderNumber: string
  demoRoster: Array<{
    id: string
    rollNumber: string
    name: string
    parentPhone: string
    parentName: string
    riskLevel?: 'low' | 'medium' | 'high'
  }>
  demoDashboard: DemoDashboard
  demoReports: DemoReportRow[]
  demoQueue: DemoQueueItem[]
}

export const TENANTS: Record<TenantKey, TenantConfig> = {
  scee: {
    id: 'scee',
    name: 'Sree Chaitanya College of Engineering',
    shortName: 'SCEE',
    accentColor: '#146C94',
    whatsappCode: '91',
    address: 'SCEE Campus, Hyderabad, Telangana 500001, India',
    logoUrl: '/assets/college-logo.png',
    contactEmail: 'support@scee.edu.in',
    contactPhone: '+91 90000 11111',
    whatsappSenderNumber: '+91 90000 33333',
    demoRoster: [
      {
        id: 'scee-stud-1',
        rollNumber: 'SCEE2101',
        name: 'Saanvi',
        parentPhone: '+91 90011 30001',
        parentName: 'Lakshmi',
        riskLevel: 'medium'
      },
      {
        id: 'scee-stud-2',
        rollNumber: 'SCEE2102',
        name: 'Chaitanya',
        parentPhone: '+91 90011 30002',
        parentName: 'Madhavi',
        riskLevel: 'low'
      }
    ],
    demoDashboard: {
      studentName: 'Saanvi',
      rollNumber: 'SCEE2101',
      overallPercentage: 92,
      summaries: [
        {
          subjectId: 'scee-structural-demo',
          subjectName: 'Structural Analysis (Demo)',
          attended: 22,
          total: 24,
          lastUpdated: new Date().toISOString()
        },
        {
          subjectId: 'scee-maths-demo',
          subjectName: 'Engineering Mathematics (Demo)',
          attended: 20,
          total: 24,
          lastUpdated: new Date().toISOString()
        }
      ],
      upcomingSessions: [
        {
          id: 'scee-upcoming-1',
          subjectName: 'Structural Analysis (Demo)',
          facultyName: 'Prof. Sai Teja',
          scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          location: 'SCEE Block, Room 301'
        },
        {
          id: 'scee-upcoming-2',
          subjectName: 'Engineering Mathematics (Demo)',
          facultyName: 'Prof. Sai Teja',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          location: 'SCEE Auditorium'
        }
      ],
      syncStatus: {
        lastSyncedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        pendingCount: 0
      }
    },
    demoReports: [
      {
        subjectId: 'scee-structural-demo',
        subjectName: 'Structural Analysis (Demo)',
        batchId: 'SCEE Year 3 Section A (Demo)',
        batchName: 'SCEE Year 3 Section A (Demo)',
        date: new Date().toISOString(),
        present: 42,
        absent: 3,
        late: 1,
        syncedAt: new Date().toISOString()
      },
      {
        subjectId: 'scee-maths-demo',
        subjectName: 'Engineering Mathematics (Demo)',
        batchId: 'SCEE Year 3 Section A (Demo)',
        batchName: 'SCEE Year 3 Section A (Demo)',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        present: 40,
        absent: 5,
        late: 2,
        syncedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    demoQueue: [
      {
        localId: 'scee-queue-1',
        studentId: 'Saanvi',
        syncStatus: 'pending',
        capturedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        localId: 'scee-queue-2',
        studentId: 'Chaitanya',
        syncStatus: 'synced',
        capturedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        lastAttemptAt: new Date(Date.now() - 50 * 60 * 1000).toISOString()
      },
      {
        localId: 'scee-queue-3',
        studentId: 'Saanvi',
        syncStatus: 'failed',
        capturedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        lastAttemptAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ]
  },
  scit: {
    id: 'scit',
    name: 'Sree Chaitanya Institute of Technological Sciences',
    shortName: 'SCIT',
    accentColor: '#1D8CB5',
    whatsappCode: '91',
    address: 'SCIT Campus, Hyderabad, Telangana 500002, India',
    logoUrl: '/assets/college-logo.png',
    contactEmail: 'support@scit.edu.in',
    contactPhone: '+91 90000 22222',
    whatsappSenderNumber: '+91 90000 33333',
    demoRoster: [
      {
        id: 'scit-stud-1',
        rollNumber: 'SCIT2201',
        name: 'Navya',
        parentPhone: '+91 90011 30003',
        parentName: 'Divya',
        riskLevel: 'high'
      },
      {
        id: 'scit-stud-2',
        rollNumber: 'SCIT2202',
        name: 'Mahesh',
        parentPhone: '+91 90011 30004',
        parentName: 'Rekha',
        riskLevel: 'low'
      }
    ],
    demoDashboard: {
      studentName: 'Navya',
      rollNumber: 'SCIT2201',
      overallPercentage: 88,
      summaries: [
        {
          subjectId: 'scit-aiml-demo',
          subjectName: 'Applied Machine Intelligence (Demo)',
          attended: 18,
          total: 22,
          lastUpdated: new Date().toISOString()
        },
        {
          subjectId: 'scit-dsa-demo',
          subjectName: 'Data Structures Lab (Demo)',
          attended: 20,
          total: 22,
          lastUpdated: new Date().toISOString()
        }
      ],
      upcomingSessions: [
        {
          id: 'scit-upcoming-1',
          subjectName: 'Applied Machine Intelligence (Demo)',
          facultyName: 'Dr. Anusha Priya',
          scheduledAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
          location: 'SCIT Lab 2'
        },
        {
          id: 'scit-upcoming-2',
          subjectName: 'Data Structures Lab (Demo)',
          facultyName: 'Dr. Anusha Priya',
          scheduledAt: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString(),
          location: 'SCIT Coding Studio'
        }
      ],
      syncStatus: {
        lastSyncedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        pendingCount: 2
      }
    },
    demoReports: [
      {
        subjectId: 'scit-aiml-demo',
        subjectName: 'Applied Machine Intelligence (Demo)',
        batchId: 'SCIT Year 2 Section B (Demo)',
        batchName: 'SCIT Year 2 Section B (Demo)',
        date: new Date().toISOString(),
        present: 39,
        absent: 4,
        late: 2,
        syncedAt: new Date().toISOString()
      },
      {
        subjectId: 'scit-dsa-demo',
        subjectName: 'Data Structures Lab (Demo)',
        batchId: 'SCIT Year 2 Section B (Demo)',
        batchName: 'SCIT Year 2 Section B (Demo)',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        present: 38,
        absent: 3,
        late: 1,
        syncedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    demoQueue: [
      {
        localId: 'scit-queue-1',
        studentId: 'Navya',
        syncStatus: 'pending',
        capturedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        localId: 'scit-queue-2',
        studentId: 'Mahesh',
        syncStatus: 'synced',
        capturedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        lastAttemptAt: new Date(Date.now() - 40 * 60 * 1000).toISOString()
      },
      {
        localId: 'scit-queue-3',
        studentId: 'Navya',
        syncStatus: 'failed',
        capturedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        lastAttemptAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
      }
    ]
  }
}

export const TENANT_LIST = Object.values(TENANTS)

