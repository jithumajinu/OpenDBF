-- =============================================================
--  VIDHILA — Case Manager Steps Schema  (PostgreSQL)
--  6-step BPM workflow:
--    Step 1 · Client Intake        → matter + contact + address
--    Step 2 · Create Case          → matter_case + case_party + advocate
--    Step 3 · Open Docket          → docket + filed_document
--    Step 4 · Docket Entries       → docket_entry
--    Step 5 · Tasks & Deadlines    → matter_task + matter_task_sub
--    Step 6 · Case Dashboard       → matter_timeline (read-only view)
-- =============================================================

-- =============================================================
--  EXTENSIONS
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
--  ENUMS — removed; validation handled in Java enums
--  client_type         : 'individual' | 'company' | 'trust'
--  case_type           : 'civil_suit' | 'writ_petition' | 'criminal' | 'arbitration' | 'appeal' | 'revision'
--  court_level         : 'district_court' | 'high_court' | 'supreme_court' | 'tribunal' | 'commission'
--  case_priority       : 'low' | 'normal' | 'high' | 'urgent'
--  case_status         : 'draft' | 'active' | 'stayed' | 'disposed' | 'closed' | 'archived'
--  docket_status       : 'open' | 'adjourned' | 'disposed' | 'transferred' | 'closed'
--  entry_type          : 'filing' | 'court_order' | 'hearing' | 'notice' | 'judgment' | 'vakalatnama' | 'affidavit' | 'other'
--  party_role          : 'petitioner' | 'respondent' | 'appellant' | 'intervenor' | 'amicus_curiae' | 'witness'
--  task_priority       : 'low' | 'normal' | 'high' | 'urgent'
--  task_status         : 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled'
--  timeline_event_type : 'intake' | 'case_created' | 'docket_opened' | 'filing' | 'hearing' | 'order' | 'task_added' | 'task_done' | 'notice' | 'judgment' | 'closed'
-- =============================================================

-- =============================================================
--  STEP 1 · CLIENT INTAKE
--  Tables: contact, contact_address, matter
-- =============================================================

