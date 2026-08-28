# Mojo — 02. Class Diagrams

The object/type structure of each implemented module. Because Mojo is TypeScript
with **ports** (interfaces) and **use-case factory functions** rather than
traditional inheritance, the diagrams below mix:

- **`<<interface>>` ports** — defined in a module's `domain/`, implemented by `infrastructure/`
- **`<<class>>` infrastructure adapters** — the only place Prisma/SDK imports live
- **`<<function>>` use-case factories** (`make*`) — the `application/` layer
- **pure functions** and **value objects** from `domain/`
- **`<<scaffold>>`** — modules at domain-type depth only

Mermaid `classDiagram` has no native "function returns a function API" concept, so
factories are drawn as classes exposing their returned use-case method; the
`make*` factory is named on the class via a note where relevant.

Full-depth modules are documented in detail. Scaffold modules are documented
compactly. See `assets/uml/README.md` for the depth legend.

---

## 1. shared/domain — cross-module value objects

```mermaid
classDiagram
    class Money {
        <<value object>>
        +amountMinor int
        +currency 'NGN' | 'USD'
    }
    class TimeRange {
        <<value object>>
        +startIso string
        +endIso string
    }
    class money {
        <<function>>
        +(amountMinor, currency) Money
    }
    class addMoney {
        <<function>>
        +(a Money, b Money) Money
    }
    class subtractMoney {
        <<function>>
        +(a Money, b Money) Money
    }
    class percentOf {
        <<function>>
        +(amount Money, percent number) Money
    }
    class overlaps {
        <<function>>
        +(a TimeRange, b TimeRange) boolean
    }
    class durationMinutes {
        <<function>>
        +(range TimeRange) number
    }
    money --> Money : creates
    addMoney ..> Money : uses
    subtractMoney ..> Money : uses
    percentOf ..> Money : uses
    overlaps ..> TimeRange : uses
    durationMinutes ..> TimeRange : uses
```

`libs/shared/domain/src/money.ts`, `time-range.ts`. `Money` is always an integer
count in the smallest unit (kobo/cents); `addMoney`, `subtractMoney`, `percentOf`,
`formatMoney` are the arithmetic helpers.

---

## 2. shared/events — the event bus

```mermaid
classDiagram
    class DomainEvent {
        <<interface>>
        +name Name
        +occurredAt string
        +payload Payload
    }
    class MojoEvent {
        <<type alias union>>
        SessionBooked | SessionCancelled | SessionCompleted | SessionNoShow
        SessionDeliveryConfirmed | TutorLevelChanged | MojoPlusSubscribed
        MojoPlusCancelled | PayoutRequested | PayoutCompleted | ReviewSubmitted
        DisputeFiled | DisputeResolved
    }
    class EventBus {
        -handlers Map~MojoEventName, Set~Handler~~
        +subscribe(name, handler) unsubscribe
        +publish(event) Promise~void~
    }
    class eventBus {
        <<singleton instance>>
    }
    DomainEvent --> MojoEvent
    MojoEvent --> EventBus
    EventBus --> eventBus : one process-wide instance
```

