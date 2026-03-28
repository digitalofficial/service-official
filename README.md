# Service Official
### The Contractor Operating System

Part of the **Official Suite** — alongside Digital Official.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Payments | Stripe |
| SMS | Twilio |
| Email | Resend |
| AI | Anthropic Claude |
| Maps | Google Maps |
| Monorepo | Turborepo + pnpm |

---

## Project Structure

```
service-official/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/
│       │   ├── auth/           # Login, register, forgot password
│       │   ├── dashboard/      # Main dashboard
│       │   ├── projects/       # Project management
│       │   │   └── [id]/
│       │   │       ├── overview/
│       │   │       ├── files/
│       │   │       ├── blueprints/
│       │   │       ├── photos/
│       │   │       ├── timeline/
│       │   │       ├── expenses/
│       │   │       ├── materials/
│       │   │       ├── team/
│       │   │       ├── daily-logs/
│       │   │       ├── punch-list/
│       │   │       ├── rfis/
│       │   │       ├── change-orders/
│       │   │       ├── submittals/
│       │   │       └── safety/
│       │   ├── customers/      # CRM
│       │   ├── leads/          # Lead pipeline
│       │   ├── jobs/           # Service jobs / scheduling
│       │   ├── calendar/       # Dispatch & scheduling
│       │   ├── estimates/      # Estimates & proposals
│       │   ├── invoices/       # Invoicing
│       │   ├── payments/       # Payment tracking
│       │   ├── messages/       # SMS & email inbox
│       │   ├── automation/     # Workflow automation
│       │   ├── reports/        # Analytics & reporting
│       │   ├── takeoffs/       # AI blueprint takeoffs
│       │   ├── blueprints/     # Blueprint library
│       │   └── settings/       # Org settings
│       └── components/
│
├── packages/
│   ├── types/                  # Global TypeScript types
│   ├── database/               # Supabase client + queries
│   │   ├── schema/             # SQL migrations
│   │   └── queries/            # Typed query functions
│   ├── ai/                     # Anthropic AI (takeoffs)
│   ├── notifications/          # SMS, email, push, in-app
│   ├── workflows/              # Automation engine
│   ├── billing/                # Stripe integration
│   ├── documents/              # File management
│   └── utils/                  # Shared utilities
│
└── modules/                    # Feature modules
    ├── core/                   # Auth, roles, orgs
    ├── projects/               # Full project management
    ├── customers/              # CRM
    ├── leads/                  # Lead pipeline
    ├── jobs/                   # Service jobs
    ├── estimates/              # Estimating
    ├── invoices/               # Invoicing
    ├── payments/               # Payments
    ├── blueprints/             # Blueprint management
    ├── takeoffs/               # AI takeoffs
    ├── messages/               # Communications
    ├── automation/             # Workflows
    ├── reporting/              # Analytics
    └── notifications/          # Notifications
```

---

## Supported Industries

- ✅ **Roofing** (launch)
- ✅ **General Contractor** (launch)
- 🔜 Electrical
- 🔜 Plumbing
- 🔜 HVAC
- 🔜 Landscaping
- 🔜 Painting
- 🔜 Flooring
- 🔜 Solar
- 🔜 Concrete / Masonry

---

## Core Modules

### Projects
Full project lifecycle from lead → paid.
- Phases & milestones with timelines
- Team assignment with roles
- File & document management
- Photo galleries (before/after)
- Blueprint storage & viewer
- Daily logs with weather
- Punch list management
- RFIs, Submittals, Change Orders
- Expense tracking
- Materials tracking (ordered → installed)
- Client portal with notifications

### AI Takeoffs
Blueprint → material list in minutes.
- PDF upload & sheet parsing
- AI measurement extraction
- Trade-specific rule engine
- Estimator review & override
- Export to estimate

### Estimates & Invoices
- Template-based estimates
- Digital approval & signature
- Automated invoice conversion
- Progress billing
- Stripe payment links

### Communications
- SMS inbox via Twilio
- Automated job reminders
- Client milestone notifications
- Team notifications

### Automation
Trigger-based workflow engine.
- 20+ trigger events
- Actions: SMS, email, push, status updates
- No-code rule builder

---

## Getting Started

```bash
# Install deps
pnpm install

# Set up environment
cp apps/web/.env.example apps/web/.env.local

# Run migrations
pnpm db:migrate

# Start dev
pnpm dev
```

---

## Subscription Tiers

| Tier | Price | Users | Features |
|---|---|---|---|
| Solo | $29/mo | 1 | CRM, Jobs, Invoices, Booking |
| Team | $79/mo | 5 | + Scheduling, SMS, Automation |
| Growth | $149/mo | 15 | + Reporting, Advanced Workflows |
| Enterprise | Custom | Unlimited | + White-label, API, SLA |

Add-ons:
- AI Takeoffs: $49/mo
- Additional Users: $15/user/mo
- SMS: Usage-based

---

## Roadmap

**v1.0 — MVP**
- [ ] Auth + Orgs
- [ ] CRM (Customers + Leads)
- [ ] Projects (basic)
- [ ] Jobs + Scheduling
- [ ] Estimates + Invoices
- [ ] Stripe Payments
- [ ] SMS via Twilio

**v1.5 — Projects Deep**
- [ ] Full project module (phases, milestones, team)
- [ ] File & photo management
- [ ] Daily logs
- [ ] Punch list

**v2.0 — Intelligence**
- [ ] Blueprint upload
- [ ] AI Takeoffs
- [ ] Automation engine
- [ ] Client portal

**v2.5 — Scale**
- [ ] Advanced reporting
- [ ] Multi-org / franchise mode
- [ ] Mobile app
- [ ] White-label

---

*Service Official — Built for contractors, by people who understand the trade.*
