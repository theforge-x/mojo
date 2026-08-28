# Mojo — 02. Class Diagrams

The object/type structure of each implemented module. Because Mojo is TypeScript
with **ports** (interfaces) and **use-case factory functions** rather than
traditional inheritance, the diagrams below mix:

- **`<<interface>>` ports** — defined in a module's `domain/`, implemented by `infrastructure/`
- **`<<class>>` infrastructure adapters** — the only place Prisma/SDK imports live
- **`<<function>>` use-case factories** (`make*`) — the `application/` layer
- **pure functions** and **value objects** from `domain/`

Mermaid `classDiagram` has no native "function returns a function API" concept, so
factories are drawn as classes exposing their returned use-case method; the
`make*` factory is named on the class via a note where relevant.

Every module is full-depth: `domain` ports/types, `application` use-cases,
`infrastructure` adapters, and Vitest specs. See `docs/uml/README.md` for the depth
legend.

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
    class TutorLevel {
        <<enum>>
        entry
        established
        expert
    }
    money --> Money : creates
    addMoney ..> Money : uses
    subtractMoney ..> Money : uses
    percentOf ..> Money : uses
    overlaps ..> TimeRange : uses
    durationMinutes ..> TimeRange : uses
```

`libs/shared/domain/src/money.ts`, `time-range.ts`, `tutor-level.ts`. `Money` is an
integer count in the smallest unit (kobo/cents); `addMoney`, `subtractMoney`,
`percentOf`, `formatMoney` are the arithmetic helpers. `TutorLevel` is the
cross-cutting tier type shared by pricing, discovery, and tutor-performance — domains
depend on it via this lib instead of on each other.

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
        MojoPlusCancelled | PayoutRequested | PayoutCompleted | TutorApplicationSubmitted
        ReviewSubmitted | ReferralConverted | DisputeFiled | DisputeResolved
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
15-event union is listed in [04-behavioral](04-behavioral.md#11-event-catalog-as-defined-in-code).

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
    class BookingSession {
        <<domain contract>>
        +readonly own to scheduling: id, tutorId, studentId, startIso, endIso, isTrial
    }
    class BookingRepository {
        <<interface port>>
        +findById(sessionId) Promise~BookingSession|null~
        +markCompleted(sessionId, at) Promise~void~
        +markNoShow(sessionId, by, at) Promise~void~
        +saveConfirmation(confirmation) Promise~void~
    }
    class PrismaBookingRepository {
        +prisma PrismaClient
        +findById(sessionId) Promise~BookingSession|null~
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
    BookingRepository ..> BookingSession : own contract (DIP, not scheduling's type)
    PrismaBookingRepository ..|> BookingRepository
    confirmDelivery --> BookingRepository
    confirmDelivery ..> segmentsBetween : from shared/util
```

