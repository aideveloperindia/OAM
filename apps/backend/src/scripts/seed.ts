import bcrypt from 'bcryptjs'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { prisma } from '../config/prisma'
import { logger } from '../config/logger'

interface RosterRow {
  tenantId: string
  rollNumber: string
  name: string
  parentPhone?: string
  parentName?: string
  email?: string
  subjectCode?: string
  batchCode?: string
}

const DEFAULT_PASSWORD = 'OAM@123'

const TENANTS = [
  {
    id: 'scee',
    name: 'School of Civil and Environmental Engineering',
    shortName: 'SCEE',
    timezone: 'Asia/Kolkata',
    contactEmail: 'attendance@scee.edu.in',
    contactPhone: '+91-90210-10001'
  },
  {
    id: 'scit',
    name: 'School of Computing and Information Technology',
    shortName: 'SCIT',
    timezone: 'Asia/Kolkata',
    contactEmail: 'attendance@scit.edu.in',
    contactPhone: '+91-90210-10002'
  }
]

const COURSES = [
  {
    code: 'CE-201',
    name: 'Structural Analysis II'
  },
  {
    code: 'IT-305',
    name: 'Applied Machine Intelligence'
  },
  {
    code: 'MA-101',
    name: 'Engineering Mathematics'
  }
]

const BATCHES = [
  {
    code: 'SCEE-Y3-A',
    name: 'SCEE Year 3 Section A',
    year: 3
  },
  {
    code: 'SCIT-Y2-B',
    name: 'SCIT Year 2 Section B',
    year: 2
  }
]

const FACULTY = [
  {
    name: 'Prof. Sai Teja',
    email: 'saiteja@scee.edu.in',
    phone: '+91-90010-20001'
  },
  {
    name: 'Dr. Anusha Priya',
    email: 'anusha.priya@scit.edu.in',
    phone: '+91-90010-20002'
  }
]

const STUDENTS = [
  {
    rollNumber: 'SCEE2101',
    name: 'Saanvi',
    parentName: 'Lakshmi',
    parentPhone: '+91-90011-30001'
  },
  {
    rollNumber: 'SCEE2102',
    name: 'Chaitanya',
    parentName: 'Madhavi',
    parentPhone: '+91-90011-30002'
  },
  {
    rollNumber: 'SCIT2201',
    name: 'Navya',
    parentName: 'Divya',
    parentPhone: '+91-90011-30003'
  },
  {
    rollNumber: 'SCIT2202',
    name: 'Mahesh',
    parentName: 'Rekha',
    parentPhone: '+91-90011-30004'
  }
]

const parseRosterCsv = (filePath: string): RosterRow[] => {
  const absolutePath = resolve(process.cwd(), filePath)
  const content = readFileSync(absolutePath, 'utf-8')
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (!lines.length) {
    return []
  }
  const headers = lines[0].split(',').map((header) => header.trim())
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim())
    const row: Partial<RosterRow> = {}
    headers.forEach((header, index) => {
      ;(row as Record<string, string>)[header] = values[index] ?? ''
    })
    return {
      tenantId: row.tenantId ?? '',
      rollNumber: row.rollNumber ?? '',
      name: row.name ?? '',
      parentPhone: row.parentPhone,
      parentName: row.parentName,
      email: row.email,
      subjectCode: row.subjectCode,
      batchCode: row.batchCode
    }
  })
}

