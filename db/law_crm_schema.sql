-- =============================================================
--  LAW CRM — PostgreSQL Database Schema
--  BPM Workflow Engine + Role-Based Access Control
--  Steps: Client Intake → Case → Docket → Entries → Tasks → Dashboard
-- =============================================================

-- =============================================================
--  EXTENSIONS
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
--  ENUMS
-- =============================================================

CREATE TYPE user_status       AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE case_type         AS ENUM ('civil_suit', 'writ_petition', 'criminal', 'arbitration', 'appeal', 'revision');
CREATE TYPE court_level       AS ENUM ('district_court', 'high_court', 'supreme_court', 'tribunal');
CREATE TYPE case_priority     AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE case_status       AS ENUM ('draft', 'active', 'stayed', 'disposed', 'closed', 'archived');
CREATE TYPE docket_stage      AS ENUM ('pleadings', 'pre_trial', 'trial', 'arguments', 'judgment', 'execution');
CREATE TYPE docket_status     AS ENUM ('open', 'adjourned', 'disposed', 'transferred', 'closed');
CREATE TYPE entry_type        AS ENUM ('filing', 'court_order', 'hearing_minutes', 'notice', 'judgment', 'vakalatnama', 'affidavit', 'other');
CREATE TYPE task_priority     AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE task_status       AS ENUM ('pending', 'in_progress', 'review', 'completed', 'cancelled');
CREATE TYPE subtask_status    AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE party_role        AS ENUM ('petitioner', 'respondent', 'appellant', 'respondent_appellant', 'intervenor', 'amicus_curiae');
CREATE TYPE hearing_outcome   AS ENUM ('adjourned', 'argued', 'order_reserved', 'order_passed', 'part_heard', 'dismissed', 'disposed');
CREATE TYPE conflict_status   AS ENUM ('clear', 'conflict_found', 'waived');
CREATE TYPE filing_method     AS ENUM ('e_filing', 'physical', 'hybrid');
CREATE TYPE notice_status     AS ENUM ('pending', 'dispatched', 'served', 'returned', 'failed');

-- BPM-specific enums
CREATE TYPE workflow_step     AS ENUM (
    'client_intake',        -- Step 1
    'case_creation',        -- Step 2
    'docket_opening',       -- Step 3
    'docket_entries',       -- Step 4
    'task_management',      -- Step 5
    'case_dashboard'        -- Step 6
);
CREATE TYPE step_status       AS ENUM ('not_started', 'in_progress', 'pending_review', 'approved', 'rejected', 'skipped');
CREATE TYPE transition_action AS ENUM ('submit', 'approve', 'reject', 'reassign', 'escalate', 'reopen');

-- =============================================================
--  1. ROLES & PERMISSIONS
-- =============================================================

CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(80)  NOT NULL UNIQUE,   -- e.g. 'senior_counsel', 'junior_associate'
    display_name    VARCHAR(120) NOT NULL,
    description     TEXT,
    is_system_role  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Built-in roles
INSERT INTO roles (name, display_name, description, is_system_role) VALUES
    ('super_admin',       'Super Admin',          'Full system access',                                   TRUE),
    ('managing_partner',  'Managing Partner',     'Approves cases, views all matters',                    TRUE),
    ('senior_counsel',    'Senior Counsel',       'Leads case strategy, approves filings',                TRUE),
    ('junior_associate',  'Junior Associate',     'Drafts documents, manages tasks',                      TRUE),
    ('paralegal',         'Paralegal',            'Docket entries, document management',                  TRUE),
    ('receptionist',      'Receptionist',         'Client intake only',                                   TRUE),
    ('billing_manager',   'Billing Manager',      'Time tracking and invoicing',                          TRUE),
    ('client_portal',     'Client (Portal)',      'Read-only view of own cases',                          TRUE);

-- =============================================================
--  2. PERMISSIONS CATALOGUE
-- =============================================================

