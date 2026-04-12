# Service Official — Full Feature Test Checklist

Work through each section. Mark [x] when passing, note errors inline.

---

## AUTH
- [ ] Register new account
- [ ] Login with email/password
- [ ] Forgot password flow
- [ ] Accept invite link
- [ ] Logout

---

## DASHBOARD (`/dashboard`)
- [ ] Page loads without error
- [ ] Metrics cards show data
- [ ] Jobs map renders
- [ ] Today's jobs list
- [ ] Upcoming jobs (7 day)
- [ ] Active projects cards
- [ ] Team schedule (owner/admin)
- [ ] Notifications panel
- [ ] Quick action links work

---

## CUSTOMERS (`/customers`)
- [ ] List loads, search works
- [ ] Filter by type (Residential, Commercial, etc.)
- [ ] Pagination works
- [ ] Export button works
- [ ] **Create** — click "New Customer", fill form, submit
- [ ] **Detail** — click a customer, page loads
- [ ] Contact info, address, revenue summary display
- [ ] Jobs/Estimates/Invoices/Projects tabs on detail
- [ ] **Edit** — click Edit, change fields, save
- [ ] **Multi-address** — add/remove addresses (Commercial/HOA types)
- [ ] **Delete** — delete a test customer

---

## PROJECTS (`/projects`)
- [ ] List loads with status tabs
- [ ] Search works
- [ ] Grid/List toggle
- [ ] Export works
- [ ] **Create** — "New Project", fill form, submit

### Project Detail Tabs
- [ ] **Overview** — stats, phases, progress bar
- [ ] **Schedule** — Gantt chart loads
  - [ ] Add Task (modal)
  - [ ] Edit Task
  - [ ] Delete Task
  - [ ] Sync from Phases
  - [ ] Add Dependency (modal)
- [ ] **Budget** — summary cards, charts load
  - [ ] Add Category (modal)
  - [ ] Delete Category
  - [ ] Import from Estimate
- [ ] **Files** — upload a file, view, delete
- [ ] **Photos** — upload photo, view, delete
- [ ] **Blueprints** — upload, view
- [ ] **Timeline** — loads without error
- [ ] **Team** — list loads, Add Member
- [ ] **Expenses** — list loads, Add Expense
- [ ] **Materials** — list loads, Add Material (modal)
- [ ] **Daily Logs** — loads, create entry
- [ ] **Punch List** — loads, Add Item (modal), toggle complete
- [ ] **RFIs** — loads, create RFI
- [ ] **Change Orders** — loads, create change order
- [ ] **Submittals** — loads, create submittal
- [ ] **Inspections** — loads, link to create inspection
- [ ] **Safety** — loads

---

## JOBS (`/jobs`)
- [ ] List loads with status tabs
- [ ] Map view renders
- [ ] Search/filter works
- [ ] Export works
- [ ] **Create/Dispatch** — "Dispatch Job", select customer, fill form, submit
  - [ ] Create with existing customer
  - [ ] Create with new inline customer
  - [ ] Team availability shows
- [ ] **Detail** — click job, page loads
  - [ ] Status, customer info, schedule display
  - [ ] Edit job
- [ ] **Delete** — delete a test job

---

## ESTIMATES (`/estimates`)
- [ ] List loads with status tabs
- [ ] View count tracking
- [ ] Export works
- [ ] **Create** — "New Estimate", select customer
  - [ ] Add line items
  - [ ] Tax calculation
  - [ ] Save as Draft
  - [ ] Send estimate
- [ ] **Detail** — click estimate, view loads
- [ ] **Public link** — open public estimate URL
  - [ ] Customer can approve
  - [ ] Customer can decline
- [ ] **Delete** — delete test estimate

---

## INVOICES (`/invoices`)
- [ ] List loads with status tabs
- [ ] Outstanding/Overdue summary cards
- [ ] Export works
- [ ] **Create** — "New Invoice", select customer
  - [ ] Add line items
  - [ ] Tax calculation
  - [ ] Save as Draft
  - [ ] Send invoice
- [ ] **Detail** — click invoice, view loads
- [ ] **Public link** — open public invoice URL
- [ ] **Payment page** (`/pay/[id]`) — loads, payment works
- [ ] **Delete** — delete test invoice

---

