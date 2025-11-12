-- Enums
CREATE TYPE "UserRole" AS ENUM ('FACULTY', 'STUDENT', 'ADMIN');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');
CREATE TYPE "AttendanceSource" AS ENUM ('OFFLINE', 'MANUAL', 'IMPORT');
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'WITHDRAWN');
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'CONFLICT');

-- Core tables
CREATE TABLE "Tenant" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "shortName" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "rollNumber" TEXT UNIQUE,
  "parentName" TEXT,
  "parentPhone" TEXT,
  "whatsappConsent" BOOLEAN NOT NULL DEFAULT TRUE,
  "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "User_tenantId_role_idx" ON "User" ("tenantId", "role");

CREATE TABLE "RefreshToken" (
  "id" TEXT PRIMARY KEY,
  "token" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMPTZ
);

CREATE INDEX "RefreshToken_userId_expiresAt_idx" ON "RefreshToken" ("userId", "expiresAt");

CREATE TABLE "Subject" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "credits" INTEGER NOT NULL DEFAULT 4,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Subject_tenantId_code_key" ON "Subject" ("tenantId", "code");

CREATE TABLE "Batch" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Batch_tenantId_code_key" ON "Batch" ("tenantId", "code");

CREATE TABLE "ScheduleEntry" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "subjectId" TEXT NOT NULL REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "batchId" TEXT NOT NULL REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "facultyId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "startsAt" TIMESTAMPTZ NOT NULL,
  "endsAt" TIMESTAMPTZ NOT NULL,
  "location" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ScheduleEntry_tenantId_startsAt_idx" ON "ScheduleEntry" ("tenantId", "startsAt");

CREATE TABLE "Enrollment" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "batchId" TEXT NOT NULL REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "subjectId" TEXT NOT NULL REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Enrollment_studentId_subjectId_key" ON "Enrollment" ("studentId", "subjectId");
CREATE INDEX "Enrollment_tenantId_batchId_idx" ON "Enrollment" ("tenantId", "batchId");

CREATE TABLE "Attendance" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "scheduleEntryId" TEXT NOT NULL REFERENCES "ScheduleEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "facultyId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "status" "AttendanceStatus" NOT NULL,
  "capturedAt" TIMESTAMPTZ NOT NULL,
  "capturedAtLocal" TIMESTAMPTZ,
  "source" "AttendanceSource" NOT NULL DEFAULT 'OFFLINE',
  "localId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Attendance_scheduleEntryId_studentId_key" ON "Attendance" ("scheduleEntryId", "studentId");
CREATE INDEX "Attendance_tenantId_scheduleEntryId_idx" ON "Attendance" ("tenantId", "scheduleEntryId");
CREATE INDEX "Attendance_tenantId_studentId_idx" ON "Attendance" ("tenantId", "studentId");

CREATE TABLE "AttendanceAudit" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "attendanceId" TEXT REFERENCES "Attendance"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "actorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "action" "AuditAction" NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AttendanceAudit_tenantId_action_idx" ON "AttendanceAudit" ("tenantId", "action");
CREATE INDEX "AttendanceAudit_attendanceId_idx" ON "AttendanceAudit" ("attendanceId");