CREATE TABLE permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code            VARCHAR(100) NOT NULL UNIQUE,   -- e.g. 'client:create', 'case:approve'
    module          VARCHAR(60)  NOT NULL,           -- 'client', 'case', 'docket', 'task'
    action          VARCHAR(60)  NOT NULL,           -- 'create', 'read', 'update', 'delete', 'approve'
    description     TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by      UUID,                            -- FK to users, set after users table created
    PRIMARY KEY (role_id, permission_id)
);

-- =============================================================
--  3. USERS
-- =============================================================

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code       VARCHAR(30)  UNIQUE,
    full_name           VARCHAR(200) NOT NULL,
    email               VARCHAR(254) NOT NULL UNIQUE,
    phone               VARCHAR(30),
    password_hash       TEXT         NOT NULL,
    bar_enrolment_no    VARCHAR(60),                 -- for advocates
    designation         VARCHAR(120),
    status              user_status  NOT NULL DEFAULT 'active',
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by          UUID REFERENCES users(id)
);

-- Add FK now that users table exists
ALTER TABLE role_permissions
    ADD CONSTRAINT fk_rp_granted_by FOREIGN KEY (granted_by) REFERENCES users(id);

CREATE TABLE user_roles (
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by     UUID REFERENCES users(id),
    expires_at      TIMESTAMPTZ,                     -- optional role expiry
    PRIMARY KEY (user_id, role_id)
);

-- =============================================================
--  4. BPM WORKFLOW DEFINITIONS
-- =============================================================
-- Defines which roles can act at each step, and valid transitions.

CREATE TABLE workflow_step_config (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step                workflow_step NOT NULL UNIQUE,
    step_order          SMALLINT     NOT NULL,        -- 1–6
    display_name        VARCHAR(120) NOT NULL,
    description         TEXT,
    sla_hours           SMALLINT,                    -- expected completion window
    is_mandatory        BOOLEAN      NOT NULL DEFAULT TRUE
);

INSERT INTO workflow_step_config (step, step_order, display_name, sla_hours) VALUES
    ('client_intake',   1, 'Client intake & conflict check',  24),
    ('case_creation',   2, 'Create case',                     48),
    ('docket_opening',  3, 'Open docket',                     24),
    ('docket_entries',  4, 'Docket entries',                  NULL),
    ('task_management', 5, 'Tasks & deadlines',               NULL),
    ('case_dashboard',  6, 'Case dashboard & review',         NULL);

-- Which roles can perform / approve each step
CREATE TABLE workflow_step_roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step            workflow_step NOT NULL,
    role_id         UUID         NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    can_execute     BOOLEAN      NOT NULL DEFAULT TRUE,  -- can work the step
    can_approve     BOOLEAN      NOT NULL DEFAULT FALSE, -- can approve/advance
    can_reject      BOOLEAN      NOT NULL DEFAULT FALSE,
    can_reassign    BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (step, role_id)
);

-- Valid step transitions
CREATE TABLE workflow_transitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_step       workflow_step     NOT NULL,
    to_step         workflow_step     NOT NULL,
    action          transition_action NOT NULL,
    requires_approval BOOLEAN         NOT NULL DEFAULT FALSE,
    condition_expr  TEXT,                              -- optional JSON/SQL rule
    created_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    UNIQUE (from_step, to_step, action)
);

INSERT INTO workflow_transitions (from_step, to_step, action, requires_approval) VALUES
    ('client_intake',   'case_creation',   'submit',   TRUE),
    ('case_creation',   'client_intake',   'reject',   FALSE),
    ('case_creation',   'docket_opening',  'submit',   TRUE),
    ('docket_opening',  'case_creation',   'reject',   FALSE),
    ('docket_opening',  'docket_entries',  'submit',   FALSE),
    ('docket_entries',  'task_management', 'submit',   FALSE),
    ('task_management', 'case_dashboard',  'submit',   FALSE),
    ('case_dashboard',  'task_management', 'reopen',   FALSE);