`EventBus` (`libs/shared/events/src/event-bus.ts`) is in-process pub/sub: modules
import the shared `eventBus` singleton rather than constructing their own, so a
publisher and a subscriber talk to the same bus within the single process. The full
12-event union is listed in [04-behavioral](04-behavioral.md#11-event-catalog-as-defined-in-code).

---

## 3. identity

```mermaid
classDiagram
    class User {
        <<domain type>>
        +id string
        +email string
        +role Role
        +passwordHash string
        +timezone string
        +locale string
        +suspendedAt string | null
        +createdAt string
    }
    class Role {
        <<enum>>
        admin
        tutor
        student
    }
    class Session {
        <<domain type>>
        +token string
        +userId string
        +expiresAt string
    }
    class UserRepository {
        <<interface port>>
        +findByEmail(email) Promise~User|null~
        +findById(id) Promise~User|null~
        +save(user) Promise~void~
    }
    class PasswordHasher {
        <<interface port>>
        +hash(plain) Promise~string~
        +verify(plain, hash) Promise~boolean~
    }
    class TokenIssuer {
        <<interface port>>
        +issue(userId) Promise~IssuedToken~
    }
    class PrismaUserRepository {
        +prisma PrismaClient
        +findByEmail(email) Promise~User|null~
        +findById(id) Promise~User|null~
        +save(user) Promise~void~
    }
    class bcryptPasswordHasher {
        <<singleton>>
        +hash(plain) Promise~string~
        +verify(plain, hash) Promise~boolean~
    }
    class registerUser {
        <<use-case factory makeRegisterUser>>
        +(input RegisterUserInput) Promise~User~
    }
    class authenticateUser {
        <<use-case factory makeAuthenticateUser>>
        +(input AuthenticateUserInput) Promise~AuthenticateUserResult~
    }
    class checkPasswordPolicy {
        <<pure function>>
        +(password) PasswordPolicyResult
    }
    PrismaUserRepository ..|> UserRepository
    bcryptPasswordHasher ..|> PasswordHasher
    registerUser --> UserRepository
    registerUser --> PasswordHasher
    registerUser --> checkPasswordPolicy
    authenticateUser --> UserRepository
    authenticateUser --> PasswordHasher
    authenticateUser --> TokenIssuer
    User --> Role
```

`libs/identity`. Domain errors: `WeakPasswordError`, `EmailAlreadyRegisteredError`
(register), `InvalidCredentialsError`, `AccountSuspendedError` (authenticate).
Password policy (`password-policy.ts`): ≥10 chars, ≥1 uppercase, ≥1 digit, no
whitespace — unit-tested in `password-policy.spec.ts`; `makeAuthenticateUser` is
integration-tested in `authenticate-user.use-case.spec.ts` against in-memory fakes
of all three ports.

---

## 4. scheduling

```mermaid
classDiagram
    class AvailabilityRule {
        <<domain type>>
        +id string
        +tutorId string
        +weekday Weekday
        +startMinute int
        +endMinute int
    }
    class AvailabilityException {
        <<domain type>>
        +id string
        +tutorId string
        +date string
        +kind ExceptionKind
        +startMinute int
        +endMinute int
    }
    class SchedulingSettings {
        <<domain type>>
        +tutorId string
        +timezone string
        +bufferMinutes int
        +minimumNoticeMinutes int
        +pausedForNewBookings boolean
    }
    class ScheduledSession {
        <<domain type>>
        +id string
        +tutorId string
        +studentId string
        +startIso string
        +endIso string
        +status SessionStatus
        +isTrial boolean
        +statusHistory StatusEvent[]
    }
    class SessionStatus {
        <<enum>>
        booked
        confirmed
        completed
        cancelled
        no_show
    }
    class AvailabilityRepository {
        <<interface port>>
        +getRules(tutorId) Promise~AvailabilityRule[]~
        +getExceptions(tutorId, date) Promise~AvailabilityException[]~
        +getSettings(tutorId) Promise~SchedulingSettings~
    }
    class SessionRepository {
        <<interface port>>
        +getBookedSessions(tutorId, rangeStart, rangeEnd) Promise~ScheduledSession[]~
        +save(session) Promise~void~
        +findById(id) Promise~ScheduledSession|null~
    }
    class PrismaAvailabilityRepository {
        +prisma PrismaClient
        +getRules(tutorId) Promise~AvailabilityRule[]~
        +getExceptions(tutorId, date) Promise~AvailabilityException[]~
        +getSettings(tutorId) Promise~SchedulingSettings~
    }
    class PrismaSessionRepository {
        +prisma PrismaClient
        +getBookedSessions(tutorId, rangeStart, rangeEnd) Promise~ScheduledSession[]~
        +save(session) Promise~void~
        +findById(id) Promise~ScheduledSession|null~
    }
    class bookSession {
        <<use-case factory makeBookSession>>
        +(input BookSessionInput) Promise~ScheduledSession~
        +publishes SessionBooked
    }
    class cancelSession {
        <<use-case factory makeCancelSession>>
        +(input CancelSessionInput) Promise~void~
        +publishes SessionCancelled
    }
    class setAvailability {
        <<use-case factory makeSetAvailability>>
        +(tutorId, rules) Promise~void~
    }
    class hasConflict {
        <<pure function>>
        +(candidate TimeRange, existing) boolean
    }
    class withinNoticeWindow {
        <<pure function>>
        +(start, now, minimumNoticeMinutes) boolean
    }
    class respectsBuffer {
        <<pure function>>
        +(candidate, existing, bufferMinutes) boolean
    }
    PrismaAvailabilityRepository ..|> AvailabilityRepository
    PrismaSessionRepository ..|> SessionRepository
    bookSession --> AvailabilityRepository
    bookSession --> SessionRepository
    bookSession --> hasConflict
    bookSession --> withinNoticeWindow
    bookSession --> respectsBuffer
    cancelSession --> SessionRepository
    ScheduledSession --> SessionStatus
    AvailabilityException --> ExceptionKind : uses
    hasConflict ..> TimeRange : uses (from shared/domain)
```

`libs/scheduling`. Conflict/buffer/notice logic is pure and unit-tested
(`conflict-detection.spec.ts`); `makeBookSession` is integration-tested against
fakes and asserts the `SessionBooked` event is published
(`book-session.use-case.spec.ts`). `makeSetAvailability` is a placeholder that only
writes through a `save` callback — the read-only `AvailabilityRepository` port has
no write method today.

---

## 5. booking

```mermaid
classDiagram
    class DeliveryConfirmation {
        <<domain type>>
        +sessionId string
        +confirmedBy 'student' | 'auto_window'
        +confirmedAt string
    }
    class BookingRepository {
        <<interface port>>
        +findById(sessionId) Promise~ScheduledSession|null~
        +markCompleted(sessionId, at) Promise~void~
        +markNoShow(sessionId, by, at) Promise~void~
        +saveConfirmation(confirmation) Promise~void~
    }
    class PrismaBookingRepository {
        +prisma PrismaClient
        +findById(sessionId) Promise~ScheduledSession|null~
        +markCompleted(sessionId, at) Promise~void~
        +markNoShow(sessionId, by, at) Promise~void~
        +saveConfirmation(confirmation) Promise~void~
    }
    class confirmDelivery {
        <<use-case factory makeConfirmDelivery>>
        +(input ConfirmDeliveryInput) Promise~void~
        +publishes SessionCompleted
        +publishes SessionDeliveryConfirmed
    }
    BookingRepository ..> ScheduledSession : returns (from scheduling)
    PrismaBookingRepository ..|> BookingRepository
    confirmDelivery --> BookingRepository
    confirmDelivery ..> segmentsBetween : from shared/util
```

`libs/booking`. `AUTO_CONFIRM_WINDOW_HOURS = 48` is the constant referenced by the
roadmap's payout logic (`session-lifecycle.types.ts`). `confirmDelivery` derives
`segmentCount` via `segmentsBetween` (ceil-to-15-min) and publishes both
`SessionCompleted` and `SessionDeliveryConfirmed`. Domain error: `SessionNotBookedError`.
Tested in `confirm-delivery.use-case.spec.ts`.

---

## 6. pricing

```mermaid
classDiagram
    class TutorLevel {
        <<enum>>
        entry
        established
        expert
    }
    class SegmentRate {
        <<domain type>>
        +level TutorLevel
        +perSegment Money
        +isCustom boolean
    }
    class CommissionSplit {
        <<domain type>>
        +total Money
        +tutorTakeHome Money
        +platformCommission Money
    }
    class TutorLevelReader {
        <<interface port>>
        +getLevel(tutorId) Promise~TutorLevel~
        +hasMojoPlus(tutorId) Promise~boolean~
        +getCustomRateMinor(tutorId) Promise~number|null~
    }
    class PrismaTutorLevelReader {
        +prisma PrismaClient
        +getLevel(tutorId) Promise~TutorLevel~
        +hasMojoPlus(tutorId) Promise~boolean~
        +getCustomRateMinor(tutorId) Promise~number|null~
    }
    class recordSessionCompletion {
        <<use-case factory makeRecordSessionCompletion>>
        +(event SessionCompleted) Promise~CommissionSplit~
    }
    class calculateLessonCharge {
        <<pure function>>
        +(segments, rate, takeHomePercent) CommissionSplit
    }
    class calculateTrialLessonCharge {
        <<pure function>>
        +(segments, rate) CommissionSplit
    }
    class effectiveTakeHomePercent {
        <<pure function>>
        +(basePercent, hasMojoPlus) number
    }
    PrismaTutorLevelReader ..|> TutorLevelReader
    recordSessionCompletion --> TutorLevelReader
    recordSessionCompletion --> calculateLessonCharge
    recordSessionCompletion --> calculateTrialLessonCharge
    recordSessionCompletion --> effectiveTakeHomePercent
    SegmentRate --> TutorLevel
    CommissionSplit ..> Money : uses (from shared/domain)
```

`libs/pricing`. Constants: `BASE_TAKE_HOME_PERCENT = { entry:50, established:60,
expert:70 }`, `MOJO_PLUS_BONUS_PERCENT = 10`, `DEFAULT_SEGMENT_RATE_NGN =
{ entry:400000, established:600000, expert:800000 }` (kobo). This is the pure,
I/O-free Phase 2 monetization model called out in `mojo-roadmap.md`; fully
unit-tested in `calculate-lesson-charge.spec.ts` and
`record-session-completion.use-case.spec.ts`.

---

## 7. payments

```mermaid
classDiagram
    class Wallet {
        <<domain type>>
        +tutorId string
        +balance Money
    }
    class WalletTransaction {
        <<domain type>>
        +id string
        +tutorId string
        +kind TransactionKind
        +amount Money
        +relatedSessionId string | null
        +createdAt string
    }
    class TransactionKind {
        <<enum>>
        credit
        debit
        payout
        manual_adjustment
    }
    class PayoutRequest {
        <<domain type>>
        +id string
        +tutorId string
        +amount Money
        +rail PayoutRail
        +status pending | approved | completed | rejected
    }
    class PayoutRail {
        <<enum>>
        paystack
        flutterwave
        payoneer
        wise
    }
    class WalletRepository {
        <<interface port>>
        +getWallet(tutorId) Promise~Wallet~
        +credit(tutorId, amount, relatedSessionId) Promise~WalletTransaction~
        +savePayoutRequest(request) Promise~void~
    }
    class PayoutRailPort {
        <<interface port>>
        +send(tutorId, amount) Promise~ExternalRef~
    }
    class PrismaWalletRepository {
        +prisma PrismaClient
        +getWallet(tutorId) Promise~Wallet~
        +credit(tutorId, amount, relatedSessionId) Promise~WalletTransaction~
        +savePayoutRequest(request) Promise~void~
    }
    class PaystackPayoutRail {
        +secretKey string
        +send(tutorId, amount) Promise~ExternalRef~
    }
    class releasePayout {
        <<use-case factory makeReleasePayout>>
        +(input ReleasePayoutInput) Promise~void~
        +publishes PayoutRequested
        +publishes PayoutCompleted
    }
    PrismaWalletRepository ..|> WalletRepository
    PaystackPayoutRail ..|> PayoutRailPort
    releasePayout --> WalletRepository
    releasePayout --> PayoutRailPort
    WalletTransaction --> TransactionKind
    PayoutRequest --> PayoutRail
```

`libs/payments`. Domain error: `InsufficientBalanceError`. `releasePayout` publishes
`PayoutRequested` before calling the rail and `PayoutCompleted` after; tested in
`release-payout.use-case.spec.ts`. `PrismaWalletRepository.credit` is a
`$transaction` (wallet increment + ledger row).

---

## 8. mojo-plus

```mermaid
classDiagram
    class MojoPlusSubscription {
        <<domain type>>
        +tutorId string
        +status 'active' | 'cancelled'
        +customSegmentRateMinor number | null
        +subscribedAt string
        +cancelledAt string | null
    }
    class MojoPlusRepository {
        <<interface port>>
        +find(tutorId) Promise~MojoPlusSubscription|null~
        +save(subscription) Promise~void~
    }
    class subscribeMojoPlus {
        <<use-case factory makeSubscribeMojoPlus>>
        +(tutorId, nowIso) Promise~void~
        +publishes MojoPlusSubscribed
    }
    class cancelMojoPlus {
        <<use-case factory makeCancelMojoPlus>>
        +(tutorId, nowIso) Promise~void~
        +publishes MojoPlusCancelled
    }
    class setCustomRate {
        <<use-case factory makeSetCustomRate>>
        +(tutorId, rateMinor) Promise~void~
    }
    subscribeMojoPlus --> MojoPlusRepository
    cancelMojoPlus --> MojoPlusRepository
    setCustomRate --> MojoPlusRepository
```

`libs/mojo-plus`. Domain error: `MojoPlusRequiredError` (custom pricing requires an
active subscription). All three use-cases are test-covered
(`subscribe-mojo-plus.use-case.spec.ts`). **No infrastructure layer** exists for this
module — persistence is an interface only.

---

## 9. lab

```mermaid
classDiagram
    class LabAccess {
        <<domain type>>
        +roomName string
        +serverUrl string
        +participantToken string
        +expiresAt string
    }
    class LabProvider {
        <<interface port>>
        +createAccess(input) Promise~LabAccess~
    }
    class LiveKitLabProvider {
        -apiKey string
        -apiSecret string
        -serverUrl string
        +createAccess(input) Promise~LabAccess~
    }
    class LabRoom {
        <<React client component>>
        +access LabAccess
        +onDisconnected (optional)
    }
    LiveKitLabProvider ..|> LabProvider
    LiveKitLabProvider ..> AccessToken : livekit-server-sdk
    LabRoom ..> LabAccess : consumes
    LabRoom ..> LiveKitRoom : uses (livekit components)
```

`libs/lab`. Room name derives deterministically from the session id
(`mojo-session-<sessionId>`); token TTL is 3h. Tested in
`livekit-lab.adapter.spec.ts`. `apps/hub/app/(tutor)/lab/[sessionId]/page.tsx`
constructs `LiveKitLabProvider` from env and renders `LabRoom`.

---

## 10. shared/ui and shared/util

```mermaid
classDiagram
    class Button {
        <<React.forwardRef>>
        -variant VariantProps
        -size VariantProps
        -asChild boolean = false
    }
    class Badge {
        <<function component>>
        -variant VariantProps
    }
    class Card {
        <<React.forwardRef>>
    }
    class CardHeader
    class CardTitle
    class CardContent
    class CardFooter
    class Input {
        <<React.forwardRef>>
        -type string
    }
    class Alert {
        <<function component>>
        -variant info | warning | danger
    }
    class cn {
        <<shared/util>>
        +(...inputs ClassValue[]) string
    }
    class segmentsBetween {
        <<shared/util>>
        +(startIso, endIso, segmentMinutes=15) number
    }
    class toUtcIso {
        <<shared/util>>
        +(localDate, timeZone) string
    }
    class formatInTimeZone {
        <<shared/util>>
        +(isoUtc, timeZone, pattern) string
    }
    Button ..> cn : uses
    Badge ..> cn : uses
    Card ..> cn : uses
    Input ..> cn : uses
    Alert ..> cn : uses
```

`libs/shared/ui` (`button.tsx`, `badge.tsx`, `card.tsx`, `input.tsx`, `alert.tsx`,
`index.ts`) exports these five design-system primitives; `libs/shared/util`
(`cn.ts`, `date.ts`) provides `cn` (clsx + tailwind-merge), timezone helpers, and
`segmentsBetween`.

---

## 11. Scaffold-depth modules (domain types + one thin use-case each)

```mermaid
classDiagram
    namespace tutor-profile {
        class TutorApplication {
            <<scaffold>>
            +id string
            +tutorId string
            +subjects string[]
            +bio string
            +introVideoUrl string
            +certifications string[]
            +status ApplicationStatus
            +submittedAt string
        }
        class TutorProfile {
            <<scaffold>>
            +tutorId string
            +displayName string
            +photoUrl string
            +subjects string[]
            +bio string
            +moderationFlagged boolean
        }
        class ApplicationStatus {
            <<scaffold enum>>
            +pending
            +in_review
            +approved
            +rejected
        }
        class submitApplication {
            <<scaffold use-case>>
            +(app TutorApplication) void
        }
        submitApplication --> TutorApplication
        TutorApplication --> ApplicationStatus
    }
    namespace tutor-performance {
        class TutorPerformance {
            <<scaffold>>
            +tutorId string
            +level TutorLevel
            +cumulativeHoursTaught number
            +responseTimeMinutesAvg number
            +trialToPaidConversionRate number
            +cancellationRate number
            +averageRating number
        }
        class computeLevel {
            <<scaffold pure>>
            +(perf TutorPerformance) TutorLevel
        }
        class recomputeLevel {
            <<scaffold use-case>>
            +(perf TutorPerformance, nowIso string) void
            +publishes TutorLevelChanged
        }
        computeLevel --> TutorPerformance
        recomputeLevel --> TutorPerformance
    }
    namespace discovery {
        class TutorSearchFilters {
            <<scaffold>>
            +subject string
            +level TutorLevel
            +language string
            +minRating number
            +availableWithinHours number
        }
        class TutorSearchResult {
            <<scaffold>>
            +tutorId string
            +displayName string
            +level TutorLevel
            +perSegmentMinor number
            +rating number
            +responseTimeMinutesAvg number
        }
        class searchTutors {
            <<scaffold use-case>>
            +(filters TutorSearchFilters) TutorSearchResult[]
        }
        searchTutors --> TutorSearchFilters
    }
    namespace billing {
        class PaymentMethod {
            <<scaffold>>
            +id string
            +studentId string
            +rail string
            +last4 string
            +isDefault boolean
        }
        class LessonSubscription {
            <<scaffold>>
            +id string
            +studentId string
            +tutorId string
            +lessonsPerCycle number
            +cycleLengthDays number
            +autoRenew boolean
            +status string
        }
        class pauseSubscription {
            <<scaffold use-case>>
            +(sub LessonSubscription) void
        }
        pauseSubscription --> LessonSubscription
    }
    namespace messaging {
        class Message {
            <<scaffold>>
            +id string
            +senderId string
            +recipientId string
            +body string
            +sentAt string
            +readAt string
        }
        class sendMessage {
            <<scaffold use-case>>
            +(message Message) void
        }
        sendMessage --> Message
    }
    namespace reviews {
        class Review {
            <<scaffold>>
            +id string
            +sessionId string
            +tutorId string
            +studentId string
            +rating number
            +body string
            +flagged boolean
            +createdAt string
        }
        class submitReview {
            <<scaffold use-case>>
            +(review Review) void
            +publishes ReviewSubmitted
        }
        submitReview --> Review
    }
    namespace referrals {
        class ReferralLink {
            <<scaffold>>
            +code string
            +ownerId string
            +ownerRole string
        }
        class ReferralConversion {
            <<scaffold>>
            +code string
            +newUserId string
            +convertedAt string
            +rewardAppliedAt string
        }
        class trackReferralConversion {
            <<scaffold use-case>>
            +(conversion ReferralConversion) void
        }
        trackReferralConversion --> ReferralConversion
    }
    namespace trust-safety {
        class Dispute {
            <<scaffold>>
            +id string
            +sessionId string
            +filedBy string
            +reason string
            +status DisputeStatus
            +filedAt string
            +resolvedAt string
        }
        class Suspension {
            <<scaffold>>
            +userId string
            +reason string
            +suspendedAt string
            +liftedAt string
        }
        class fileDispute {
            <<scaffold use-case>>
            +(dispute Dispute) void
            +publishes DisputeFiled
        }
        fileDispute --> Dispute
    }
    namespace ai-learning {
        class LessonRecap {
            <<scaffold>>
            +sessionId string
            +summary string
            +focusAreas string[]
            +generatedAt string
            +reviewedByTutor boolean
        }
        class PracticeItem {
            <<scaffold>>
            +id string
            +sessionId string
            +studentId string
            +kind string
            +prompt string
            +completedAt string
        }
        class generateRecap {
            <<scaffold use-case>>
            +(sessionId string, transcript string, nowIso string) LessonRecap
        }
        generateRecap --> LessonRecap
    }
    namespace notifications {
        class NotificationDispatcher {
            <<scaffold interface>>
            +send(channel, to, templateId, data) void
        }
        class EmailDispatcher {
            <<scaffold adapter Resend>>
            +send(channel, to, templateId, data) void
        }
        class WhatsAppDispatcher {
            <<scaffold adapter WhatsApp>>
            +send(channel, to, templateId, data) void
        }
        EmailDispatcher ..|> NotificationDispatcher
        WhatsAppDispatcher ..|> NotificationDispatcher
    }
    namespace admin-config {
        class FeatureFlag {
            <<scaffold>>
            +key string
            +enabled boolean
            +rolloutPercent number
        }
        class AuditLogEntry {
            <<scaffold>>
            +id string
            +adminId string
            +action string
            +targetId string
            +at string
        }
        class SubjectTaxonomyEntry {
            <<scaffold>>
            +id string
            +name string
            +parentId string
        }
    }
    namespace analytics {
        class PlatformMetrics {
            <<scaffold>>
            +gmvMinor number
            +activeTutors number
            +activeStudents number
            +trialToPaidConversionRate number
            +asOf string
        }
        class TutorLeaderboardEntry {
            <<scaffold>>
            +tutorId string
            +displayName string
            +responseTimeMinutesAvg number
            +cancellationRate number
            +rank number
        }
    }
```

Scaffold detail (from source, all `<<scaffold>>`):

- **tutor-profile** — `submit-application.use-case.ts` saves a `TutorApplication`.
  TODO comment: publish `TutorApplicationSubmitted` once the events catalog has it.
- **tutor-performance** — `computeLevel` (pure: gate on hours + rating floor) and
  `recomputeLevel` publishes `TutorLevelChanged`; never written to directly (built
  from events per the modular-monolith doc). `LEVEL_THRESHOLDS =
  { established: {hours:50, minRating:4.5}, expert: {hours:200, minRating:4.7} }`.
- **discovery** — `searchTutors` delegates to a `TutorSearchIndex` port.
- **billing** — `makePauseSubscription` toggles a `LessonSubscription` to `paused`.
- **messaging** — `makeSendMessage` saves a `Message` through a `MessageRepository`.
- **reviews** — `submitReview` saves + publishes `ReviewSubmitted`.
- **referrals** — `trackReferralConversion` saves only; TODO to publish
  `ReferralConverted` (not in catalog).
- **trust-safety** — `fileDispute` saves + publishes `DisputeFiled`.
- **ai-learning** — `generateRecap` (fires on `SessionCompleted` at composition root)
  depends on a `TranscriptSummarizer` port.
- **notifications** — domain `NotificationDispatcher` interface + two infra adapters
  (`EmailDispatcher`, `WhatsAppDispatcher`); **no application layer**.
- **admin-config** — domain types only (`FeatureFlag`, `AuditLogEntry`,
  `SubjectTaxonomyEntry`).
- **analytics** — domain types only (`PlatformMetrics`, `TutorLeaderboardEntry`).
