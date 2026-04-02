<img width="3145" height="7540" alt="17751599908773097105719986255413" src="https://github.com/user-attachments/assets/6c0f9e82-29f0-47f5-a2d6-920af5dd6208" />


# Architecture: Agent Updates DB, FastAPI Pulls Status

## Overview

בארכיטקטורה זו:

- **Agent** אחראי על runtime של הטלפון וה-containers
- **Agent מעדכן את ה-DB ישירות**
- **FastAPI משמש Orchestrator ו-API ל-UI**
- **React UI פונה רק ל-FastAPI**
- **FastAPI קורא את ה-DB כדי להחזיר סטטוס**

אין צורך ב-queue או events bus.

---

# High Level Architecture



erDiagram

    USERS {
        uuid id PK
        uuid instance_id
    }

    AGENT_HOSTS {
        uuid id PK
        varchar host_name
        varchar ip_address
        varchar external_ip
        varchar status
        timestamptz last_heartbeat
        int max_containers
        int port_range_start
        int port_range_end
        timestamptz created_at
        timestamptz updated_at
    }

    AGENT_EVENTS {
        uuid id PK
        uuid agent_host_id FK
        varchar event_type
        jsonb event_data
        timestamptz created_at
    }

    PHONES {
        uuid id PK
        uuid user_id FK
        text number
        text label
        text color
        text status
        text docker_url
        text docker_status
        timestamp created_at
        uuid host_id FK
        varchar container_id
        varchar container_name
        int api_port
        int ws_port
        timestamptz last_health_check
        text error_message
    }

    PHONE_PROVISIONING_EVENTS {
        uuid id PK
        uuid phone_id FK
        uuid agent_host_id FK
        varchar status
        jsonb event_data
        timestamptz created_at
    }

    CONTACTS {
        uuid id PK
        uuid phone_id FK
        text lid
        text number
        text name
        text email
        text avatar
        text tag
        boolean is_bot
        timestamp created_at
    }

    SCENARIOS {
        uuid id PK
        uuid phone_id FK
        uuid contact_id FK
        text name
        text status
        jsonb config
        timestamp created_at
    }

    SCENARIO_RUNS {
        uuid id PK
        uuid scenario_id FK
        uuid phone_id FK
        text status
        timestamp started_at
        timestamp ended_at
        timestamp created_at
    }

    SCHEDULES {
        uuid id PK
        uuid phone_id FK
        uuid contact_id FK
        uuid scenario_id FK
        text schedule_name
        text schedule_type
        text status
        timestamp run_at
        text cron_expr
        int interval_min
        timestamp last_run
        timestamp next_run
        timestamp created_at
    }

    CALLS {
        uuid id PK
        uuid phone_id FK
        uuid contact_id FK
        uuid scenario_id FK
        text status
        timestamp started_at
        timestamp ended_at
        timestamp created_at
    }

    MESSAGES {
        uuid id PK
        uuid call_id FK
        text topic
        text sender
        text extension
        jsonb content
        text status
        jsonb payload
        timestamp sent_at
        text event
        boolean private
        timestamp updated_at
        timestamp inserted_at
    }

    USERS ||--o{ PHONES : owns
    AGENT_HOSTS ||--o{ PHONES : hosts
    AGENT_HOSTS ||--o{ AGENT_EVENTS : emits
    AGENT_HOSTS ||--o{ PHONE_PROVISIONING_EVENTS : handles
    PHONES ||--o{ PHONE_PROVISIONING_EVENTS : provisioning
    PHONES ||--o{ CONTACTS : has
    PHONES ||--o{ SCENARIOS : contains
    CONTACTS ||--o{ SCENARIOS : target
    SCENARIOS ||--o{ SCENARIO_RUNS : runs
    PHONES ||--o{ SCENARIO_RUNS : runs_on
    PHONES ||--o{ SCHEDULES : schedules
    CONTACTS ||--o{ SCHEDULES : for_contact
    SCENARIOS ||--o{ SCHEDULES : triggers
    PHONES ||--o{ CALLS : makes
    CONTACTS ||--o{ CALLS : with
    SCENARIOS ||--o{ CALLS : uses
    CALLS ||--o{ MESSAGES : contains
