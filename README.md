erDiagram
    users {
        uuid id PK
        uuid instance_id
        text email
        character_varying aud
        text name
        text google_id
        character_varying role
        text avatar
        character_varying email
        timestamp_without_time_zone last_login
        character_varying encrypted_password
        timestamp_with_time_zone email_confirmed_at
        timestamp_without_time_zone created_at
        text lang
    }

    phones {
        uuid id PK
        uuid user_id FK
        text number
        text label
        text color
        text status
        text docker_url
        text docker_status
        timestamp_without_time_zone created_at
        uuid host_id FK
        character_varying container_id
        character_varying container_name
        integer api_port
        integer ws_port
        timestamp_with_time_zone last_health_check
        text error_message
    }

    contacts {
        uuid id PK
        uuid phone_id FK
        text lid
        text number
        text name
        text email
        text avatar
        text tag
        boolean is_bot
        timestamp_without_time_zone created_at
    }

    scenarios {
        uuid id PK
        uuid phone_id FK
        uuid contact_id FK
        text name
        text status
        jsonb config
        timestamp_without_time_zone created_at
    }

    calls {
        uuid id PK
        uuid phone_id FK
        uuid contact_id FK
        uuid scenario_id FK
        text status
        timestamp_without_time_zone started_at
        timestamp_without_time_zone ended_at
        timestamp_without_time_zone created_at
    }

    messages {
        uuid id PK
        uuid call_id FK
        text sender
        text topic
        jsonb content
        text extension
        text status
        jsonb payload
        text event
        timestamp_without_time_zone sent_at
        boolean private
        timestamp_without_time_zone updated_at
        timestamp_without_time_zone inserted_at
    }

    schedules {
        uuid id PK
        uuid phone_id FK
        uuid contact_id FK
        uuid scenario_id FK
        text schedule_name
        text schedule_type
        text status
        timestamp_without_time_zone run_at
        text cron_expr
        integer interval_min
        timestamp_without_time_zone last_run
        timestamp_without_time_zone next_run 
        timestamp_without_time_zone created_at
    }

    hosts {
        uuid id PK
        character_varying host_name
        character_varying ip_address
        character_varying external_ip  
        character_varying status
        timestamp_with_time_zone last_heartbeat
        integer max_containers
        integer port_range_start
        integer port_range_end
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }

    container_events {
        uuid id PK
        uuid phone_id FK
        uuid host_id FK 
        character_varying event_type
        jsonb event_data
        timestamp_with_time_zone created_at
    }

    users ||--|{ phones : "יחיד-לרבים"
    phones ||--|{ contacts : "יחיד-לרבים"
    phones ||--|{ scenarios : "יחיד-לרבים"

    scenarios ||--|{ calls : "יחיד-לרבים"
    contacts ||--o{ calls : "רבים-לרבים"
    phones ||--o{ calls : "רבים-לרבים"

    calls ||--|{ messages : "יחיד-לרבים"

    phones ||--|{ schedules : "יחיד-לרבים"
    contacts ||--o{ schedules : "רבים-לרבים" 
    scenarios ||--o{ schedules : "רבים-לרבים"

    hosts ||--|{ phones : "יחיד-לרבים"

    phones ||--o{ container_events : "רבים-לרבים"
    hosts ||--o{ container_events : "רבים-לרבים"
