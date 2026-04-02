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

## Database ER Diagram

```mermaid
erDiagram

AGENT_HOSTS ||--o{ AGENT_EVENTS : emits
AGENT_HOSTS ||--o{ PHONES : hosts
AGENT_HOSTS ||--o{ PHONE_PROVISIONING_EVENTS : handles

PHONES ||--o{ CONTACTS : has
PHONES ||--o{ SCENARIOS : owns
PHONES ||--o{ SCENARIO_RUNS : runs_on
PHONES ||--o{ SCHEDULES : schedules
PHONES ||--o{ CALLS : makes
PHONES ||--o{ PHONE_PROVISIONING_EVENTS : provisioning

CONTACTS ||--o{ SCENARIOS : target
CONTACTS ||--o{ SCHEDULES : for_contact
CONTACTS ||--o{ CALLS : with

SCENARIOS ||--o{ SCENARIO_RUNS : runs
SCENARIOS ||--o{ SCHEDULES : triggers
SCENARIOS ||--o{ CALLS : uses

CALLS ||--o{ MESSAGES : contains
```