`libs/booking`. `AUTO_CONFIRM_WINDOW_HOURS = 48` is the constant referenced by the
roadmap's payout logic (`session-lifecycle.types.ts`). The `BookingRepository` port
returns booking's **own** `BookingSession` contract (`booking-session.types.ts`) —
dependency inversion: booking never imports scheduling's `ScheduledSession`; the
Prisma adapter projects the shared `Session` row into booking's shape.
`confirmDelivery` derives `segmentCount` via `segmentsBetween` (ceil-to-15-min) and
publishes both `SessionCompleted` and `SessionDeliveryConfirmed`. Domain error:
`SessionNotBookedError`. Tested in `confirm-delivery.use-case.spec.ts`.

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
{ entry:400000, established:600000, expert:800000 }` (kobo). `TutorLevel` and `Money`
are defined in `@mojo/shared/domain` (pricing imports and re-exports them) so
`discovery`/`tutor-performance` share them without importing pricing. This is the
pure, I/O-free Phase 2 monetization model called out in `mojo-roadmap.md`; fully
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

## 11. Previously-scaffold modules — now full-depth

The twelve modules that were scaffold-depth are now full-depth: each has a `domain`
ports file + types, an `application/` use-case layer, `infrastructure/` Prisma
adapters, and Vitest specs. Per `eslint.config.mjs`, the only cross-module
dependency allowed in code is `discovery → @mojo/pricing/domain` (the rate
contract); every module otherwise depends only on the shared libs (`@mojo/shared/*`)
and communicates cross-module via the event bus — `booking` and `tutor-performance`
formerly coupled to `scheduling`/`pricing` were decoupled via dependency inversion
(`BookingSession` contract, `TutorLevel` promoted to `shared/domain`).

### 11.1 tutor-profile

```mermaid
classDiagram
    class TutorApplication {
        <<domain type>>
        +id string
        +tutorId string
        +subjects readonly string[]
        +bio string
        +introVideoUrl string
        +certifications readonly string[]
        +status ApplicationStatus
        +submittedAt string
    }
    class TutorProfile {
        <<domain type>>
        +tutorId string
        +displayName string
        +photoUrl string | null
        +subjects readonly string[]
        +bio string
        +moderationFlagged boolean
    }
    class ApplicationStatus {
        <<enum>>
        pending
        in_review
        approved
        rejected
    }
    class ApplicationRepository {
        <<interface port>>
        +findById(applicationId) Promise~TutorApplication|null~
        +save(application) Promise~void~
    }
    class TutorProfileRepository {
        <<interface port>>
        +findByTutorId(tutorId) Promise~TutorProfile|null~
        +save(profile) Promise~void~
    }
    class PrismaApplicationRepository {
        +prisma PrismaClient
        +findById(applicationId) Promise~TutorApplication|null~
        +save(application) Promise~void~
    }
    class PrismaTutorProfileRepository {
        +prisma PrismaClient
        +findByTutorId(tutorId) Promise~TutorProfile|null~
        +save(profile) Promise~void~
    }
    class submitApplication {
        <<use-case factory makeSubmitApplication>>
        +(app TutorApplication, nowIso string) Promise~void~
        +publishes TutorApplicationSubmitted
        +throws ApplicationSubmittedError
    }
    PrismaApplicationRepository ..|> ApplicationRepository
    PrismaTutorProfileRepository ..|> TutorProfileRepository
    submitApplication --> ApplicationRepository
    TutorApplication --> ApplicationStatus
```

`libs/tutor-profile`. `submitApplication` rejects duplicates with
`ApplicationSubmittedError` then publishes `TutorApplicationSubmitted`
(`{ applicationId, tutorId }`); tested in `submit-application.use-case.spec.ts`.

### 11.2 tutor-performance

```mermaid
classDiagram
    class TutorPerformance {
        <<domain type>>
        +tutorId string
        +level TutorLevel
        +cumulativeHoursTaught number
        +responseTimeMinutesAvg number
        +trialToPaidConversionRate number
        +cancellationRate number
        +averageRating number
    }
    class computeLevel {
        <<pure function>>
        +(perf TutorPerformance) TutorLevel
    }
    class TutorPerformanceRepository {
        <<interface port>>
        +findByTutorId(tutorId) Promise~TutorPerformance|null~
        +save(perf) Promise~void~
    }
    class PrismaTutorPerformanceRepository {
        +prisma PrismaClient
        +findByTutorId(tutorId) Promise~TutorPerformance|null~
        +save(perf) Promise~void~
    }
    class recomputeLevel {
        <<use-case factory makeRecomputeLevel>>
        +(perf TutorPerformance, nowIso string) Promise~void~
        +publishes TutorLevelChanged
    }
    PrismaTutorPerformanceRepository ..|> TutorPerformanceRepository
    recomputeLevel --> TutorPerformanceRepository
    computeLevel --> TutorPerformance
```

`libs/tutor-performance`. `computeLevel` is a pure function gated on
`LEVEL_THRESHOLDS` (established 50h/4.5, expert 200h/4.7); `recomputeLevel` persists
and publishes `TutorLevelChanged` only when the level changes. The `TutorLevel` value
object comes from `@mojo/shared/domain` — tutor-performance has no dependency on
pricing (layering: domain imports only shared).

### 11.3 discovery

```mermaid
classDiagram
    class TutorSearchFilters {
        <<domain type>>
        +subject string?
        +level TutorLevel?
        +language string?
        +minRating number?
        +availableWithinHours number?
    }
    class TutorSearchResult {
        <<domain type>>
        +tutorId string
        +displayName string
        +level TutorLevel
        +perSegmentMinor number
        +rating number
        +responseTimeMinutesAvg number
    }
    class TutorSearchIndex {
        <<interface port>>
        +search(filters TutorSearchFilters) Promise~TutorSearchResult[]~
    }
    class PrismaTutorSearchIndex {
        +prisma PrismaClient
        +search(filters TutorSearchFilters) Promise~TutorSearchResult[]~
    }
    class searchTutors {
        <<use-case factory makeSearchTutors>>
        +(filters TutorSearchFilters) Promise~TutorSearchResult[]~
    }
    PrismaTutorSearchIndex ..|> TutorSearchIndex
    searchTutors --> TutorSearchIndex
```

`libs/discovery`. `searchTutors` delegates to the `TutorSearchIndex` port; the
`PrismaTutorSearchIndex` joins `TutorProfile` + `TutorPerformance` in JS by `tutorId`
and applies subject/level/minRating (note: `language` and `availableWithinHours`
have no persisted column, so are not applied — documented in code). `TutorLevel`
comes from `@mojo/shared/domain`; only `DEFAULT_SEGMENT_RATE_NGN` still comes from
`@mojo/pricing/domain` — the rate contract discovery's infrastructure reads at
query time (boundary: discovery/infrastructure → pricing/domain, the sole
cross-module dependency in the tree).

### 11.4 billing

```mermaid
classDiagram
    class PaymentMethod {
        <<domain type>>
        +id string
        +studentId string
        +rail paystack | flutterwave | stripe
        +last4 string | null
        +isDefault boolean
    }
    class LessonSubscription {
        <<domain type>>
        +id string
        +studentId string
        +tutorId string
        +lessonsPerCycle number
        +cycleLengthDays number
        +autoRenew boolean
        +status active | paused | cancelled
    }
    class SubscriptionRepository {
        <<interface port>>
        +findById(id) Promise~LessonSubscription|null~
        +findByStudent(studentId) Promise~LessonSubscription[]~
        +save(subscription) Promise~void~
    }
    class PrismaSubscriptionRepository {
        +prisma PrismaClient
        +findById(id) Promise~LessonSubscription|null~
        +findByStudent(studentId) Promise~LessonSubscription[]~
        +save(subscription) Promise~void~
    }
    class pauseSubscription {
        <<use-case factory makePauseSubscription>>
        +(sub LessonSubscription) Promise~void~
    }
    PrismaSubscriptionRepository ..|> SubscriptionRepository
    pauseSubscription --> SubscriptionRepository
```

`libs/billing`. `pauseSubscription` saves a `LessonSubscription` with status `paused`;
tested in `manage-subscription.use-case.spec.ts`.

### 11.5 messaging

```mermaid
classDiagram
    class Message {
        <<domain type>>
        +id string
        +senderId string
        +recipientId string
        +body string
        +sentAt string
        +readAt string | null
    }
    class MessageRepository {
        <<interface port>>
        +findById(id) Promise~Message|null~
        +save(message) Promise~void~
    }
    class PrismaMessageRepository {
        +prisma PrismaClient
        +findById(id) Promise~Message|null~
        +save(message) Promise~void~
    }
    class sendMessage {
        <<use-case factory makeSendMessage>>
        +(message Message) Promise~void~
    }
    PrismaMessageRepository ..|> MessageRepository
    sendMessage --> MessageRepository
```

`libs/messaging`. `sendMessage` persists a `Message`; tested in
`send-message.use-case.spec.ts`.

### 11.6 reviews

```mermaid
classDiagram
    class Review {
        <<domain type>>
        +id string
        +sessionId string
        +tutorId string
        +studentId string
        +rating number
        +body string
        +flagged boolean
        +createdAt string
    }
    class ReviewRepository {
        <<interface port>>
        +findById(id) Promise~Review|null~
        +findBySession(sessionId) Promise~Review|null~
        +save(review) Promise~void~
    }
    class PrismaReviewRepository {
        +prisma PrismaClient
        +findById(id) Promise~Review|null~
        +findBySession(sessionId) Promise~Review|null~
        +save(review) Promise~void~
    }
    class submitReview {
        <<use-case factory makeSubmitReview>>
        +(review Review) Promise~void~
        +publishes ReviewSubmitted
    }
    PrismaReviewRepository ..|> ReviewRepository
    submitReview --> ReviewRepository
```

`libs/reviews`. `submitReview` persists and publishes `ReviewSubmitted`
(`{ sessionId, tutorId, rating }`); tested in `submit-review.use-case.spec.ts`.

### 11.7 referrals

```mermaid
classDiagram
    class ReferralLink {
        <<domain type>>
        +code string
        +ownerId string
        +ownerRole student | tutor
    }
    class ReferralConversion {
        <<domain type>>
        +code string
        +newUserId string
        +convertedAt string
        +rewardAppliedAt string | null
    }
    class ReferralRepository {
        <<interface port>>
        +findLink(code) Promise~ReferralLink|null~
        +saveLink(link) Promise~void~
        +findConversion(code, newUserId) Promise~ReferralConversion|null~
        +saveConversion(conversion) Promise~void~
    }
    class PrismaReferralRepository {
        +prisma PrismaClient
        +findLink(code) Promise~ReferralLink|null~
        +saveLink(link) Promise~void~
        +findConversion(code, newUserId) Promise~ReferralConversion|null~
        +saveConversion(conversion) Promise~void~
    }
    class trackReferralConversion {
        <<use-case factory makeTrackReferralConversion>>
        +(conversion ReferralConversion) Promise~void~
        +publishes ReferralConverted
        +throws ReferralAlreadyTrackedError
    }
    PrismaReferralRepository ..|> ReferralRepository
    trackReferralConversion --> ReferralRepository
```

`libs/referrals`. `trackReferralConversion` rejects duplicates with
`ReferralAlreadyTrackedError` then publishes `ReferralConverted`
(`{ code, newUserId }`); tested in `track-referral.use-case.spec.ts`.

### 11.8 trust-safety

```mermaid
classDiagram
    class Dispute {
        <<domain type>>
        +id string
        +sessionId string
        +filedBy string
        +reason string
        +status DisputeStatus
        +filedAt string
        +resolvedAt string | null
    }
    class Suspension {
        <<domain type>>
        +userId string
        +reason string
        +suspendedAt string
        +liftedAt string | null
    }
    class DisputeStatus {
        <<enum>>
        open
        upheld
        dismissed
    }
    class DisputeRepository {
        <<interface port>>
        +findById(id) Promise~Dispute|null~
        +findBySession(sessionId) Promise~Dispute|null~
        +save(dispute) Promise~void~
    }
    class PrismaDisputeRepository {
        +prisma PrismaClient
        +findById(id) Promise~Dispute|null~
        +findBySession(sessionId) Promise~Dispute|null~
        +save(dispute) Promise~void~
    }
    class fileDispute {
        <<use-case factory makeFileDispute>>
        +(dispute Dispute) Promise~void~
        +publishes DisputeFiled
    }
    PrismaDisputeRepository ..|> DisputeRepository
    fileDispute --> DisputeRepository
    Dispute --> DisputeStatus
```

`libs/trust-safety`. `fileDispute` persists a `Dispute` and publishes `DisputeFiled`
(`{ sessionId, filedBy, reason }`); tested in `file-dispute.use-case.spec.ts`.

### 11.9 ai-learning

```mermaid
classDiagram
    class LessonRecap {
        <<domain type>>
        +sessionId string
        +summary string
        +focusAreas readonly string[]
        +generatedAt string
        +reviewedByTutor boolean
    }
    class PracticeItem {
        <<domain type>>
        +id string
        +sessionId string
        +studentId string
        +kind daily_exercise | scenario_drill
        +prompt string
        +completedAt string | null
    }
    class TranscriptSummarizer {
        <<interface port outbound>>
        +summarize(transcript string) Promise~{summary string; focusAreas string[]}~
    }
    class RecapRepository {
        <<interface port>>
        +findBySession(sessionId) Promise~LessonRecap|null~
        +save(recap) Promise~void~
    }
    class PrismaRecapRepository {
        +prisma PrismaClient
        +findBySession(sessionId) Promise~LessonRecap|null~
        +save(recap) Promise~void~
    }
    class generateRecap {
        <<use-case factory makeGenerateRecap>>
        +(sessionId string, transcript string, nowIso string) Promise~LessonRecap~
        +throws DuplicateRecapError
    }
    PrismaRecapRepository ..|> RecapRepository
    generateRecap --> RecapRepository
    generateRecap --> TranscriptSummarizer
```

`libs/ai-learning`. `generateRecap` is triggered externally on `SessionCompleted` at
the composition root; it calls the `TranscriptSummarizer`, rejects a second recap for
the same session with `DuplicateRecapError`, then persists via `RecapRepository`;
tested in `generate-recap.use-case.spec.ts`.

### 11.10 notifications

```mermaid
classDiagram
    class NotificationDispatcher {
        <<interface port>>
        +send(channel NotificationChannel, to string, templateId string, data Record) Promise~void~
    }
    class EmailDispatcher {
        +apiKey string
        +send(channel, to, templateId, data) Promise~void~
    }
    class WhatsAppDispatcher {
        +phoneNumberId string
        +accessToken string
        +send(channel, to, templateId, data) Promise~void~
    }
    class Notification {
        <<application type>>
        +channel NotificationChannel
        +to string
        +templateId string
        +data Record
    }
    class dispatchNotification {
        <<use-case factory makeDispatchNotification>>
        +(notification Notification) Promise~void~
        +throws UnsupportedChannelError
    }
    EmailDispatcher ..|> NotificationDispatcher
    WhatsAppDispatcher ..|> NotificationDispatcher
    dispatchNotification --> NotificationDispatcher
```

`libs/notifications`. A five-layer addition brought in the missing `application/`
layer: `makeDispatchNotification({ dispatchers })` routes a `Notification` to the
adapter registered for its channel (email/whatsapp), throwing
`UnsupportedChannelError` when none matches. `EmailDispatcher` → Resend, `WhatsAppDispatcher`
→ WhatsApp Business Cloud API; tested in `dispatch-notification.use-case.spec.ts`.

### 11.11 admin-config

```mermaid
classDiagram
    class FeatureFlag {
        <<domain type>>
        +key string
        +enabled boolean
        +rolloutPercent number
    }
    class AuditLogEntry {
        <<domain type>>
        +id string
        +adminId string
        +action string
        +targetId string | null
        +at string
    }
    class SubjectTaxonomyEntry {
        <<domain type>>
        +id string
        +name string
        +parentId string | null
    }
    class FeatureFlagRepository {
        <<interface port>>
        +findByKey(key) Promise~FeatureFlag|null~
        +list() Promise~FeatureFlag[]~
        +save(flag) Promise~void~
    }
    class AuditLogRepository {
        <<interface port>>
        +append(entry) Promise~void~
    }
    class SubjectTaxonomyRepository {
        <<interface port>>
        +list() Promise~SubjectTaxonomyEntry[]~
        +save(entry) Promise~void~
    }
    class PrismaFeatureFlagRepository {
        +findByKey(key) Promise~FeatureFlag|null~
        +list() Promise~FeatureFlag[]~
        +save(flag) Promise~void~
    }
    class PrismaAuditLogRepository {
        +append(entry) Promise~void~
    }
    class PrismaSubjectTaxonomyRepository {
        +list() Promise~SubjectTaxonomyEntry[]~
        +save(entry) Promise~void~
    }
    class setFeatureFlag {
        <<use-case factory makeSetFeatureFlag>>
        +(input FeatureFlag) Promise~void~
        +throws InvalidRolloutPercentError
    }
    class appendAuditLog {
        <<use-case factory makeAppendAuditLog>>
        +(entry AuditLogEntry) Promise~void~
    }
    class listSubjects {
        <<use-case factory makeListSubjects>>
        +() Promise~SubjectTaxonomyEntry[]~
    }
    PrismaFeatureFlagRepository ..|> FeatureFlagRepository
    PrismaAuditLogRepository ..|> AuditLogRepository
    PrismaSubjectTaxonomyRepository ..|> SubjectTaxonomyRepository
    setFeatureFlag --> FeatureFlagRepository
    appendAuditLog --> AuditLogRepository
    listSubjects --> SubjectTaxonomyRepository
```

`libs/admin-config`. Three use-cases: `setFeatureFlag` (rejects
`rolloutPercent` outside 0–100 with `InvalidRolloutPercentError`), `appendAuditLog`,
and `listSubjects`, each backed by a Prisma adapter; tested in
`admin-config.use-cases.spec.ts`.

### 11.12 analytics

```mermaid
classDiagram
    class PlatformMetrics {
        <<domain type>>
        +gmvMinor number
        +activeTutors number
        +activeStudents number
        +trialToPaidConversionRate number
        +asOf string
    }
    class TutorLeaderboardEntry {
        <<domain type>>
        +tutorId string
        +displayName string
        +responseTimeMinutesAvg number
        +cancellationRate number
        +rank number
    }
    class LeaderboardCandidate {
        <<domain type>>
        +tutorId string
        +displayName string
        +responseTimeMinutesAvg number
        +cancellationRate number
    }
    class AnalyticsRepository {
        <<interface port>>
        +countActiveTutors() Promise~number~
        +countActiveStudents() Promise~number~
        +sumWalletCreditsMinor() Promise~number~
        +listLeaderboardCandidates() Promise~LeaderboardCandidate[]~
    }
    class PrismaAnalyticsRepository {
        +countActiveTutors() Promise~number~
        +countActiveStudents() Promise~number~
        +sumWalletCreditsMinor() Promise~number~
        +listLeaderboardCandidates() Promise~LeaderboardCandidate[]~
    }
    class computePlatformMetrics {
        <<use-case factory makeComputePlatformMetrics>>
        +(nowIso string) Promise~PlatformMetrics~
    }
    class buildLeaderboard {
        <<use-case factory makeBuildLeaderboard>>
        +(limit number) Promise~TutorLeaderboardEntry[]~
    }
    PrismaAnalyticsRepository ..|> AnalyticsRepository
    computePlatformMetrics --> AnalyticsRepository
    buildLeaderboard --> AnalyticsRepository
```

`libs/analytics`. `computePlatformMetrics` aggregates GMV (sum of wallet credits),
active tutors/students (User counts by role), and sets `trialToPaidConversionRate: 0`
(a true cohort rate is not yet derived — documented in code); `buildLeaderboard`
sorts candidates by response time then cancellation rate, caps at `limit`, and
assigns ranks; tested in `analytics.use-cases.spec.ts`.
