| table_name                | column_name       | data_type                   |
| ------------------------- | ----------------- | --------------------------- |
| agent_events              | id                | uuid                        |
| agent_events              | agent_host_id     | uuid                        |
| agent_events              | event_type        | character varying           |
| agent_events              | event_data        | jsonb                       |
| agent_events              | created_at        | timestamp with time zone    |
| agent_hosts               | id                | uuid                        |
| agent_hosts               | host_name         | character varying           |
| agent_hosts               | ip_address        | character varying           |
| agent_hosts               | external_ip       | character varying           |
| agent_hosts               | status            | character varying           |
| agent_hosts               | last_heartbeat    | timestamp with time zone    |
| agent_hosts               | max_containers    | integer                     |
| agent_hosts               | port_range_start  | integer                     |
| agent_hosts               | port_range_end    | integer                     |
| agent_hosts               | created_at        | timestamp with time zone    |
| agent_hosts               | updated_at        | timestamp with time zone    |
| calls                     | id                | uuid                        |
| calls                     | phone_id          | uuid                        |
| calls                     | contact_id        | uuid                        |
| calls                     | scenario_id       | uuid                        |
| calls                     | status            | text                        |
| calls                     | started_at        | timestamp without time zone |
| calls                     | ended_at          | timestamp without time zone |
| calls                     | created_at        | timestamp without time zone |
| contacts                  | id                | uuid                        |
| contacts                  | phone_id          | uuid                        |
| contacts                  | lid               | text                        |
| contacts                  | number            | text                        |
| contacts                  | name              | text                        |
| contacts                  | email             | text                        |
| contacts                  | avatar            | text                        |
| contacts                  | tag               | text                        |
| contacts                  | is_bot            | boolean                     |
| contacts                  | created_at        | timestamp without time zone |
| messages                  | id                | uuid                        |
| messages                  | call_id           | uuid                        |
| messages                  | topic             | text                        |
| messages                  | sender            | text                        |
| messages                  | extension         | text                        |
| messages                  | content           | jsonb                       |
| messages                  | status            | text                        |
| messages                  | payload           | jsonb                       |
| messages                  | sent_at           | timestamp without time zone |
| messages                  | event             | text                        |
| messages                  | private           | boolean                     |
| messages                  | updated_at        | timestamp without time zone |
| messages                  | inserted_at       | timestamp without time zone |
| messages                  | id                | uuid                        |
| phone_provisioning_events | id                | uuid                        |
| phone_provisioning_events | phone_id          | uuid                        |
| phone_provisioning_events | agent_host_id     | uuid                        |
| phone_provisioning_events | status            | character varying           |
| phone_provisioning_events | event_data        | jsonb                       |
| phone_provisioning_events | created_at        | timestamp with time zone    |
| phones                    | id                | uuid                        |
| phones                    | user_id           | uuid                        |
| phones                    | number            | text                        |
| phones                    | label             | text                        |
| phones                    | color             | text                        |
| phones                    | status            | text                        |
| phones                    | docker_url        | text                        |
| phones                    | docker_status     | text                        |
| phones                    | created_at        | timestamp without time zone |
| phones                    | host_id           | uuid                        |
| phones                    | container_id      | character varying           |
| phones                    | container_name    | character varying           |
| phones                    | api_port          | integer                     |
| phones                    | ws_port           | integer                     |
| phones                    | last_health_check | timestamp with time zone    |
| phones                    | error_message     | text                        |
| scenario_runs             | id                | uuid                        |
| scenario_runs             | scenario_id       | uuid                        |
| scenario_runs             | phone_id          | uuid                        |
| scenario_runs             | status            | text                        |
| scenario_runs             | started_at        | timestamp without time zone |
| scenario_runs             | ended_at          | timestamp without time zone |
| scenario_runs             | created_at        | timestamp without time zone |
| scenarios                 | id                | uuid                        |
| scenarios                 | phone_id          | uuid                        |
| scenarios                 | contact_id        | uuid                        |
| scenarios                 | name              | text                        |
| scenarios                 | status            | text                        |
| scenarios                 | config            | jsonb                       |
| scenarios                 | created_at        | timestamp without time zone |
| schedules                 | id                | uuid                        |
| schedules                 | phone_id          | uuid                        |
| schedules                 | contact_id        | uuid                        |
| schedules                 | scenario_id       | uuid                        |
| schedules                 | schedule_name     | text                        |
| schedules                 | schedule_type     | text                        |
| schedules                 | status            | text                        |
| schedules                 | run_at            | timestamp without time zone |
| schedules                 | cron_expr         | text                        |
| schedules                 | interval_min      | integer                     |
| schedules                 | last_run          | timestamp without time zone |
| schedules                 | next_run          | timestamp without time zone |
| schedules                 | created_at        | timestamp without time zone |
| users                     | instance_id       | uuid                        |
| users                     | id                | uuid                        |
| users                     | id                | uuid                        |
