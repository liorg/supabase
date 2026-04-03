
# Architecture: Agent Updates DB, FastAPI Pulls Status

## Overview

בארכיטקטורה זו:

- **Agent** אחראי על runtime של הטלפון וה-containers
- **Agent מעדכן את ה-DB ישירות**
- **FastAPI משמש Orchestrator ו-API ל-UI**
- **React UI פונה רק ל-FastAPI**
- **FastAPI קורא את ה-DB כדי להחזיר סטטוס**

אין צורך ב-queue או events bus



.
##System Architecture 


```mermaid
flowchart TB

subgraph Presentation
UI["React / Vite UI"]
end

subgraph Backend
API["FastAPI Orchestrator"]
end

subgraph Data
DB[("PostgreSQL")]
end

subgraph Infrastructure
AGENT[".NET Agent"]

subgraph HOST["Linux Host"]
PHONE1["Phone Container"]
PHONE2["Phone Container"]
PHONEN["Phone Container"]
end

end

UI --> API
API --> DB

AGENT --> DB
AGENT --> PHONE1
AGENT --> PHONE2
AGENT --> PHONEN
```
## Phone Provisioning Flow


```mermaid
sequenceDiagram

participant UI
participant API
participant DB
participant Agent
participant Phone

UI->>API: Create phone setup
API->>DB: Insert phone + provisioning event

Agent->>DB: Poll for new provisioning events
DB-->>Agent: Return setup task

Agent->>Phone: Create container
Agent->>DB: Update phone status
Agent->>DB: Insert agent event

UI->>API: Poll setup status
API->>DB: Read phone status
DB-->>API: Return status
API-->>UI: Updated status
```

# High Level Architecture

## Database ERD
```mermaid
erDiagram

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

    PHONE_PROVISIONING_EVENTS {
        uuid id PK
        uuid phone_id FK
        uuid agent_host_id FK
        varchar status
        jsonb event_data
        timestamptz created_at
    }

    PHONES {
        uuid id PK
        uuid user_id
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
        interval estimated_duration_minutes
        interval inter_leaf_response_time
    }

    SCHEDULES {
        uuid id PK
        uuid phone_id FK
        uuid contact_id FK
        uuid scenario_id FK
        text schedule_name
    }

    CALL_RUN_STATUSES {
        uuid id PK
        text name
        text description
        boolean should_close_call
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
        timestamp expected_end
        uuid last_status_id FK
        timestamp last_status_updated_at
    }

    SCENARIO_RUNS {
        uuid id PK
        uuid scenario_id FK
        uuid phone_id FK
        text status
        timestamp started_at
        timestamp ended_at
        timestamp created_at
        uuid call_id FK
        uuid status_id FK
    }

    MESSAGES {
        uuid id PK
        uuid call_id FK
        text sender
        text topic
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

    AGENT_HOSTS ||--o{ AGENT_EVENTS : has
    AGENT_HOSTS ||--o{ PHONES : hosts
    AGENT_HOSTS ||--o{ PHONE_PROVISIONING_EVENTS : handles

    PHONES ||--o{ CONTACTS : owns
    PHONES ||--o{ SCENARIOS : has
    PHONES ||--o{ SCHEDULES : has
    PHONES ||--o{ CALLS : makes
    PHONES ||--o{ SCENARIO_RUNS : runs
    PHONES ||--o{ PHONE_PROVISIONING_EVENTS : provisioning

    CONTACTS ||--o{ SCENARIOS : target
    CONTACTS ||--o{ SCHEDULES : scheduled_for
    CONTACTS ||--o{ CALLS : involved_in

    SCENARIOS ||--o{ SCHEDULES : scheduled_by
    SCENARIOS ||--o{ CALLS : used_in
    SCENARIOS ||--o{ SCENARIO_RUNS : executed_by

    CALL_RUN_STATUSES ||--o{ CALLS : last_status
    CALL_RUN_STATUSES ||--o{ SCENARIO_RUNS : status

    CALLS ||--o{ MESSAGES : contains
    CALLS ||--o{ SCENARIO_RUNS : linked_to

    PHONES ||--o{ CONTACTS : belongs_to

```
