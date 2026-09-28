CREATE TABLE workflow (
    workflow_id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_code                VARCHAR(100) NOT NULL UNIQUE,
    description         TEXT,        -- 1–6
    display_name        VARCHAR(120) NOT NULL,
);

CREATE TABLE workflow_step_config (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id         UUID         NOT NULL REFERENCES workflow(workflow_id) ON DELETE CASCADE,
    step                workflow_step NOT NULL UNIQUE,
    step_order          SMALLINT     NOT NULL,        -- 1–6
    display_name        VARCHAR(120) NOT NULL,
    description         TEXT,
    sla_hours           SMALLINT,                    -- expected completion window
    is_mandatory        BOOLEAN      NOT NULL DEFAULT TRUE
);


CREATE TABLE workflow_roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(80)  NOT NULL UNIQUE,   -- e.g. 'senior_counsel', 'junior_associate'
    display_name    VARCHAR(120) NOT NULL,
    description     TEXT,
    is_system_role  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Which roles can perform / approve each step
CREATE TABLE workflow_step_roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step            workflow_step NOT NULL,
    workflow_role_id         UUID         NOT NULL REFERENCES workflow_roles(id) ON DELETE CASCADE,
    can_execute     BOOLEAN      NOT NULL DEFAULT TRUE,  -- can work the step
    can_approve     BOOLEAN      NOT NULL DEFAULT FALSE, -- can approve/advance
    can_reject      BOOLEAN      NOT NULL DEFAULT FALSE,
    can_reassign    BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (step, workflow_role_id)
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