-- =============================================================
--  5. CLIENTS
-- =============================================================

CREATE TABLE clients (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_code         VARCHAR(30)  UNIQUE,
    full_name           VARCHAR(300) NOT NULL,
    entity_type         VARCHAR(60)  NOT NULL DEFAULT 'individual', -- 'individual','company','trust','huf'
    pan_number          VARCHAR(20),
    gstin               VARCHAR(20),
    email               VARCHAR(254),
    phone_primary       VARCHAR(30),
    phone_secondary     VARCHAR(30),
    address_line1       VARCHAR(300),
    address_line2       VARCHAR(300),
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(12),
    country             VARCHAR(80)  NOT NULL DEFAULT 'India',
    referred_by         VARCHAR(200),
    notes               TEXT,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by          UUID REFERENCES users(id)
);

-- Conflict check log
CREATE TABLE conflict_checks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id           UUID         NOT NULL REFERENCES clients(id),
    opposing_party_name VARCHAR(300) NOT NULL,
    checked_by          UUID         NOT NULL REFERENCES users(id),
    checked_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    status              conflict_status NOT NULL DEFAULT 'clear',
    notes               TEXT,
    waiver_obtained     BOOLEAN      NOT NULL DEFAULT FALSE,
    waiver_document_url TEXT
);

-- =============================================================
--  6. CASES
-- =============================================================

CREATE TABLE cases (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_code           VARCHAR(40)  UNIQUE,              -- internal ref, e.g. 'HC-2025-00042'
    title               VARCHAR(500) NOT NULL,
    case_type           case_type    NOT NULL,
    court_level         court_level  NOT NULL,
    court_name          VARCHAR(200) NOT NULL,
    bench_division      VARCHAR(200),
    relief_sought       TEXT,
    priority            case_priority NOT NULL DEFAULT 'normal',
    status              case_status  NOT NULL DEFAULT 'draft',
    facts_summary       TEXT,
    filing_date         DATE,
    client_id           UUID         NOT NULL REFERENCES clients(id),
    lead_advocate_id    UUID         REFERENCES users(id),
    junior_advocate_id  UUID         REFERENCES users(id),
    supervising_partner_id UUID      REFERENCES users(id),
    conflict_check_id   UUID         REFERENCES conflict_checks(id),
    closed_at           TIMESTAMPTZ,
    close_reason        TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by          UUID         REFERENCES users(id)
);

CREATE TABLE case_parties (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id         UUID         NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    party_name      VARCHAR(300) NOT NULL,
    party_role      party_role   NOT NULL,
    address         TEXT,
    phone           VARCHAR(30),
    email           VARCHAR(254),
    advocate_name   VARCHAR(200),                    -- opposing counsel
    notes           TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Users assigned to a case (team members beyond lead/junior)
CREATE TABLE case_team (
    case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_in_case    VARCHAR(80),                     -- e.g. 'researcher', 'billing contact'
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by     UUID REFERENCES users(id),
    PRIMARY KEY (case_id, user_id)
);

-- =============================================================
--  7. DOCKETS
-- =============================================================

CREATE TABLE dockets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id             UUID         NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    docket_number       VARCHAR(100),                -- court-assigned, may be null until assigned
    court_name          VARCHAR(200) NOT NULL,
    court_level         court_level  NOT NULL,
    bench_judge         VARCHAR(200),
    filing_method       filing_method NOT NULL DEFAULT 'e_filing',
    registered_date     DATE,
    stage               docket_stage NOT NULL DEFAULT 'pleadings',
    status              docket_status NOT NULL DEFAULT 'open',
    next_hearing_date   DATE,
    next_hearing_purpose VARCHAR(200),
    opposing_counsel    VARCHAR(300),
    notes               TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by          UUID         REFERENCES users(id)
);

-- =============================================================
--  8. DOCKET ENTRIES
-- =============================================================

