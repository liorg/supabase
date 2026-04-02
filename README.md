erDiagram
    users ||--|{ phones : "יחיד"
    phones ||--|{ contacts : "יחיד"
    phones ||--|{ scenarios : "יחיד"

    scenarios ||--|{ calls : "יחיד"
    contacts ||--o{ calls : "רבים"
    phones ||--o{ calls : "רבים"

    calls ||--|{ messages : "יחיד"

    phones ||--|{ schedules : "יחיד"
    contacts ||--o{ schedules : "רבים" 
    scenarios ||--o{ schedules : "רבים"

    hosts ||--|{ phones : "יחיד"

    phones ||--o{ container_events : "רבים"
    hosts ||--o{ container_events : "רבים"# supabase
supabase
