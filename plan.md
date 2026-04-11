# Syllabus Library LMS Plan

## Objective
Build a Next.js + MongoDB library system for a fixed syllabus of 80 books where members borrow physical copies, there are multiple physical copies against each 80 book, members return them, and complete books through an approval-based flow. The system should be simple, user-friendly, and highly operational for daily management.

## Confirmed Product Decisions
- Authentication: Email + Password
- User will be created on dashboard by Super Admin or Moderator; no self-registration
- Completion rule: A book is marked completed only after return is approved by Moderator or Super Admin
- Borrow cap for MVP: No fixed active borrow limit initially
- Notifications for MVP: Email + in-app
- QR flow for MVP: Scanning QR opens a prefilled borrow or return page, dynamically determined by copy status; manual copy ID entry fallback available

## Roles and Permissions
- Super Admin
  - Full access to all modules
  - Can create and manage moderators
  - Can change system-wide settings and policies
  - Can create members and manage all user accounts
- Moderator
  - Can manage borrow and return operations
  - Can approve returns and update operational records
  - Cannot add or promote moderators
  - Can create members and manage member accounts
- Member
  - Can view own profile, progress, active borrows, and history
  - Can submit borrow and return requests

## Core Data Model
- User
  - Profile, role, account status, createdBy, lastLoginAt
- Book
  - One syllabus title entry
- BookCopy
  - Physical copy record with unique copy ID and QR info, availability status, and condition
- BorrowTransaction
  - Borrow lifecycle, due date, return date, and status
- ReturnApproval
  - Approval state, approver, notes, timestamp
- CompletionRecord
  - One completed record per member per syllabus book
- AuditLog
  - Immutable logs for key actions

## Phase Plan

### Phase 1: Project Setup and Security Foundation
1. Initialize Next.js App Router project and environment configuration.
2. Configure MongoDB connection and shared database utilities.
3. Implement Email + Password authentication.
4. Add session handling and route-level authorization.
5. Seed one Super Admin account and disable self-registration endpoints.

Deliverable:
- Secure app shell with role-protected routes and dashboard-only user onboarding.

### Phase 2: Domain Models and APIs
1. Implement schemas/models for User, Book, BookCopy, BorrowTransaction, ReturnApproval, CompletionRecord, AuditLog.
2. Add validation and API contracts for create/update/list operations.
3. Enforce lifecycle invariants:
   - No double active borrow for the same copy
   - Atomic copy status transitions
   - Completion only after approved return
4. Enforce account management constraints:
  - No public signup flow
  - Only Super Admin and Moderator can create members
  - Only Super Admin can create or manage moderators

Deliverable:
- Stable data layer and protected API surface.

### Phase 3: Book and Copy Management
1. Build admin and moderator interfaces for syllabus books and physical copies.
2. Add unique copy ID generation and QR data mapping.
3. Add availability status and copy condition fields.
4. Implement QR resolver logic so a scanned copy opens borrow or return action based on current copy status.

Deliverable:
- Full inventory control for fixed 80 books and all multiple physical copies against each 80 books.

### Phase 4: Borrow and Return Operations
1. Build QR prefilled flow with manual copy ID fallback and dynamic action routing.
2. Capture borrow details including due date and operator metadata.
3. Build return intake flow with condition capture.
4. Add moderator or admin approval action for completion eligibility.
5. On approval, create completion record for the member and syllabus book.

Deliverable:
- End-to-end operational borrowing and return process.

### Phase 5: Member Profile and Progress
1. Build member profile dashboard showing:
   - Total syllabus books (80)
   - Completed count
   - Remaining count
   - Active borrowed books
   - Borrow and completion history
2. Add member timeline and status badges (active, overdue, completed).

Deliverable:
- Clear and motivating progress visibility for each member.

### Phase 6: Management Dashboard and Reports
1. Build admin and moderator dashboard modules:
   - User management
   - Book management
   - Register and transaction view
   - Overdue tracking
   - Member-wise progress view
2. Apply role boundaries in UI and backend actions:
  - Super Admin: full user management including moderators
  - Moderator: member management and operations, no moderator management
3. Add filters and search by member, book, copy ID, and status.
4. Add key reports for borrow history and progress.

Deliverable:
- Practical operational console for multi-person management.

### Phase 7: Notifications and Automation
1. Add in-app + email reminders:
   - Upcoming due date
   - Overdue alerts
   - Return approval outcome
2. Add background scheduling for reminder dispatch.
3. Prevent duplicate notification sends.

Deliverable:
- Reduced manual follow-up and better member compliance.

### Phase 8: Quality, Security, and Release
1. Add integration and end-to-end tests for critical journeys.
2. Add RBAC security tests and role escalation prevention tests.
3. Add logging, error monitoring, and backup strategy.
4. Prepare deployment configuration and release checklist.

Deliverable:
- Production-ready MVP.

## Key Workflow Rules
- Borrow:
  - Member selects book and copy via QR or manual ID.
  - QR scan resolves current copy status and routes to borrow screen only if copy is available.
  - System validates copy availability and creates borrow transaction.
  - Copy state moves to borrowed.
- Return:
  - QR scan resolves current copy status and routes to return screen only if copy is borrowed.
  - Return is registered with condition details.
  - Approval is required by Moderator or Super Admin.
  - Completion record is created only after approval.
  - Copy state moves to available if accepted.
- User onboarding:
  - No self-registration is allowed.
  - Super Admin and Moderator create member accounts from dashboard.
  - Only Super Admin can create or manage moderator accounts.

## API and Route Structure (Suggested)
- App routes:
  - /login
  - /dashboard/admin
  - /dashboard/moderator
  - /dashboard/member
  - /dashboard/users
  - /scan/[copyId]
- API routes:
  - /api/auth/*
  - /api/books/*
  - /api/copies/*
  - /api/borrow/*
  - /api/returns/*
  - /api/users/*
  - /api/progress/*

Notes:
- Do not provide public /register routes.
- Keep role checks server-side for every mutation endpoint.

## Verification Checklist
1. Super Admin can create moderators; moderator cannot create moderators.
2. No self-registration path exists; only dashboard-based member creation works.
3. Moderator can create and manage members but cannot create or promote moderators.
4. QR scan opens correct prefilled borrow or return screen based on copy status.
5. Same copy cannot be actively borrowed twice.
6. Completion is not created on borrow and not created on unapproved return.
7. Completion appears after approved return.
8. Member progress values remain consistent across profile and dashboard reports.
9. Due and overdue notifications are sent once per schedule window.
10. Audit logs capture critical actions with actor and timestamp.

## Future Enhancements
- Borrow caps by role or member type
- Fine and payment module
- Lost or damaged replacement workflow
- Bulk import and export utilities
- Advanced analytics and trend reports
- Optional invite-based account activation flow while keeping no public self-registration
