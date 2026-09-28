-- ============================================
-- 1) MASTER TABLES
-- ============================================

create table m_user_role (
  role_id smallint generated always as identity primary key,
  role_code varchar(30) not null unique,
  role_name varchar(60) not null
);

create table m_court (
  court_id bigint generated always as identity primary key,
  court_code varchar(30) not null unique,
  court_name varchar(150) not null,
  court_level varchar(30) not null, -- District / High / Supreme / Tribunal
  city varchar(80),
  state varchar(80),
  is_active boolean not null default true
);

create table m_case_type (
  case_type_id smallint generated always as identity primary key,
  case_type_code varchar(30) not null unique, -- CIVIL, CRIMINAL, WRIT...
  case_type_name varchar(80) not null,
  is_active boolean not null default true
);

create table m_case_status (
  status_id smallint generated always as identity primary key,
  status_code varchar(30) not null unique, -- FILED, ADMITTED, HEARING, DISPOSED, CLOSED
  status_name varchar(80) not null,
  sort_order smallint not null
);

create table m_priority (
  priority_id smallint generated always as identity primary key,
  priority_code varchar(20) not null unique, -- LOW/MEDIUM/HIGH/URGENT
  priority_name varchar(40) not null,
  sort_order smallint not null
);

create table m_party_type (
  party_type_id smallint generated always as identity primary key,
  party_type_code varchar(30) not null unique, -- PETITIONER, RESPONDENT, COMPLAINANT, ACCUSED
  party_type_name varchar(60) not null
);

create table m_document_type (
  doc_type_id smallint generated always as identity primary key,
  doc_type_code varchar(30) not null unique, -- PETITION, AFFIDAVIT, ORDER, EVIDENCE
  doc_type_name varchar(80) not null
);

create table m_hearing_outcome (
  outcome_id smallint generated always as identity primary key,
  outcome_code varchar(30) not null unique, -- ADJOURNED, ORDER_PASSED, ARGUMENTS_HEARD
  outcome_name varchar(100) not null
);

-- ============================================
-- 2) SECURITY / USERS
-- ============================================

create table app_user (
  user_id bigint generated always as identity primary key,
  employee_code varchar(30) unique,
  full_name varchar(120) not null,
  email varchar(150) not null unique,
  phone varchar(20),
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app_user_role_map (
  user_id bigint not null references app_user(user_id) on delete cascade,
  role_id smallint not null references m_user_role(role_id),
  primary key (user_id, role_id)
);

-- ============================================
-- 3) CASE MANAGEMENT TABLES
-- ============================================

create table case_file (
  case_id bigint generated always as identity primary key,
  case_no varchar(60) not null unique,             -- internal case number
  filing_no varchar(60) unique,                    -- external filing number
  court_id bigint not null references m_court(court_id),
  case_type_id smallint not null references m_case_type(case_type_id),
  status_id smallint not null references m_case_status(status_id),
  priority_id smallint not null references m_priority(priority_id),
  title varchar(255) not null,                     -- e.g. "A vs B"
  subject text,
  filing_date date not null,
  registration_date date,
  disposed_date date,
  is_confidential boolean not null default false,
  created_by bigint not null references app_user(user_id),
  created_at timestamptz not null default now(),
  updated_by bigint references app_user(user_id),
  updated_at timestamptz not null default now(),
  check (disposed_date is null or disposed_date >= filing_date)
);

create table case_party (
  case_party_id bigint generated always as identity primary key,
  case_id bigint not null references case_file(case_id) on delete cascade,
  party_type_id smallint not null references m_party_type(party_type_id),
  party_name varchar(180) not null,
  organization_name varchar(180),
  contact_phone varchar(20),
  contact_email varchar(150),
  address_line1 varchar(200),
  address_line2 varchar(200),
  city varchar(80),
  state varchar(80),
  postal_code varchar(15),
  country varchar(80) default 'India',
  unique (case_id, party_type_id, party_name)
);

create table case_advocate (
  case_advocate_id bigint generated always as identity primary key,
  case_id bigint not null references case_file(case_id) on delete cascade,
  party_type_id smallint not null references m_party_type(party_type_id),
  advocate_name varchar(160) not null,
  bar_registration_no varchar(60),
  phone varchar(20),
  email varchar(150),
  is_lead boolean not null default false
);

create table case_assignment (
  assignment_id bigint generated always as identity primary key,
  case_id bigint not null references case_file(case_id) on delete cascade,
  assigned_to bigint not null references app_user(user_id),
  assigned_by bigint not null references app_user(user_id),
  assignment_role varchar(40) not null, -- OWNER / REVIEWER / CLERK
  assigned_on timestamptz not null default now(),
  unassigned_on timestamptz,
  remarks varchar(300)
);

create table case_hearing (
  hearing_id bigint generated always as identity primary key,
  case_id bigint not null references case_file(case_id) on delete cascade,
  hearing_no integer not null,
  hearing_date date not null,
  court_hall varchar(50),
  judge_name varchar(160),
  outcome_id smallint references m_hearing_outcome(outcome_id),
  next_hearing_date date,
  remarks text,
  created_by bigint not null references app_user(user_id),
  created_at timestamptz not null default now(),
  unique (case_id, hearing_no)
);

create table docket_entry (
  docket_id bigint generated always as identity primary key,
  case_id bigint not null references case_file(case_id) on delete cascade,
  event_ts timestamptz not null default now(),
  event_type varchar(40) not null, -- FILED, STATUS_CHANGED, HEARING_UPDATED, DOC_UPLOADED
  event_summary varchar(255) not null,
  details text,
  performed_by bigint references app_user(user_id)
);

create table case_document (
  document_id bigint generated always as identity primary key,
  case_id bigint not null references case_file(case_id) on delete cascade,
  doc_type_id smallint not null references m_document_type(doc_type_id),
  document_title varchar(200) not null,
  file_name varchar(255) not null,
  mime_type varchar(100),
  file_size_bytes bigint,
  storage_path text not null, -- blob key/url
  version_no integer not null default 1,
  is_sealed boolean not null default false,
  uploaded_by bigint not null references app_user(user_id),
  uploaded_at timestamptz not null default now()
);

create table case_note (
  note_id bigint generated always as identity primary key,
  case_id bigint not null references case_file(case_id) on delete cascade,
  note_text text not null,
  is_private boolean not null default true,
  created_by bigint not null references app_user(user_id),
  created_at timestamptz not null default now()
);

-- ============================================
-- 4) INDEXES
-- ============================================

create index ix_case_file_court_status on case_file(court_id, status_id);
create index ix_case_file_filing_date on case_file(filing_date desc);
create index ix_case_hearing_case_date on case_hearing(case_id, hearing_date desc);
create index ix_docket_case_eventts on docket_entry(case_id, event_ts desc);
create index ix_case_document_case_doctype on case_document(case_id, doc_type_id);