CREATE TABLE docket_entries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    docket_id       UUID         NOT NULL REFERENCES dockets(id) ON DELETE CASCADE,
    entry_number    SMALLINT     NOT NULL,            -- sequential per docket
    entry_type      entry_type   NOT NULL,
    entry_date      DATE         NOT NULL,
    title           VARCHAR(400) NOT NULL,
    description     TEXT,
    outcome         hearing_outcome,                  -- for hearing entries
    next_date       DATE,
    next_purpose    VARCHAR(200),
    entered_by      UUID         REFERENCES users(id),
    verified_by     UUID         REFERENCES users(id),
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (docket_id, entry_number)
);

-- Auto-increment entry_number per docket
CREATE OR REPLACE FUNCTION set_entry_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    SELECT COALESCE(MAX(entry_number), 0) + 1
      INTO NEW.entry_number
      FROM docket_entries
     WHERE docket_id = NEW.docket_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_entry_number
    BEFORE INSERT ON docket_entries
    FOR EACH ROW EXECUTE FUNCTION set_entry_number();

-- Documents attached to entries
CREATE TABLE entry_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id        UUID         NOT NULL REFERENCES docket_entries(id) ON DELETE CASCADE,
    document_name   VARCHAR(300) NOT NULL,
    file_url        TEXT         NOT NULL,
    file_size_kb    INTEGER,
    mime_type       VARCHAR(100),
    uploaded_by     UUID         REFERENCES users(id),
    uploaded_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Notice tracking
CREATE TABLE notices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id        UUID         NOT NULL REFERENCES docket_entries(id),
    party_id        UUID         NOT NULL REFERENCES case_parties(id),
    method          VARCHAR(60)  NOT NULL,            -- 'registered_post','e_service','bailiff'
    dispatched_at   TIMESTAMPTZ,
    served_at       TIMESTAMPTZ,
    status          notice_status NOT NULL DEFAULT 'pending',
    ack_document_url TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================================
--  9. TASKS & SUBTASKS
-- =============================================================

CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id         UUID         NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    docket_id       UUID         REFERENCES dockets(id),
    title           VARCHAR(400) NOT NULL,
    description     TEXT,
    task_type       VARCHAR(80),                      -- 'hearing_prep','filing','research','review'
    priority        task_priority NOT NULL DEFAULT 'normal',
    status          task_status  NOT NULL DEFAULT 'pending',
    due_date        DATE,
    reminder_date   DATE,
    assigned_to     UUID         REFERENCES users(id),
    assigned_by     UUID         REFERENCES users(id),
    assigned_at     TIMESTAMPTZ,
    completed_by    UUID         REFERENCES users(id),
    completed_at    TIMESTAMPTZ,
    parent_task_id  UUID         REFERENCES tasks(id),   -- self-ref for sub-grouping
    is_auto_generated BOOLEAN    NOT NULL DEFAULT FALSE,  -- created by workflow engine
    source_step     workflow_step,                        -- which BPM step triggered this
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by      UUID         REFERENCES users(id)
);

CREATE TABLE subtasks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id         UUID         NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title           VARCHAR(400) NOT NULL,
    description     TEXT,
    status          subtask_status NOT NULL DEFAULT 'pending',
    assigned_to     UUID         REFERENCES users(id),
    due_date        DATE,
    sort_order      SMALLINT     NOT NULL DEFAULT 0,
    completed_by    UUID         REFERENCES users(id),
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Task comments / activity log
CREATE TABLE task_comments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id         UUID         NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id       UUID         NOT NULL REFERENCES users(id),
    comment         TEXT         NOT NULL,
    is_internal     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================================
--  10. BPM — CASE WORKFLOW INSTANCES
-- =============================================================
-- Each case gets one workflow instance tracking its BPM journey.

CREATE TABLE case_workflow_instances (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id         UUID         NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    current_step    workflow_step NOT NULL DEFAULT 'client_intake',
    started_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    UNIQUE (case_id)
);