## LEADS (`/leads`)
- [ ] Kanban board loads
- [ ] Pipeline values show
- [ ] **Create** — "New Lead", fill form, submit
- [ ] Drag between columns (if supported)
- [ ] **Detail** — click lead card
- [ ] **Convert** — convert lead to customer/job

---

## EQUIPMENT (`/equipment`)
- [ ] List loads with status filter
- [ ] Search works
- [ ] **Create** — "New Equipment" modal, fill, submit
- [ ] **Detail** — click equipment, page loads
  - [ ] Details tab
  - [ ] Assignments tab
  - [ ] Maintenance tab
- [ ] **Assign** — Assign Equipment modal
- [ ] **Log Maintenance** — Maintenance modal
- [ ] **Delete** — delete test equipment

---

## PURCHASE ORDERS (`/purchase-orders`)
- [ ] List loads
- [ ] **Create** — "New PO", fill form, submit
- [ ] **Detail** — click PO, page loads
  - [ ] Receive Items modal
- [ ] **Send** — send PO
- [ ] **Delete** — delete test PO

---

## INSPECTIONS (`/inspections`)
- [ ] List loads
- [ ] **Create** — "New Inspection" modal, fill, submit
- [ ] **Detail** — click inspection, page loads
  - [ ] Checklist items display
  - [ ] Mark items pass/fail
  - [ ] Complete inspection
- [ ] **Delete** — delete test inspection

---

## MESSAGES (`/messages`)
- [ ] Conversation list loads
- [ ] Click conversation, messages display
- [ ] Send a message
- [ ] SMS delivery (if Twilio configured)

## TEAM MESSAGES (`/team/messages`)
- [ ] Team chat loads
- [ ] Send a message

---

## CALENDAR (`/calendar`)
- [ ] Month view loads
- [ ] Week view
- [ ] Day view
- [ ] Jobs display on correct dates
- [ ] Click job to navigate

---

## ACTIVITY LOG (`/activity`)
- [ ] Log loads
- [ ] Filter by channel (SMS/Email)
- [ ] Filter by status
- [ ] Pagination works

---

## REPORTS (`/reports`)
- [ ] Page loads without error
- [ ] Revenue chart renders
- [ ] Profit margin displays
- [ ] Client breakdown chart
- [ ] Lead status breakdown
- [ ] Top 10 customers table
- [ ] Job status breakdown

---

## BLUEPRINTS (`/blueprints`)
- [ ] Grid loads
- [ ] Upload blueprint
- [ ] View blueprint
- [ ] AI takeoff (if available)

---

## SETTINGS
- [ ] **General** (`/settings`) — company info displays, edit modal works
- [ ] **Team** (`/settings/team`) — members list, invite member, edit member
- [ ] **Billing** (`/settings/billing`) — subscription info, manage billing
- [ ] **Branding** (`/settings/branding`) — logo/color customization
- [ ] **Import** (`/settings/import`) — data import
- [ ] **Integrations** (`/settings/integrations`) — page loads
- [ ] **Notifications** (`/settings/notifications`) — preferences save
- [ ] **Payments** (`/settings/payments`) — Stripe settings
- [ ] **Permissions** (`/settings/permissions`) — role config
- [ ] **Portal** (`/settings/portal`) — portal settings
- [ ] **SMS** (`/settings/sms`) — SMS settings

---

## CUSTOMER PORTAL (`/public/portal/`)
- [ ] Portal login works
- [ ] Dashboard loads — stats, projects, invoices, estimates
- [ ] View estimates — approve/decline
- [ ] View invoices — pay
- [ ] View project detail — photos, updates
- [ ] Portal settings — profile update

---

## ADMIN (`/admin`) — super-admin only
- [ ] Dashboard loads — metrics, client list
- [ ] Clients list — search, filter
- [ ] Client detail — subscription management
- [ ] Create test client
- [ ] Revenue analytics
- [ ] Push notifications — send broadcast
- [ ] Support tickets
- [ ] Admin settings

---

## CROSS-CUTTING
- [ ] Mobile responsive on all pages
- [ ] Tablet layout (2-col where applicable)
- [ ] Toast notifications appear on success/error
- [ ] Loading states show (skeletons/spinners)
- [ ] 404 page for invalid routes
- [ ] Error boundary catches crashes gracefully
