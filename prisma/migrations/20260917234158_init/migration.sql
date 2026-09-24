-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'tutor', 'student');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'in_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "TutorLevel" AS ENUM ('entry', 'established', 'expert');

-- CreateEnum
CREATE TYPE "ExceptionKind" AS ENUM ('blocked', 'extra');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('booked', 'confirmed', 'completed', 'cancelled', 'no_show');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "locale" TEXT NOT NULL DEFAULT 'en-NG',
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_applications" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT '',
    "photoUrl" TEXT NOT NULL DEFAULT '',
    "education" TEXT NOT NULL DEFAULT '',
    "subjects" TEXT[],
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT NOT NULL,
    "introVideoUrl" TEXT NOT NULL,
    "certifications" TEXT[],
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "availabilityRules" JSONB NOT NULL DEFAULT '[]',
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "reviewNote" TEXT NOT NULL DEFAULT '',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutor_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_profiles" (
    "tutorId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "education" TEXT NOT NULL DEFAULT '',
    "subjects" TEXT[],
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT NOT NULL,
    "introVideoUrl" TEXT NOT NULL DEFAULT '',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "moderationFlagged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tutor_profiles_pkey" PRIMARY KEY ("tutorId")
);

-- CreateTable
CREATE TABLE "tutor_performance" (
    "tutorId" TEXT NOT NULL,
    "level" "TutorLevel" NOT NULL DEFAULT 'entry',
    "cumulativeHoursTaught" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "responseTimeMinutesAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trialToPaidConversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cancellationRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_performance_pkey" PRIMARY KEY ("tutorId")
);

-- CreateTable
CREATE TABLE "mojo_plus_subscriptions" (
    "tutorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "customSegmentRateMinor" INTEGER,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "mojo_plus_subscriptions_pkey" PRIMARY KEY ("tutorId")
);

-- CreateTable
CREATE TABLE "availability_rules" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_exceptions" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "kind" "ExceptionKind" NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "availability_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduling_settings" (
    "tutorId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "bufferMinutes" INTEGER NOT NULL DEFAULT 15,
    "minimumNoticeMinutes" INTEGER NOT NULL DEFAULT 60,
    "pausedForNewBookings" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "scheduling_settings_pkey" PRIMARY KEY ("tutorId")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'booked',
    "isTrial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_status_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_confirmations" (
    "sessionId" TEXT NOT NULL,
    "confirmedBy" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_confirmations_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "wallets" (
    "tutorId" TEXT NOT NULL,
    "balanceMinor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("tutorId")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "relatedSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "rail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "rail" TEXT NOT NULL,
    "last4" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_subscriptions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "lessonsPerCycle" INTEGER NOT NULL,
    "cycleLengthDays" INTEGER NOT NULL DEFAULT 28,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "lesson_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_charges" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "segments" INTEGER NOT NULL,
    "perSegmentMinor" INTEGER NOT NULL,
    "standardTotalMinor" INTEGER NOT NULL,
    "trialDiscountMinor" INTEGER NOT NULL DEFAULT 0,
    "totalMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "isTrial" BOOLEAN NOT NULL DEFAULT false,
    "level" TEXT NOT NULL,
    "isCustomRate" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethodId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'captured',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charge_refunds" (
    "id" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charge_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_interests" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'view',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutor_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_links" (
    "code" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownerRole" TEXT NOT NULL,

    CONSTRAINT "referral_links_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "referral_conversions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "newUserId" TEXT NOT NULL,
    "convertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardAppliedAt" TIMESTAMP(3),

    CONSTRAINT "referral_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "filedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "filedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_recaps" (
    "sessionId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "focusAreas" TEXT[],
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedByTutor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lesson_recaps_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "practice_items" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "practice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "audit_log_entries" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_taxonomy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "subject_taxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replacement_grants" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "sourceSessionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'granted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedSessionId" TEXT,
    "redeemedAt" TIMESTAMP(3),

    CONSTRAINT "replacement_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_tokens_tokenHash_key" ON "session_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "session_tokens_userId_idx" ON "session_tokens"("userId");

-- CreateIndex
CREATE INDEX "availability_rules_tutorId_weekday_idx" ON "availability_rules"("tutorId", "weekday");

-- CreateIndex
CREATE INDEX "availability_exceptions_tutorId_date_idx" ON "availability_exceptions"("tutorId", "date");

-- CreateIndex
CREATE INDEX "sessions_tutorId_startAt_idx" ON "sessions"("tutorId", "startAt");

-- CreateIndex
CREATE INDEX "sessions_studentId_startAt_idx" ON "sessions"("studentId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "student_charges_sessionId_key" ON "student_charges"("sessionId");

-- CreateIndex
CREATE INDEX "student_charges_studentId_idx" ON "student_charges"("studentId");

-- CreateIndex
CREATE INDEX "charge_refunds_studentId_idx" ON "charge_refunds"("studentId");

-- CreateIndex
CREATE INDEX "messages_senderId_recipientId_idx" ON "messages"("senderId", "recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_interests_studentId_tutorId_key" ON "tutor_interests"("studentId", "tutorId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_sessionId_key" ON "reviews"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_sessionId_key" ON "disputes"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "replacement_grants_sourceSessionId_key" ON "replacement_grants"("sourceSessionId");

-- AddForeignKey
ALTER TABLE "session_tokens" ADD CONSTRAINT "session_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_profiles" ADD CONSTRAINT "tutor_profiles_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_performance" ADD CONSTRAINT "tutor_performance_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduling_settings" ADD CONSTRAINT "scheduling_settings_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_status_events" ADD CONSTRAINT "session_status_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_confirmations" ADD CONSTRAINT "delivery_confirmations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "wallets"("tutorId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_refunds" ADD CONSTRAINT "charge_refunds_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "student_charges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