-- One record per step per case, tracking status and actors
CREATE TABLE case_step_instances (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id     UUID         NOT NULL REFERENCES case_workflow_instances(id) ON DELETE CASCADE,
    case_id         UUID         NOT NULL REFERENCES cases(id),
    step            workflow_step NOT NULL,
    status          step_status  NOT NULL DEFAULT 'not_started',
    assigned_to     UUID         REFERENCES users(id),   -- who must action this step
    assigned_by     UUID         REFERENCES users(id),
    assigned_at     TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    submitted_at    TIMESTAMPTZ,
    reviewed_by     UUID         REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    approved_at     TIMESTAMPTZ,
    rejected_at     TIMESTAMPTZ,
    rejection_reason TEXT,
    due_at          TIMESTAMPTZ,                          -- SLA deadline
    notes           TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (workflow_id, step)
);

-- Full audit trail of every step transition
CREATE TABLE workflow_transition_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id     UUID              NOT NULL REFERENCES case_workflow_instances(id),
    case_id         UUID              NOT NULL REFERENCES cases(id),
    from_step       workflow_step,
    to_step         workflow_step     NOT NULL,
    action          transition_action NOT NULL,
    performed_by    UUID              NOT NULL REFERENCES users(id),
    performed_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    ip_address      INET,
    notes           TEXT
);

-- =============================================================
--  11. STEP ACCESS CONTROL VIEW
-- =============================================================
-- Convenience view: can user U act on step S for case C?

CREATE OR REPLACE VIEW v_user_step_access AS
SELECT
    u.id                AS user_id,
    u.full_name         AS user_name,
    r.name              AS role_name,
    wsr.step,
    wsr.can_execute,
    wsr.can_approve,
    wsr.can_reject,
    wsr.can_reassign
FROM users u
JOIN user_roles    ur  ON ur.user_id = u.id
JOIN roles         r   ON r.id       = ur.role_id
JOIN workflow_step_roles wsr ON wsr.role_id = r.id
WHERE u.status = 'active'
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

-- =============================================================
--  12. REMINDERS & NOTIFICATIONS
-- =============================================================

CREATE TABLE reminders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id         UUID         REFERENCES cases(id),
    docket_id       UUID         REFERENCES dockets(id),
    task_id         UUID         REFERENCES tasks(id),
    remind_user_id  UUID         NOT NULL REFERENCES users(id),
    title           VARCHAR(300) NOT NULL,
    body            TEXT,
    remind_at       TIMESTAMPTZ  NOT NULL,
    is_sent         BOOLEAN      NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(300) NOT NULL,
    body            TEXT,
    link_type       VARCHAR(60),                      -- 'case','task','step'
    link_id         UUID,
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================================
--  13. AUDIT LOG (system-wide)
-- =============================================================

CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID         REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,             -- 'INSERT','UPDATE','DELETE','LOGIN'
    table_name      VARCHAR(100),
    record_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================================
--  14. AUTO-UPDATED updated_at TRIGGER
-- =============================================================

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','roles','cases','dockets','docket_entries',
    'tasks','subtasks','case_step_instances'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_touch_%I BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION touch_updated_at()', t, t);
  END LOOP;
END;
$$;

-- =============================================================
--  15. INDEXES
-- =============================================================