-- ── Contact ───────────────────────────────────────────────────────────────────
-- Stores the client (or any party) contact record.
-- A contact may be reused across multiple matters.
CREATE TABLE contact (
    id              BIGSERIAL       PRIMARY KEY,
    tenant_id       BIGINT          NOT NULL,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    company_name    VARCHAR(200),
    job_title       VARCHAR(100),
    department      VARCHAR(100),
    email1          VARCHAR(150),
    email2          VARCHAR(150),
    phone1          VARCHAR(30),
    phone2          VARCHAR(30),
    website1        VARCHAR(255),
    website2        VARCHAR(255),
    pan_id          VARCHAR(20),
    date_of_birth   DATE,
    avatar_url      VARCHAR(500),
    status          VARCHAR(50)     DEFAULT 'active',
    archived_at     TIMESTAMPTZ,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_contact_tenant        ON contact (tenant_id);
CREATE INDEX ix_contact_email1        ON contact (tenant_id, email1);
CREATE INDEX ix_contact_name          ON contact (tenant_id, last_name, first_name);

-- ── Contact Address ───────────────────────────────────────────────────────────
-- A contact may have up to 2 addresses (mirroring UI addressList max = 2).
CREATE TABLE contact_address (
    id              BIGSERIAL       PRIMARY KEY,
    contact_id      BIGINT          NOT NULL REFERENCES contact (id) ON DELETE CASCADE,
    sort_order      SMALLINT        NOT NULL DEFAULT 0,   -- 0 = primary, 1 = secondary
    street          TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    state_code      VARCHAR(20),
    zip             VARCHAR(20),
    country         VARCHAR(100),
    country_code    VARCHAR(10),
    region          VARCHAR(100),
    lang            VARCHAR(50),
    other           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_contact_address_contact ON contact_address (contact_id);

-- ── Matter (Client Intake) ────────────────────────────────────────────────────
-- Top-level record created in Step 1.  `id` is the matterId stored in Redux.
CREATE TABLE matter (
    id                  BIGSERIAL           PRIMARY KEY,
    tenant_id           BIGINT              NOT NULL,
    matter_name         VARCHAR(500)        NOT NULL,       -- matterName
    matter_type         SMALLINT            NOT NULL,       -- 1=LITIGATION through 12=OTHER
    client_type         VARCHAR(30)         NOT NULL DEFAULT 'individual',
    referred_by         VARCHAR(200),
    initial_matter      TEXT,                               -- rich-text HTML from TiptapEditor
    client_contact_id   BIGINT              REFERENCES contact (id) ON DELETE SET NULL,
    conflict_status     VARCHAR(30)         NOT NULL DEFAULT 'clear',  -- clear | conflict_found | waived
    status              VARCHAR(30)         NOT NULL DEFAULT 'draft',
    created_by          BIGINT,
    updated_by          BIGINT,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_matter_tenant          ON matter (tenant_id);
CREATE INDEX ix_matter_contact         ON matter (client_contact_id);
CREATE INDEX ix_matter_status          ON matter (tenant_id, status);
CREATE INDEX ix_matter_name_search     ON matter USING gin (to_tsvector('english', matter_name));

-- =============================================================
--  STEP 2 · CREATE CASE
--  Tables: matter_case, case_advocate, case_party
-- =============================================================

-- ── Matter Case ───────────────────────────────────────────────────────────────
-- Formal case details attached to a matter.
-- One matter may spawn multiple cases (e.g., HC + SC).
CREATE TABLE matter_case (
    id                  BIGSERIAL           PRIMARY KEY,
    matter_id           BIGINT              NOT NULL REFERENCES matter (id) ON DELETE CASCADE,
    case_title          VARCHAR(500),
    case_type           VARCHAR(50),
    court_id            BIGINT,                             -- FK to m_court (master table)
    court_name          VARCHAR(200),                       -- denormalised for display
    bench_division      VARCHAR(200),
    case_number         VARCHAR(100),                       -- official court case number
    filing_date         DATE,
    filing_method       VARCHAR(30),                        -- e_filing | physical | hybrid
    relief_sought       VARCHAR(200),
    urgency             VARCHAR(20)         DEFAULT 'normal',
    case_summary        TEXT,
    status              VARCHAR(30)         NOT NULL DEFAULT 'active',
    created_by          BIGINT,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_mcase_matter           ON matter_case (matter_id);
CREATE INDEX ix_mcase_status           ON matter_case (matter_id, status);

-- ── Case Advocate ─────────────────────────────────────────────────────────────
-- Tracks the advocate team per case.
CREATE TABLE case_advocate (
    id                  BIGSERIAL           PRIMARY KEY,
    case_id             BIGINT              NOT NULL REFERENCES matter_case (id) ON DELETE CASCADE,
    advocate_name       VARCHAR(200)        NOT NULL,
    role                VARCHAR(50)         NOT NULL,   -- 'lead' | 'junior' | 'associate' | 'consultant'
    enrollment_no       VARCHAR(50),
    phone               VARCHAR(30),
    email               VARCHAR(150),
    sort_order          SMALLINT            DEFAULT 0,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_case_advocate_case     ON case_advocate (case_id);

-- ── Case Party ────────────────────────────────────────────────────────────────
-- Petitioner, respondent, intervenor, etc.
CREATE TABLE case_party (
    id                  BIGSERIAL           PRIMARY KEY,
    case_id             BIGINT              NOT NULL REFERENCES matter_case (id) ON DELETE CASCADE,
    party_role          VARCHAR(50)         NOT NULL,
    party_name          VARCHAR(300)        NOT NULL,
    contact_id          BIGINT              REFERENCES contact (id) ON DELETE SET NULL,
    details             TEXT,
    sort_order          SMALLINT            DEFAULT 0,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_case_party_case        ON case_party (case_id);
CREATE INDEX ix_case_party_contact     ON case_party (contact_id);

-- =============================================================
--  STEP 3 · OPEN DOCKET
--  Tables: docket, filed_document
-- =============================================================

-- ── Docket ────────────────────────────────────────────────────────────────────
-- Official court register for a matter.
-- One matter can have multiple dockets (HC + SC, etc.).
CREATE TABLE docket (
    id                  BIGSERIAL           PRIMARY KEY,
    matter_id           BIGINT              NOT NULL REFERENCES matter (id) ON DELETE CASCADE,
    case_id             BIGINT              REFERENCES matter_case (id) ON DELETE SET NULL,
    docket_number       VARCHAR(100),
    court_name          VARCHAR(200),
    bench               VARCHAR(200),
    stage               VARCHAR(50),        -- pleadings | pre_trial | trial | arguments | judgment | execution
    status              VARCHAR(30)         NOT NULL DEFAULT 'open',
    opened_date         DATE                NOT NULL DEFAULT CURRENT_DATE,
    next_hearing_date   DATE,
    closed_date         DATE,
    notes               TEXT,
    created_by          BIGINT,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_docket_matter          ON docket (matter_id);
CREATE INDEX ix_docket_case            ON docket (case_id);
CREATE INDEX ix_docket_status          ON docket (matter_id, status);
CREATE INDEX ix_docket_next_hearing    ON docket (next_hearing_date) WHERE status = 'open';

-- ── Filed Document ────────────────────────────────────────────────────────────
-- Documents filed / submitted with this docket.
CREATE TABLE filed_document (
    id                  BIGSERIAL           PRIMARY KEY,
    docket_id           BIGINT              NOT NULL REFERENCES docket (id) ON DELETE CASCADE,
    document_name       VARCHAR(300)        NOT NULL,
    document_type       VARCHAR(100),       -- plaint, reply, exhibit, vakalatnama, etc.
    filed_date          DATE,
    file_url            VARCHAR(500),
    file_size_bytes     BIGINT,
    notes               TEXT,
    uploaded_by         BIGINT,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_filed_doc_docket       ON filed_document (docket_id);

-- =============================================================
--  STEP 4 · DOCKET ENTRIES
--  Table: docket_entry
-- =============================================================

-- ── Docket Entry ─────────────────────────────────────────────────────────────
-- Individual events / proceedings recorded in the docket register.
CREATE TABLE docket_entry (
    id                  BIGSERIAL           PRIMARY KEY,
    docket_id           BIGINT              NOT NULL REFERENCES docket (id) ON DELETE CASCADE,
    entry_no            VARCHAR(20),        -- e.g. #001, #002
    entry_type          VARCHAR(50)         NOT NULL DEFAULT 'other',
    entry_date          DATE                NOT NULL,
    title               VARCHAR(500)        NOT NULL,
    description         TEXT,               -- meta / detailed notes
    next_date           DATE,
    reminder_days       SMALLINT            DEFAULT 3,   -- auto-reminder N days before next_date
    hearing_outcome     VARCHAR(50),        -- adjourned | argued | order_passed | disposed …
    created_by          BIGINT,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_docket_entry_docket    ON docket_entry (docket_id);
CREATE INDEX ix_docket_entry_date      ON docket_entry (docket_id, entry_date DESC);
CREATE INDEX ix_docket_entry_next_date ON docket_entry (next_date) WHERE next_date IS NOT NULL;

-- =============================================================
--  STEP 5 · TASKS & DEADLINES
--  Tables: matter_task, matter_task_sub
-- =============================================================

-- ── Matter Task ───────────────────────────────────────────────────────────────
-- A task can be linked to the matter, a specific case, docket, or docket entry.
CREATE TABLE matter_task (
    id                  BIGSERIAL           PRIMARY KEY,
    matter_id           BIGINT              NOT NULL REFERENCES matter (id) ON DELETE CASCADE,
    case_id             BIGINT              REFERENCES matter_case (id) ON DELETE SET NULL,
    docket_id           BIGINT              REFERENCES docket (id) ON DELETE SET NULL,
    docket_entry_id     BIGINT              REFERENCES docket_entry (id) ON DELETE SET NULL,
    task_name           VARCHAR(300)        NOT NULL,
    due_date            DATE,
    priority            VARCHAR(20)         NOT NULL DEFAULT 'normal',
    priority_label      VARCHAR(100),       -- UI badge label  e.g. "High — injunction prep"
    status              VARCHAR(30)         NOT NULL DEFAULT 'pending',
    is_done             BOOLEAN             NOT NULL DEFAULT FALSE,
    done_at             TIMESTAMPTZ,
    assigned_to         BIGINT,             -- FK to users table
    created_by          BIGINT,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_mtask_matter           ON matter_task (matter_id);
CREATE INDEX ix_mtask_due_date         ON matter_task (due_date) WHERE is_done = FALSE;
CREATE INDEX ix_mtask_assigned         ON matter_task (assigned_to) WHERE is_done = FALSE;
CREATE INDEX ix_mtask_priority         ON matter_task (matter_id, priority, is_done);

-- ── Task Sub-item ─────────────────────────────────────────────────────────────
-- Checklist sub-tasks under a parent task.
CREATE TABLE matter_task_sub (
    id                  BIGSERIAL           PRIMARY KEY,
    task_id             BIGINT              NOT NULL REFERENCES matter_task (id) ON DELETE CASCADE,
    sub_task_name       VARCHAR(300)        NOT NULL,
    is_done             BOOLEAN             NOT NULL DEFAULT FALSE,
    done_at             TIMESTAMPTZ,
    sort_order          SMALLINT            NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_mtask_sub_task         ON matter_task_sub (task_id);

-- =============================================================
--  STEP 6 · CASE DASHBOARD
--  Table: matter_timeline  (auto-populated via triggers / app logic)
-- =============================================================

-- ── Matter Timeline ───────────────────────────────────────────────────────────
-- Immutable audit/event log that drives the dashboard timeline.
-- Rows are inserted by application logic (or triggers below) — never updated.
CREATE TABLE matter_timeline (
    id                  BIGSERIAL           PRIMARY KEY,
    matter_id           BIGINT              NOT NULL REFERENCES matter (id) ON DELETE CASCADE,
    event_type          VARCHAR(50)         NOT NULL,
    event_date          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    title               VARCHAR(300)        NOT NULL,
    description         TEXT,
    badge_color         VARCHAR(30),        -- purple | teal | amber | red | green (UI badge)
    reference_id        BIGINT,             -- ID of the linked entity
    reference_type      VARCHAR(50),        -- 'docket_entry' | 'matter_task' | 'matter_case' …
    created_by          BIGINT,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_timeline_matter        ON matter_timeline (matter_id, event_date DESC);
CREATE INDEX ix_timeline_event_type    ON matter_timeline (matter_id, event_type);

-- =============================================================
--  WORKFLOW PROGRESS (BPM step tracker)
-- =============================================================

-- ── Matter Workflow Step ──────────────────────────────────────────────────────
-- Tracks which step each matter has reached and its approval state.
CREATE TABLE matter_workflow_step (
    id                  BIGSERIAL       PRIMARY KEY,
    matter_id           BIGINT          NOT NULL REFERENCES matter (id) ON DELETE CASCADE,
    step_order          SMALLINT        NOT NULL,   -- 1..6
    step_code           VARCHAR(50)     NOT NULL,   -- client_intake | case_creation | docket_opening …
    step_label          VARCHAR(100)    NOT NULL,   -- display label
    status              VARCHAR(30)     NOT NULL DEFAULT 'not_started',  -- not_started | in_progress | completed | skipped
    completed_at        TIMESTAMPTZ,
    completed_by        BIGINT,
    notes               TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (matter_id, step_order)
);

CREATE INDEX ix_mwf_matter             ON matter_workflow_step (matter_id, step_order);

-- =============================================================
--  TRIGGERS — auto-populate matter_timeline
-- =============================================================

-- Helper function
CREATE OR REPLACE FUNCTION fn_timeline_insert(
    p_matter_id     BIGINT,
    p_event_type    VARCHAR(50),
    p_title         TEXT,
    p_description   TEXT,
    p_badge_color   TEXT,
    p_ref_id        BIGINT,
    p_ref_type      TEXT
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO matter_timeline (matter_id, event_type, title, description, badge_color, reference_id, reference_type)
    VALUES (p_matter_id, p_event_type, p_title, p_description, p_badge_color, p_ref_id, p_ref_type);
END;
$$;

-- Trigger: matter created (Step 1 saved)
CREATE OR REPLACE FUNCTION trg_matter_intake() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM fn_timeline_insert(
        NEW.id, 'intake',
        'Client intake recorded — ' || NEW.matter_name,
        'Client type: ' || NEW.client_type::TEXT || COALESCE('. Referred by: ' || NEW.referred_by, ''),
        'purple', NEW.id, 'matter'
    );
    RETURN NEW;
END;
$$;
CREATE TRIGGER tgr_matter_after_insert
    AFTER INSERT ON matter
    FOR EACH ROW EXECUTE FUNCTION trg_matter_intake();

-- Trigger: matter_case created (Step 2 saved)
CREATE OR REPLACE FUNCTION trg_case_created() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM fn_timeline_insert(
        NEW.matter_id, 'case_created',
        'Case created — ' || COALESCE(NEW.case_title, 'Untitled case'),
        COALESCE(NEW.court_name, '') || COALESCE(' · ' || NEW.bench_division, ''),
        'blue', NEW.id, 'matter_case'
    );
    RETURN NEW;
END;
$$;
CREATE TRIGGER tgr_case_after_insert
    AFTER INSERT ON matter_case
    FOR EACH ROW EXECUTE FUNCTION trg_case_created();

-- Trigger: docket opened (Step 3 saved)
CREATE OR REPLACE FUNCTION trg_docket_opened() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM fn_timeline_insert(
        NEW.matter_id, 'docket_opened',
        'Docket opened' || COALESCE(' — ' || NEW.docket_number, ''),
        COALESCE(NEW.court_name, '') || COALESCE(' / ' || NEW.bench, ''),
        'teal', NEW.id, 'docket'
    );
    RETURN NEW;
END;
$$;
CREATE TRIGGER tgr_docket_after_insert
    AFTER INSERT ON docket
    FOR EACH ROW EXECUTE FUNCTION trg_docket_opened();

-- Trigger: docket entry added (Step 4)
CREATE OR REPLACE FUNCTION trg_docket_entry_added() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_matter_id BIGINT;
BEGIN
    SELECT matter_id INTO v_matter_id FROM docket WHERE id = NEW.docket_id;
    PERFORM fn_timeline_insert(
        v_matter_id, NEW.entry_type,
        NEW.title,
        NEW.description,
        CASE NEW.entry_type
            WHEN 'filing'       THEN 'purple'
            WHEN 'court_order'  THEN 'teal'
            WHEN 'notice'       THEN 'amber'
            WHEN 'hearing'      THEN 'blue'
            WHEN 'judgment'     THEN 'green'
            ELSE 'gray'
        END,
        NEW.id, 'docket_entry'
    );
    RETURN NEW;
END;
$$;
CREATE TRIGGER tgr_docket_entry_after_insert
    AFTER INSERT ON docket_entry
    FOR EACH ROW EXECUTE FUNCTION trg_docket_entry_added();

-- Trigger: task completed (Step 5)
CREATE OR REPLACE FUNCTION trg_task_done() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.is_done = TRUE AND OLD.is_done = FALSE THEN
        PERFORM fn_timeline_insert(
            NEW.matter_id, 'task_done',
            'Task completed — ' || NEW.task_name,
            NULL,
            'green', NEW.id, 'matter_task'
        );
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER tgr_task_after_update
    AFTER UPDATE ON matter_task
    FOR EACH ROW EXECUTE FUNCTION trg_task_done();

-- =============================================================
--  SEED — Initial workflow steps for every new matter
-- =============================================================

CREATE OR REPLACE FUNCTION fn_seed_workflow_steps(p_matter_id BIGINT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO matter_workflow_step (matter_id, step_order, step_code, step_label, status) VALUES
        (p_matter_id, 1, 'client_intake',    'Client Intake',       'completed'),
        (p_matter_id, 2, 'case_creation',    'Create Case',         'not_started'),
        (p_matter_id, 3, 'docket_opening',   'Open Docket',         'not_started'),
        (p_matter_id, 4, 'docket_entries',   'Docket Entries',      'not_started'),
        (p_matter_id, 5, 'task_management',  'Tasks & Deadlines',   'not_started'),
        (p_matter_id, 6, 'case_dashboard',   'Case Dashboard',      'not_started');
END;
$$;

-- Trigger: seed workflow steps when a matter is first created
CREATE OR REPLACE FUNCTION trg_seed_workflow() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM fn_seed_workflow_steps(NEW.id);
    RETURN NEW;
END;
$$;
CREATE TRIGGER tgr_matter_workflow_seed
    AFTER INSERT ON matter
    FOR EACH ROW EXECUTE FUNCTION trg_seed_workflow();

-- =============================================================
--  COMMENTS (table-level documentation)
-- =============================================================

COMMENT ON TABLE contact                IS 'Step 1 – client/party contact record; reusable across matters';
COMMENT ON TABLE contact_address        IS 'Step 1 – up to 2 addresses per contact (sort_order 0=primary, 1=secondary)';
COMMENT ON TABLE matter                 IS 'Step 1 – top-level matter record created on client intake; matterId stored in Redux';
COMMENT ON TABLE matter_case            IS 'Step 2 – formal case details (court, type, parties, advocate team)';
COMMENT ON TABLE case_advocate          IS 'Step 2 – advocate team assigned to a case (lead, junior, associate)';
COMMENT ON TABLE case_party             IS 'Step 2 – petitioner / respondent / other parties';
COMMENT ON TABLE docket                 IS 'Step 3 – official court docket; one matter can have multiple dockets';
COMMENT ON TABLE filed_document         IS 'Step 3 – documents filed with the docket';
COMMENT ON TABLE docket_entry           IS 'Step 4 – individual proceedings / events recorded in the docket';
COMMENT ON TABLE matter_task            IS 'Step 5 – tasks and deadlines linked to matter / docket entries';
COMMENT ON TABLE matter_task_sub        IS 'Step 5 – sub-tasks / checklist items under a parent task';
COMMENT ON TABLE matter_timeline        IS 'Step 6 – immutable event log auto-populated by triggers; drives dashboard timeline';
COMMENT ON TABLE matter_workflow_step   IS 'BPM step tracker per matter (6 steps × 1 row each)';