const seed = async () => {
  logger.info('Starting OAM seed process')
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  await prisma.attendanceAudit.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.scheduleEntry.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.batch.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()

  logger.info('Cleared existing data')

  for (const tenant of TENANTS) {
    await prisma.tenant.create({
      data: tenant
    })

    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `admin.${tenant.id}@oam.in`,
        passwordHash,
        role: 'ADMIN',
        name: `${tenant.shortName} Administrator`,
        phone: tenant.contactPhone,
        status: 'ACTIVE'
      }
    })
  }

  for (const [index, faculty] of FACULTY.entries()) {
    const tenant = TENANTS[index % TENANTS.length]
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: faculty.email,
        passwordHash,
        role: 'FACULTY',
        name: faculty.name,
        phone: faculty.phone,
        status: 'ACTIVE'
      }
    })
  }

  for (const student of STUDENTS) {
    const tenant = student.rollNumber.startsWith('SCEE') ? TENANTS[0] : TENANTS[1]
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `${student.rollNumber.toLowerCase()}@${tenant.shortName.toLowerCase()}.edu.in`,
        passwordHash,
        role: 'STUDENT',
        name: student.name,
        rollNumber: student.rollNumber,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        status: 'ACTIVE'
      }
    })
  }

  for (const tenant of TENANTS) {
    for (const course of COURSES) {
      await prisma.subject.create({
        data: {
          tenantId: tenant.id,
          code: course.code,
          name: course.name
        }
      })
    }

    for (const batch of BATCHES) {
      await prisma.batch.create({
        data: {
          tenantId: tenant.id,
          code: `${tenant.shortName}-${batch.code}`,
          name: `${tenant.shortName} ${batch.name}`,
          year: batch.year
        }
      })
    }
  }

  const sceeFaculty = await prisma.user.findFirst({
    where: { tenantId: 'scee', role: 'FACULTY' }
  })
  const scitFaculty = await prisma.user.findFirst({
    where: { tenantId: 'scit', role: 'FACULTY' }
  })

  const sceeSubject = await prisma.subject.findFirst({
    where: { tenantId: 'scee' }
  })
  const scitSubject = await prisma.subject.findFirst({
    where: { tenantId: 'scit' }
  })

  const sceeBatch = await prisma.batch.findFirst({
    where: { tenantId: 'scee' }
  })
  const scitBatch = await prisma.batch.findFirst({
    where: { tenantId: 'scit' }
  })

  if (!sceeFaculty || !sceeSubject || !sceeBatch || !scitFaculty || !scitSubject || !scitBatch) {
    throw new Error('Failed to locate seeded faculty/subjects/batches')
  }

  const scheduleEntries = await prisma.$transaction([
    prisma.scheduleEntry.create({
      data: {
        tenantId: 'scee',
        subjectId: sceeSubject.id,
        batchId: sceeBatch.id,
        facultyId: sceeFaculty.id,
        startsAt: new Date(Date.now() + 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        location: 'SCEE Block, Room 301'
      }
    }),
    prisma.scheduleEntry.create({
      data: {
        tenantId: 'scit',
        subjectId: scitSubject.id,
        batchId: scitBatch.id,
        facultyId: scitFaculty.id,
        startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
        location: 'SCIT Lab 2'
      }
    })
  ])

  const rosterFile = process.argv.find((arg) => arg.startsWith('--roster='))?.split('=')[1]
  const rosterEnv = process.env.ROSTER_CSV
  const rosterPath = rosterFile ?? rosterEnv ?? null

  if (rosterPath) {
    const rows = parseRosterCsv(rosterPath)
    logger.info(`Importing ${rows.length} roster rows from ${rosterPath}`)
    for (const row of rows) {
      if (!row.tenantId || !row.rollNumber || !row.name) {
        continue
      }

      const password = row.email ? row.rollNumber : DEFAULT_PASSWORD
      const rowPasswordHash = await bcrypt.hash(password, 10)

      const student = await prisma.user.upsert({
        where: {
          rollNumber: row.rollNumber
        },
        update: {
          name: row.name,
          parentName: row.parentName,
          parentPhone: row.parentPhone,
          tenantId: row.tenantId
        },
        create: {
          tenantId: row.tenantId,
          email: row.email ?? `${row.rollNumber.toLowerCase()}@${row.tenantId}.edu.in`,
          passwordHash: rowPasswordHash,
          role: 'STUDENT',
          name: row.name,
          rollNumber: row.rollNumber,
          parentName: row.parentName,
          parentPhone: row.parentPhone,
          status: 'ACTIVE'
        }
      })

      if (row.subjectCode) {
        const subject = await prisma.subject.findFirst({
          where: { tenantId: row.tenantId, code: row.subjectCode }
        })
        if (subject) {
          const batch = row.batchCode
            ? await prisma.batch.findFirst({
                where: { tenantId: row.tenantId, code: row.batchCode }
              })
            : null
          await prisma.enrollment.upsert({
            where: {
              studentId_subjectId: {
                studentId: student.id,
                subjectId: subject.id
              }
            },
            update: {},
            create: {
              tenantId: row.tenantId,
              studentId: student.id,
              subjectId: subject.id,
              batchId: batch?.id ?? (row.tenantId === 'scee' ? sceeBatch.id : scitBatch.id),
              status: 'ACTIVE'
            }
          })
        }
      }
    }
  }

  const sceeStudents = await prisma.user.findMany({
    where: { tenantId: 'scee', role: 'STUDENT' }
  })

  for (const student of sceeStudents) {
    await prisma.enrollment.upsert({
      where: {
        studentId_subjectId: {
          studentId: student.id,
          subjectId: sceeSubject.id
        }
      },
      update: {},
      create: {
        tenantId: 'scee',
        studentId: student.id,
        subjectId: sceeSubject.id,
        batchId: sceeBatch.id
      }
    })
  }

  const scitStudents = await prisma.user.findMany({
    where: { tenantId: 'scit', role: 'STUDENT' }
  })

  for (const student of scitStudents) {
    await prisma.enrollment.upsert({
      where: {
        studentId_subjectId: {
          studentId: student.id,
          subjectId: scitSubject.id
        }
      },
      update: {},
      create: {
        tenantId: 'scit',
        studentId: student.id,
        subjectId: scitSubject.id,
        batchId: scitBatch.id
      }
    })
  }

  const now = new Date()
  const attendanceSeed = sceeStudents.slice(0, 2)

  for (const student of attendanceSeed) {
    await prisma.attendance.create({
      data: {
        tenantId: 'scee',
        scheduleEntryId: scheduleEntries[0].id,
        studentId: student.id,
        facultyId: sceeFaculty.id,
        status: 'PRESENT',
        capturedAt: new Date(now.getTime() - 15 * 60 * 1000),
        capturedAtLocal: new Date(now.getTime() - 15 * 60 * 1000),
        localId: `seed-${student.id}`
      }
    })
  }

  logger.info('Seed process finished')
}

seed()
  .then(async () => {
    await prisma.$disconnect()
    logger.info('Seeding complete')
  })
  .catch(async (error) => {
    logger.error(error, 'Seeding failed')
    await prisma.$disconnect()
    process.exit(1)
  })