CREATE INDEX idx_cases_client       ON cases(client_id);
CREATE INDEX idx_cases_status       ON cases(status);
CREATE INDEX idx_cases_lead         ON cases(lead_advocate_id);
CREATE INDEX idx_dockets_case       ON dockets(case_id);
CREATE INDEX idx_dockets_next_date  ON dockets(next_hearing_date);
CREATE INDEX idx_entries_docket     ON docket_entries(docket_id);
CREATE INDEX idx_entries_date       ON docket_entries(entry_date);
CREATE INDEX idx_tasks_case         ON tasks(case_id);
CREATE INDEX idx_tasks_assigned     ON tasks(assigned_to);
CREATE INDEX idx_tasks_due          ON tasks(due_date);
CREATE INDEX idx_tasks_status       ON tasks(status);
CREATE INDEX idx_subtasks_task      ON subtasks(task_id);
CREATE INDEX idx_step_inst_workflow ON case_step_instances(workflow_id);
CREATE INDEX idx_step_inst_step     ON case_step_instances(step);
CREATE INDEX idx_step_inst_assigned ON case_step_instances(assigned_to);
CREATE INDEX idx_wf_log_case        ON workflow_transition_log(case_id);
CREATE INDEX idx_notif_user         ON notifications(user_id, is_read);
CREATE INDEX idx_reminders_at       ON reminders(remind_at) WHERE is_sent = FALSE;
CREATE INDEX idx_audit_table        ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_user         ON audit_log(user_id);

-- =============================================================
--  16. SAMPLE WORKFLOW STEP-ROLE ASSIGNMENTS
-- =============================================================

-- Lookup role IDs inline via subquery for portability
INSERT INTO workflow_step_roles (step, role_id, can_execute, can_approve, can_reject, can_reassign)
SELECT s.step, r.id, s.can_execute, s.can_approve, s.can_reject, s.can_reassign
FROM (VALUES
  -- Step 1: Client intake
  ('client_intake'::workflow_step,  'receptionist',      TRUE,  FALSE, FALSE, FALSE),
  ('client_intake',                 'junior_associate',  TRUE,  FALSE, FALSE, FALSE),
  ('client_intake',                 'senior_counsel',    TRUE,  TRUE,  TRUE,  TRUE),
  ('client_intake',                 'managing_partner',  TRUE,  TRUE,  TRUE,  TRUE),
  -- Step 2: Case creation
  ('case_creation',                 'junior_associate',  TRUE,  FALSE, FALSE, FALSE),
  ('case_creation',                 'senior_counsel',    TRUE,  TRUE,  TRUE,  TRUE),
  ('case_creation',                 'managing_partner',  TRUE,  TRUE,  TRUE,  TRUE),
  -- Step 3: Docket opening
  ('docket_opening',                'paralegal',         TRUE,  FALSE, FALSE, FALSE),
  ('docket_opening',                'junior_associate',  TRUE,  FALSE, FALSE, FALSE),
  ('docket_opening',                'senior_counsel',    TRUE,  TRUE,  TRUE,  TRUE),
  -- Step 4: Docket entries
  ('docket_entries',                'paralegal',         TRUE,  FALSE, FALSE, FALSE),
  ('docket_entries',                'junior_associate',  TRUE,  FALSE, FALSE, FALSE),
  ('docket_entries',                'senior_counsel',    TRUE,  TRUE,  FALSE, TRUE),
  -- Step 5: Task management
  ('task_management',               'paralegal',         TRUE,  FALSE, FALSE, FALSE),
  ('task_management',               'junior_associate',  TRUE,  FALSE, FALSE, FALSE),
  ('task_management',               'senior_counsel',    TRUE,  TRUE,  FALSE, TRUE),
  ('task_management',               'managing_partner',  TRUE,  TRUE,  TRUE,  TRUE),
  -- Step 6: Case dashboard
  ('case_dashboard',                'senior_counsel',    TRUE,  FALSE, FALSE, FALSE),
  ('case_dashboard',                'managing_partner',  TRUE,  TRUE,  TRUE,  TRUE),
  ('case_dashboard',                'billing_manager',   TRUE,  FALSE, FALSE, FALSE),
  ('case_dashboard',                'client_portal',     TRUE,  FALSE, FALSE, FALSE)
) AS s(step, role_name, can_execute, can_approve, can_reject, can_reassign)
JOIN roles r ON r.name = s.role_name;

-- =============================================================
--  END OF SCHEMA
-- =============================================================
