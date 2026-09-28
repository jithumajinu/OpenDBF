-- ============================================================
-- Vidhila Law Management — Docket & Case Management Schema
-- Target  : MySQL 8.0+ (InnoDB, utf8mb4)
-- Multi-tenant: every table is scoped by tenant_id
-- Created : 2026-03-24
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ------------------------------------------------------------
-- Assumes the tenants table already exists (vidhila_db_test.tenants)
-- Tenant-scoping strategy:
--   • Master/lookup tables  → tenant-specific config per firm
--   • Security/user tables  → tenant-scoped users & roles
--   • Case management tables → fully tenant-isolated
-- ------------------------------------------------------------

-- ============================================================
-- 1. MASTER / LOOKUP TABLES
-- ============================================================

-- Roles available within the application (per tenant)
CREATE TABLE m_user_role (
    role_id    SMALLINT        NOT NULL AUTO_INCREMENT,
    tenant_id  BIGINT          NOT NULL,
    role_code  VARCHAR(30)     NOT NULL,
    role_name  VARCHAR(60)     NOT NULL,
    PRIMARY KEY (role_id),
    UNIQUE KEY uq_user_role_code (tenant_id, role_code),
    CONSTRAINT fk_mur_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Application role lookup (ADMIN, LAWYER, CLERK, etc.) per tenant';

1
-- Courts / judicial bodies (per tenant — allows firm-specific court lists)
CREATE TABLE m_court (
    court_id    BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id   BIGINT          NOT NULL,
    court_code  VARCHAR(30)     NOT NULL,
    court_name  VARCHAR(150)    NOT NULL,
    court_level VARCHAR(30)     NOT NULL  COMMENT 'DISTRICT | HIGH | SUPREME | TRIBUNAL | COMMISSION',
    city        VARCHAR(80)     NULL,
    state       VARCHAR(80)     NULL,
    country     VARCHAR(80)     NOT NULL  DEFAULT 'India',
    is_active   TINYINT(1)      NOT NULL  DEFAULT 1,
    PRIMARY KEY (court_id),
    UNIQUE KEY uq_court_code (tenant_id, court_code),
    KEY ix_court_state (tenant_id, state),
    CONSTRAINT fk_mc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Judicial courts and tribunals per tenant';

-- Case classification (Civil, Criminal, Writ, etc.)
CREATE TABLE m_case_type (
    case_type_id    SMALLINT        NOT NULL AUTO_INCREMENT,
    tenant_id       BIGINT          NOT NULL,
    case_type_code  VARCHAR(30)     NOT NULL  COMMENT 'CIVIL | CRIMINAL | WRIT | ARBITRATION | CONSUMER',
    case_type_name  VARCHAR(80)     NOT NULL,
    is_active       TINYINT(1)      NOT NULL  DEFAULT 1,
    PRIMARY KEY (case_type_id),
    UNIQUE KEY uq_case_type_code (tenant_id, case_type_code),
    CONSTRAINT fk_mct_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Types of legal cases per tenant';

-- Lifecycle statuses for a case
CREATE TABLE m_case_status (
    status_id    SMALLINT    NOT NULL AUTO_INCREMENT,
    tenant_id    BIGINT      NOT NULL,
    status_code  VARCHAR(30) NOT NULL  COMMENT 'FILED | ADMITTED | HEARING | RESERVED | DISPOSED | CLOSED | APPEALED',
    status_name  VARCHAR(80) NOT NULL,
    is_terminal  TINYINT(1)  NOT NULL  DEFAULT 0  COMMENT '1 = no further action expected',
    sort_order   SMALLINT    NOT NULL  DEFAULT 0,
    PRIMARY KEY (status_id),
    UNIQUE KEY uq_case_status_code (tenant_id, status_code),
    CONSTRAINT fk_mcs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lifecycle statuses of a case per tenant';

-- Priority levels
CREATE TABLE m_priority (
    priority_id    SMALLINT    NOT NULL AUTO_INCREMENT,
    tenant_id      BIGINT      NOT NULL,
    priority_code  VARCHAR(20) NOT NULL  COMMENT 'LOW | MEDIUM | HIGH | URGENT',
    priority_name  VARCHAR(40) NOT NULL,
    sort_order     SMALLINT    NOT NULL  DEFAULT 0,
    PRIMARY KEY (priority_id),
    UNIQUE KEY uq_priority_code (tenant_id, priority_code),
    CONSTRAINT fk_mp_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Case priority levels per tenant';

-- Role a party plays in a case
CREATE TABLE m_party_type (
    party_type_id    SMALLINT    NOT NULL AUTO_INCREMENT,
    tenant_id        BIGINT      NOT NULL,
    party_type_code  VARCHAR(30) NOT NULL  COMMENT 'PETITIONER | RESPONDENT | COMPLAINANT | ACCUSED | INTERVENOR',
    party_type_name  VARCHAR(60) NOT NULL,
    PRIMARY KEY (party_type_id),
    UNIQUE KEY uq_party_type_code (tenant_id, party_type_code),
    CONSTRAINT fk_mpt_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Types of parties involved in a case per tenant';

-- Document/file classification
CREATE TABLE m_document_type (
    doc_type_id    SMALLINT    NOT NULL AUTO_INCREMENT,
    tenant_id      BIGINT      NOT NULL,
    doc_type_code  VARCHAR(30) NOT NULL  COMMENT 'PETITION | AFFIDAVIT | ORDER | EVIDENCE | MEMO | NOTICE',
    doc_type_name  VARCHAR(80) NOT NULL,
    PRIMARY KEY (doc_type_id),
    UNIQUE KEY uq_doc_type_code (tenant_id, doc_type_code),
    CONSTRAINT fk_mdt_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Document type classifications per tenant';

-- Outcome of a hearing
CREATE TABLE m_hearing_outcome (
    outcome_id    SMALLINT    NOT NULL AUTO_INCREMENT,
    tenant_id     BIGINT      NOT NULL,
    outcome_code  VARCHAR(30) NOT NULL  COMMENT 'ADJOURNED | ORDER_PASSED | ARGUMENTS_HEARD | JUDGEMENT_RESERVED',
    outcome_name  VARCHAR(100) NOT NULL,
    PRIMARY KEY (outcome_id),
    UNIQUE KEY uq_hearing_outcome_code (tenant_id, outcome_code),
    CONSTRAINT fk_mho_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Possible outcomes after a court hearing per tenant';

-- vidhila_db_test.m_contact definition
CREATE TABLE `m_contact` (
  `contact_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `delete_flag` tinyint NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `deleted_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `archived` varchar(255) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `email1` varchar(255) DEFAULT NULL,
  `email2` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `job_title` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `phone1` varchar(255) DEFAULT NULL,
  `phone2` varchar(255) DEFAULT NULL,
  `tenant_id` bigint NOT NULL,
  `website1` varchar(255) DEFAULT NULL,
  `website2` varchar(255) DEFAULT NULL,
  `address1_id` bigint DEFAULT NULL,
  `address2_id` bigint DEFAULT NULL,
  PRIMARY KEY (`contact_id`),
  KEY `FK66ikmj4f7t2d7u98or69bif7c` (`address1_id`),
  KEY `FKfohaiorui74qre68gs5lgwtbc` (`address2_id`),
  CONSTRAINT `FK66ikmj4f7t2d7u98or69bif7c` FOREIGN KEY (`address1_id`) REFERENCES `m_address` (`address_id`),
  CONSTRAINT `FKfohaiorui74qre68gs5lgwtbc` FOREIGN KEY (`address2_id`) REFERENCES `m_address` (`address_id`),
  CONSTRAINT `m_contact_chk_1` CHECK ((`delete_flag` between 0 and 1))
) ENGINE=InnoDB AUTO_INCREMENT=2026 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ============================================================
-- 2. SECURITY / USERS
-- ============================================================

-- CREATE TABLE app_user (
--     user_id        BIGINT          NOT NULL AUTO_INCREMENT,
--     tenant_id      BIGINT          NOT NULL,
--     employee_code  VARCHAR(30)     NULL,
--     full_name      VARCHAR(120)    NOT NULL,
--     email          VARCHAR(150)    NOT NULL,
--     phone          VARCHAR(20)     NULL,
--     password_hash  VARCHAR(255)    NOT NULL,
--     is_active      TINYINT(1)      NOT NULL  DEFAULT 1,
--     last_login_at  DATETIME        NULL,
--     created_at     DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
--     updated_at     DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     PRIMARY KEY (user_id),
--     UNIQUE KEY uq_user_email (tenant_id, email),
--     UNIQUE KEY uq_employee_code (tenant_id, employee_code),
--     CONSTRAINT fk_au_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
--   COMMENT='Application users (lawyers, clerks, admins) per tenant';

-- CREATE TABLE app_user_role_map (
--     tenant_id  BIGINT      NOT NULL,
--     user_id    BIGINT      NOT NULL,
--     role_id    SMALLINT    NOT NULL,
--     PRIMARY KEY (tenant_id, user_id, role_id),
--     CONSTRAINT fk_urm_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)  ON DELETE CASCADE,
--     CONSTRAINT fk_urm_user   FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE,
--     CONSTRAINT fk_urm_role   FOREIGN KEY (role_id)   REFERENCES m_user_role(role_id) ON DELETE RESTRICT
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
--   COMMENT='Many-to-many: users to roles per tenant';


-- ============================================================
-- 3. CASE MANAGEMENT TABLES
-- ============================================================

-- Central docket / case record
CREATE TABLE case_file (
    case_id            BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id          BIGINT          NOT NULL,
    case_no            VARCHAR(60)     NOT NULL                COMMENT 'Internal docket number',
    filing_no          VARCHAR(60)     NULL                    COMMENT 'Court-assigned filing number',
    court_id           BIGINT          NOT NULL,
    case_type_id       SMALLINT        NOT NULL,
    status_id          SMALLINT        NOT NULL,
    priority_id        SMALLINT        NOT NULL,
    title              VARCHAR(255)    NOT NULL                COMMENT 'e.g. "A vs B"',
    subject            TEXT            NULL,
    filing_date        DATE            NOT NULL,
    registration_date  DATE            NULL,
    disposed_date      DATE            NULL,
    is_confidential    TINYINT(1)      NOT NULL  DEFAULT 0,
    created_by         BIGINT          NOT NULL,
    created_at         DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    updated_by         BIGINT          NULL,
    updated_at         DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (case_id),
    UNIQUE KEY uq_case_no (tenant_id, case_no),
    UNIQUE KEY uq_filing_no (tenant_id, filing_no),
    KEY ix_cf_court_status  (tenant_id, court_id, status_id),
    KEY ix_cf_filing_date   (tenant_id, filing_date),
    KEY ix_cf_case_type     (tenant_id, case_type_id),
    KEY ix_cf_priority      (tenant_id, priority_id),
    KEY ix_cf_status        (tenant_id, status_id),
    CONSTRAINT chk_disposed_date CHECK (disposed_date IS NULL OR disposed_date >= filing_date),
    CONSTRAINT fk_cf_tenant      FOREIGN KEY (tenant_id)    REFERENCES tenants(tenant_id)           ON DELETE CASCADE,
    CONSTRAINT fk_cf_court       FOREIGN KEY (court_id)     REFERENCES m_court(court_id)             ON DELETE RESTRICT,
    CONSTRAINT fk_cf_case_type   FOREIGN KEY (case_type_id) REFERENCES m_case_type(case_type_id)     ON DELETE RESTRICT,
    CONSTRAINT fk_cf_status      FOREIGN KEY (status_id)    REFERENCES m_case_status(status_id)      ON DELETE RESTRICT,
    CONSTRAINT fk_cf_priority    FOREIGN KEY (priority_id)  REFERENCES m_priority(priority_id)       ON DELETE RESTRICT,
    CONSTRAINT fk_cf_created_by  FOREIGN KEY (created_by)   REFERENCES users(id)             ON DELETE RESTRICT,
    CONSTRAINT fk_cf_updated_by  FOREIGN KEY (updated_by)   REFERENCES users(id)             ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Core case / docket record';

-- Parties (petitioners, respondents, accused, etc.)
CREATE TABLE case_party (
    case_party_id     BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id         BIGINT          NOT NULL,
    case_id           BIGINT          NOT NULL,
    party_type_id     SMALLINT        NOT NULL,
    party_name        VARCHAR(180)    NOT NULL,
    organization_name VARCHAR(180)    NULL,
    contact_phone     VARCHAR(20)     NULL,
    contact_email     VARCHAR(150)    NULL,
    address_line1     VARCHAR(200)    NULL,
    address_line2     VARCHAR(200)    NULL,
    city              VARCHAR(80)     NULL,
    state             VARCHAR(80)     NULL,
    postal_code       VARCHAR(15)     NULL,
    country           VARCHAR(80)     NOT NULL  DEFAULT 'India',
    PRIMARY KEY (case_party_id),
    UNIQUE KEY uq_case_party (tenant_id, case_id, party_type_id, party_name),
    CONSTRAINT fk_cp_tenant     FOREIGN KEY (tenant_id)     REFERENCES tenants(tenant_id)              ON DELETE CASCADE,
    CONSTRAINT fk_cp_case       FOREIGN KEY (case_id)       REFERENCES case_file(case_id)              ON DELETE CASCADE,
    CONSTRAINT fk_cp_party_type FOREIGN KEY (party_type_id) REFERENCES m_party_type(party_type_id)     ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Parties involved in a case (people and organisations)';

-- Advocates / counsels representing parties
CREATE TABLE case_advocate (
    case_advocate_id    BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id           BIGINT          NOT NULL,
    case_id             BIGINT          NOT NULL,
    party_type_id       SMALLINT        NOT NULL  COMMENT 'Which side this advocate represents',
    advocate_name       VARCHAR(160)    NOT NULL,
    bar_registration_no VARCHAR(60)     NULL,
    phone               VARCHAR(20)     NULL,
    email               VARCHAR(150)    NULL,
    is_lead             TINYINT(1)      NOT NULL  DEFAULT 0,
    PRIMARY KEY (case_advocate_id),
    KEY ix_advocate_case (tenant_id, case_id),
    CONSTRAINT fk_ca_tenant     FOREIGN KEY (tenant_id)     REFERENCES tenants(tenant_id)              ON DELETE CASCADE,
    CONSTRAINT fk_ca_case       FOREIGN KEY (case_id)       REFERENCES case_file(case_id)              ON DELETE CASCADE,
    CONSTRAINT fk_ca_party_type FOREIGN KEY (party_type_id) REFERENCES m_party_type(party_type_id)     ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Advocates / counsels representing case parties';

-- Internal team assignment per case
CREATE TABLE case_assignment (
    assignment_id    BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id        BIGINT          NOT NULL,
    case_id          BIGINT          NOT NULL,
    assigned_to      BIGINT          NOT NULL,
    assigned_by      BIGINT          NOT NULL,
    assignment_role  VARCHAR(40)     NOT NULL  COMMENT 'OWNER | REVIEWER | CLERK | PARA_LEGAL',
    assigned_on      DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    unassigned_on    DATETIME        NULL,
    remarks          VARCHAR(300)    NULL,
    PRIMARY KEY (assignment_id),
    KEY ix_assignment_case (tenant_id, case_id),
    KEY ix_assignment_user (tenant_id, assigned_to),
    CONSTRAINT fk_asgn_tenant FOREIGN KEY (tenant_id)   REFERENCES tenants(tenant_id)  ON DELETE CASCADE,
    CONSTRAINT fk_asgn_case   FOREIGN KEY (case_id)     REFERENCES case_file(case_id)  ON DELETE CASCADE,
    CONSTRAINT fk_asgn_to     FOREIGN KEY (assigned_to) REFERENCES users(id)   ON DELETE RESTRICT,
    CONSTRAINT fk_asgn_by     FOREIGN KEY (assigned_by) REFERENCES users(id)   ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Internal user assignment to a case with roles';

-- Hearing / cause list entries
CREATE TABLE case_hearing (
    hearing_id        BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id         BIGINT          NOT NULL,
    case_id           BIGINT          NOT NULL,
    hearing_no        INT             NOT NULL  COMMENT 'Sequential hearing number per case',
    hearing_date      DATE            NOT NULL,
    court_hall        VARCHAR(50)     NULL,
    judge_name        VARCHAR(160)    NULL,
    outcome_id        SMALLINT        NULL,
    next_hearing_date DATE            NULL,
    remarks           TEXT            NULL,
    created_by        BIGINT          NOT NULL,
    created_at        DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (hearing_id),
    UNIQUE KEY uq_hearing_case_no (tenant_id, case_id, hearing_no),
    KEY ix_hearing_date      (tenant_id, hearing_date),
    KEY ix_next_hearing_date (tenant_id, next_hearing_date),
    CONSTRAINT fk_hr_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants(tenant_id)              ON DELETE CASCADE,
    CONSTRAINT fk_hr_case    FOREIGN KEY (case_id)    REFERENCES case_file(case_id)              ON DELETE CASCADE,
    CONSTRAINT fk_hr_outcome FOREIGN KEY (outcome_id) REFERENCES m_hearing_outcome(outcome_id)   ON DELETE SET NULL,
    CONSTRAINT fk_hr_created FOREIGN KEY (created_by) REFERENCES users(id)              ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Court dates and hearing log per case';

-- Immutable audit / docket event trail
CREATE TABLE docket_entry (
    docket_id      BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id      BIGINT          NOT NULL,
    case_id        BIGINT          NOT NULL,
    event_ts       DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    event_type     VARCHAR(40)     NOT NULL  COMMENT 'FILED | STATUS_CHANGED | HEARING_ADDED | DOC_UPLOADED | NOTE_ADDED',
    event_summary  VARCHAR(255)    NOT NULL,
    details        TEXT            NULL,
    performed_by   BIGINT          NULL,
    PRIMARY KEY (docket_id),
    KEY ix_docket_case_ts (tenant_id, case_id, event_ts),
    KEY ix_de_event_ts    (tenant_id, event_ts),
    CONSTRAINT fk_de_tenant FOREIGN KEY (tenant_id)   REFERENCES tenants(tenant_id)  ON DELETE CASCADE,
    CONSTRAINT fk_de_case   FOREIGN KEY (case_id)     REFERENCES case_file(case_id)  ON DELETE CASCADE,
    CONSTRAINT fk_de_user   FOREIGN KEY (performed_by) REFERENCES users(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Append-only docket event log (audit trail)';

-- Documents / file attachments
CREATE TABLE case_document (
    document_id     BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id       BIGINT          NOT NULL,
    case_id         BIGINT          NOT NULL,
    doc_type_id     SMALLINT        NOT NULL,
    document_title  VARCHAR(200)    NOT NULL,
    file_name       VARCHAR(255)    NOT NULL,
    mime_type       VARCHAR(100)    NULL,
    file_size_bytes BIGINT          NULL,
    storage_path    TEXT            NOT NULL  COMMENT 'Blob storage key or URL',
    version_no      INT             NOT NULL  DEFAULT 1,
    is_sealed       TINYINT(1)      NOT NULL  DEFAULT 0  COMMENT 'Restricted access for court-sealed docs',
    uploaded_by     BIGINT          NOT NULL,
    uploaded_at     DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (document_id),
    KEY ix_doc_case_type (tenant_id, case_id, doc_type_id),
    CONSTRAINT fk_cd_tenant   FOREIGN KEY (tenant_id)   REFERENCES tenants(tenant_id)           ON DELETE CASCADE,
    CONSTRAINT fk_cd_case     FOREIGN KEY (case_id)     REFERENCES case_file(case_id)           ON DELETE CASCADE,
    CONSTRAINT fk_cd_doc_type FOREIGN KEY (doc_type_id) REFERENCES m_document_type(doc_type_id) ON DELETE RESTRICT,
    CONSTRAINT fk_cd_uploaded FOREIGN KEY (uploaded_by) REFERENCES users(id)            ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='File attachments and documents associated with a case';

-- Internal notes (attorney work product)
CREATE TABLE case_note (
    note_id     BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id   BIGINT          NOT NULL,
    case_id     BIGINT          NOT NULL,
    note_text   TEXT            NOT NULL,
    is_private  TINYINT(1)      NOT NULL  DEFAULT 1  COMMENT '1 = visible only to author',
    created_by  BIGINT          NOT NULL,
    created_at  DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id),
    KEY ix_note_case (tenant_id, case_id),
    CONSTRAINT fk_cn_tenant  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)  ON DELETE CASCADE,
    CONSTRAINT fk_cn_case    FOREIGN KEY (case_id)   REFERENCES case_file(case_id)  ON DELETE CASCADE,
    CONSTRAINT fk_cn_created FOREIGN KEY (created_by) REFERENCES users(id)  ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Internal confidential notes per case';


-- ============================================================
-- 4. SEED / REFERENCE DATA
--    Run per-tenant after inserting a tenant row.
--    Replace ? with the actual tenant_id value.
-- ============================================================

/*
-- Example seed for tenant_id = 1

INSERT INTO m_case_status (tenant_id, status_code, status_name, is_terminal, sort_order) VALUES
    (1, 'FILED',       'Filed',               0, 1),
    (1, 'ADMITTED',    'Admitted',            0, 2),
    (1, 'DISCOVERY',   'Discovery / Notice',  0, 3),
    (1, 'HEARING',     'Hearing',             0, 4),
    (1, 'RESERVED',    'Judgement Reserved',  0, 5),
    (1, 'DISPOSED',    'Disposed',            1, 6),
    (1, 'CLOSED',      'Closed',              1, 7),
    (1, 'APPEALED',    'Appealed',            0, 8);

INSERT INTO m_priority (tenant_id, priority_code, priority_name, sort_order) VALUES
    (1, 'LOW',    'Low',    1),
    (1, 'MEDIUM', 'Medium', 2),
    (1, 'HIGH',   'High',   3),
    (1, 'URGENT', 'Urgent', 4);

INSERT INTO m_case_type (tenant_id, case_type_code, case_type_name) VALUES
    (1, 'CIVIL',       'Civil'),
    (1, 'CRIMINAL',    'Criminal'),
    (1, 'WRIT',        'Writ / Constitutional'),
    (1, 'FAMILY',      'Family'),
    (1, 'CONSUMER',    'Consumer'),
    (1, 'ARBITRATION', 'Arbitration'),
    (1, 'CORPORATE',   'Corporate / Commercial'),
    (1, 'LABOUR',      'Labour / Industrial');

INSERT INTO m_party_type (tenant_id, party_type_code, party_type_name) VALUES
    (1, 'PETITIONER',  'Petitioner'),
    (1, 'RESPONDENT',  'Respondent'),
    (1, 'COMPLAINANT', 'Complainant'),
    (1, 'ACCUSED',     'Accused'),
    (1, 'APPELLANT',   'Appellant'),
    (1, 'INTERVENOR',  'Intervenor / Third Party');

INSERT INTO m_document_type (tenant_id, doc_type_code, doc_type_name) VALUES
    (1, 'PETITION',  'Petition / Plaint'),
    (1, 'AFFIDAVIT', 'Affidavit'),
    (1, 'ORDER',     'Court Order'),
    (1, 'JUDGEMENT', 'Judgement'),
    (1, 'EVIDENCE',  'Evidence / Exhibit'),
    (1, 'NOTICE',    'Legal Notice'),
    (1, 'MEMO',      'Memo of Appearance'),
    (1, 'REPLY',     'Written Statement / Reply');

INSERT INTO m_hearing_outcome (tenant_id, outcome_code, outcome_name) VALUES
    (1, 'ADJOURNED',          'Adjourned'),
    (1, 'ORDER_PASSED',       'Order Passed'),
    (1, 'ARGUMENTS_HEARD',    'Arguments Heard'),
    (1, 'JUDGEMENT_RESERVED', 'Judgement Reserved'),
    (1, 'CASE_DISMISSED',     'Case Dismissed'),
    (1, 'SETTLED',            'Settled / Consent Decree');

INSERT INTO m_user_role (tenant_id, role_code, role_name) VALUES
    (1, 'ADMIN',      'System Administrator'),
    (1, 'LAWYER',     'Advocate / Lawyer'),
    (1, 'PARA_LEGAL', 'Para Legal'),
    (1, 'CLERK',      'Office Clerk'),
    (1, 'VIEWER',     'Read-only Viewer');
*/

SET FOREIGN_KEY_CHECKS = 1;
