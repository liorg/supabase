create type factor_type as enum ('totp', 'webauthn', 'phone');

alter type factor_type owner to supabase_auth_admin;

create type factor_status as enum ('unverified', 'verified');

alter type factor_status owner to supabase_auth_admin;

create type aal_level as enum ('aal1', 'aal2', 'aal3');

alter type aal_level owner to supabase_auth_admin;

create type code_challenge_method as enum ('s256', 'plain');

alter type code_challenge_method owner to supabase_auth_admin;

create type one_time_token_type as enum ('confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token');

alter type one_time_token_type owner to supabase_auth_admin;

create type oauth_registration_type as enum ('dynamic', 'manual');

alter type oauth_registration_type owner to supabase_auth_admin;

create type oauth_authorization_status as enum ('pending', 'approved', 'denied', 'expired');

alter type oauth_authorization_status owner to supabase_auth_admin;

create type oauth_response_type as enum ('code');

alter type oauth_response_type owner to supabase_auth_admin;

create type oauth_client_type as enum ('public', 'confidential');

alter type oauth_client_type owner to supabase_auth_admin;

create table users
(
    instance_id                 uuid,
    id                          uuid                       not null
        primary key,
    aud                         varchar(255),
    role                        varchar(255),
    email                       varchar(255),
    encrypted_password          varchar(255),
    email_confirmed_at          timestamp with time zone,
    invited_at                  timestamp with time zone,
    confirmation_token          varchar(255),
    confirmation_sent_at        timestamp with time zone,
    recovery_token              varchar(255),
    recovery_sent_at            timestamp with time zone,
    email_change_token_new      varchar(255),
    email_change                varchar(255),
    email_change_sent_at        timestamp with time zone,
    last_sign_in_at             timestamp with time zone,
    raw_app_meta_data           jsonb,
    raw_user_meta_data          jsonb,
    is_super_admin              boolean,
    created_at                  timestamp with time zone,
    updated_at                  timestamp with time zone,
    phone                       text         default NULL::character varying
        unique,
    phone_confirmed_at          timestamp with time zone,
    phone_change                text         default ''::character varying,
    phone_change_token          varchar(255) default ''::character varying,
    phone_change_sent_at        timestamp with time zone,
    confirmed_at                timestamp with time zone generated always as (LEAST(email_confirmed_at, phone_confirmed_at)) stored,
    email_change_token_current  varchar(255) default ''::character varying,
    email_change_confirm_status smallint     default 0
        constraint users_email_change_confirm_status_check
            check ((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)),
    banned_until                timestamp with time zone,
    reauthentication_token      varchar(255) default ''::character varying,
    reauthentication_sent_at    timestamp with time zone,
    is_sso_user                 boolean      default false not null,
    deleted_at                  timestamp with time zone,
    is_anonymous                boolean      default false not null
);

comment on table users is 'Auth: Stores user login data within a secure schema.';

comment on column users.is_sso_user is 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';

alter table users
    owner to supabase_auth_admin;

create index users_instance_id_idx
    on users (instance_id);

create index users_instance_id_email_idx
    on users (instance_id, lower(email::text));

create unique index confirmation_token_idx
    on users (confirmation_token)
    where ((confirmation_token)::text !~ '^[0-9 ]*$'::text);

create unique index recovery_token_idx
    on users (recovery_token)
    where ((recovery_token)::text !~ '^[0-9 ]*$'::text);

create unique index email_change_token_current_idx
    on users (email_change_token_current)
    where ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);

create unique index email_change_token_new_idx
    on users (email_change_token_new)
    where ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);

create unique index reauthentication_token_idx
    on users (reauthentication_token)
    where ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);

create unique index users_email_partial_key
    on users (email)
    where (is_sso_user = false);

comment on index users_email_partial_key is 'Auth: A partial unique index that applies only when is_sso_user is false';

create index users_is_anonymous_idx
    on users (is_anonymous);

grant delete, insert, references, trigger, truncate, update on users to postgres;

grant select on users to postgres with grant option;

grant delete, insert, references, select, trigger, truncate, update on users to dashboard_user;

create table instances
(
    id              uuid not null
        primary key,
    uuid            uuid,
    raw_base_config text,
    created_at      timestamp with time zone,
    updated_at      timestamp with time zone
);

comment on table instances is 'Auth: Manages users across multiple sites.';

alter table instances
    owner to supabase_auth_admin;

grant delete, insert, references, trigger, truncate, update on instances to postgres;

grant select on instances to postgres with grant option;

grant delete, insert, references, select, trigger, truncate, update on instances to dashboard_user;

create table audit_log_entries
(
    instance_id uuid,
    id          uuid                                      not null
        primary key,
    payload     json,
    created_at  timestamp with time zone,
    ip_address  varchar(64) default ''::character varying not null
);

comment on table audit_log_entries is 'Auth: Audit trail for user actions.';

alter table audit_log_entries
    owner to supabase_auth_admin;

create index audit_logs_instance_id_idx
    on audit_log_entries (instance_id);

grant delete, insert, references, trigger, truncate, update on audit_log_entries to postgres;

grant select on audit_log_entries to postgres with grant option;

grant delete, insert, references, select, trigger, truncate, update on audit_log_entries to dashboard_user;

create table schema_migrations
(
    version varchar(255) not null
        primary key
);

comment on table schema_migrations is 'Auth: Manages updates to the auth system.';

alter table schema_migrations
    owner to supabase_auth_admin;

grant select on schema_migrations to postgres with grant option;

create table identities
(
    provider_id     text                           not null,
    user_id         uuid                           not null
        references users
            on delete cascade,
    identity_data   jsonb                          not null,
    provider        text                           not null,
    last_sign_in_at timestamp with time zone,
    created_at      timestamp with time zone,
    updated_at      timestamp with time zone,
    email           text generated always as (lower((identity_data ->> 'email'::text))) stored,
    id              uuid default gen_random_uuid() not null
        primary key,
    constraint identities_provider_id_provider_unique
        unique (provider_id, provider)
);

comment on table identities is 'Auth: Stores identities associated to a user.';

comment on column identities.email is 'Auth: Email is a generated column that references the optional email property in the identity_data';

alter table identities
    owner to supabase_auth_admin;

create index identities_user_id_idx
    on identities (user_id);

create index identities_email_idx
    on identities (email text_pattern_ops);

comment on index identities_email_idx is 'Auth: Ensures indexed queries on the email column';

grant delete, insert, references, trigger, truncate, update on identities to postgres;

grant select on identities to postgres with grant option;

grant delete, insert, references, select, trigger, truncate, update on identities to dashboard_user;

create table mfa_factors
(
    id                           uuid                     not null
        primary key,
    user_id                      uuid                     not null
        references users
            on delete cascade,
    friendly_name                text,
    factor_type                  auth.factor_type         not null,
    status                       auth.factor_status       not null,
    created_at                   timestamp with time zone not null,
    updated_at                   timestamp with time zone not null,
    secret                       text,
    phone                        text,
    last_challenged_at           timestamp with time zone
        unique,
    web_authn_credential         jsonb,
    web_authn_aaguid             uuid,
    last_webauthn_challenge_data jsonb
);

comment on table mfa_factors is 'auth: stores metadata about factors';

comment on column mfa_factors.last_webauthn_challenge_data is 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';

alter table mfa_factors
    owner to supabase_auth_admin;

create unique index mfa_factors_user_friendly_name_unique
    on mfa_factors (friendly_name, user_id)
    where (TRIM(BOTH FROM friendly_name) <> ''::text);

create index factor_id_created_at_idx
    on mfa_factors (user_id, created_at);

create index mfa_factors_user_id_idx
    on mfa_factors (user_id);

create unique index unique_phone_factor_per_user
    on mfa_factors (user_id, phone);

grant delete, insert, references, trigger, truncate, update on mfa_factors to postgres;

grant select on mfa_factors to postgres with grant option;

grant delete, insert, references, select, trigger, truncate, update on mfa_factors to dashboard_user;

create table mfa_challenges
(
    id                     uuid                     not null
        primary key,
    factor_id              uuid                     not null
        constraint mfa_challenges_auth_factor_id_fkey
            references mfa_factors
            on delete cascade,
    created_at             timestamp with time zone not null,
    verified_at            timestamp with time zone,
    ip_address             inet                     not null,
    otp_code               text,
    web_authn_session_data jsonb
);

comment on table mfa_challenges is 'auth: stores metadata about challenge requests made';

alter table mfa_challenges
    owner to supabase_auth_admin;

create index mfa_challenge_created_at_idx
    on mfa_challenges (created_at desc);

grant delete, insert, references, trigger, truncate, update on mfa_challenges to postgres;

grant select on mfa_challenges to postgres with grant option;

grant delete, insert, references, select, trigger, truncate, update on mfa_challenges to dashboard_user;

create table sso_providers
(
    id          uuid not null
        primary key,
    resource_id text
        constraint "resource_id not empty"
            check ((resource_id = NULL::text) OR (char_length(resource_id) > 0)),
    created_at  timestamp with time zone,
    updated_at  timestamp with time zone,
    disabled    boolean
);

comment on table sso_providers is 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';

comment on column sso_providers.resource_id is 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';

alter table sso_providers
    owner to supabase_auth_admin;

create unique index sso_providers_resource_id_idx
    on sso_providers (lower(resource_id));

create index sso_providers_resource_id_pattern_idx
    on sso_providers (resource_id text_pattern_ops);

grant delete, insert, references, trigger, truncate, update on sso_providers to postgres;

grant select on sso_providers to postgres with grant option;

grant delete, insert, references, select, trigger, truncate, update on sso_providers to dashboard_user;

create table sso_domains
(
    id              uuid not null
        primary key,
    sso_provider_id uuid not null
        references sso_providers
            on delete cascade,
    domain          text not null
        constraint "domain not empty"
            check (char_length(domain) > 0),
    created_at      timestamp with time zone,
    updated_at      timestamp with time zone
);

comment on table sso_domains is 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';

alter table sso_domains
    owner to supabase_auth_admin;

create index sso_domains_sso_provider_id_idx
    on sso_domains (sso_provider_id);

create unique index sso_domains_domain_idx
    on sso_domains (lower(domain));

grant delete, insert, references, trigger, truncate, update on sso_domains to postgres;

grant select on sso_domains to postgres with grant option;

grant delete, insert, references, select, trigger, truncate, update on sso_domains to dashboard_user;

create table saml_providers
(
    id                uuid not null
        primary key,
    sso_provider_id   uuid not null
        references sso_providers
            on delete cascade,
    entity_id         text not null
        unique
        constraint "entity_id not empty"
            check (char_length(entity_id) > 0),
    metadata_xml      text not null
        constraint "metadata_xml not empty"
            check (char_length(metadata_xml) > 0),
    metadata_url      text
        constraint "metadata_url not empty"
            check ((metadata_url = NULL::text) OR (char_length(metadata_url) > 0)),
    attribute_mapping jsonb,
    created_at        timestamp with time zone,
    updated_at        timestamp with time zone,
    name_id_format    text
);

comment on table saml_providers is 'Auth: Manages SAML Identity Provider connections.';

alter table saml_providers
    owner to supabase_auth_admin;

create index saml_providers_sso_provider_id_idx
    on saml_providers (sso_provider_id);

grant delete, insert, references, trigger, truncate, update on saml_providers to postgres;

grant select on saml_providers to postgres with grant option;

grant delete, insert, references, select, trigger, truncate, update on saml_providers to dashboard_user;

create table flow_state
(
    id                     uuid                  not null
        primary key,
    user_id                uuid,
    auth_code              text,
    code_challenge_method  auth.code_challenge_method,
    code_challenge         text,
    provider_type          text                  not null,
    provider_access_token  text,
    provider_refresh_token text,
    created_at             timestamp with time zone,
    updated_at             timestamp with time zone,
    authentication_method  text                  not null,
    auth_code_issued_at    timestamp with time zone,
    invite_token           text,
    referrer               text,
    oauth_client_state_id  uuid,
    linking_target_id      uuid,
    email_optional         boolean default false not null
);

comment on table flow_state is 'Stores metadata for all OAuth/SSO login flows';

alter table flow_state
    owner to supabase_auth_admin;

create table saml_relay_states
(
    id              uuid not null
        primary key,
    sso_provider_id uuid not null
        references sso_providers
            on delete cascade,
    request_id      text not null
        constraint "request_id not empty"
            check (char_length(request_id) > 0),
    for_email       text,
    redirect_to     text,
    created_at      timestamp with time zone,
    updated_at      timestamp with time zone,
    flow_state_id   uuid
        references flow_state
            on delete cascade
);

comment on table saml_relay_states is 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';

alter table saml_relay_states
    owner to supabase_auth_admin;

create index saml_relay_states_sso_provider_id_idx
    on saml_relay_states (sso_provider_id);

create index saml_relay_states_for_email_idx
    on saml_relay_states (for_email);

create index saml_relay_states_created_at_idx
    on saml_relay_states (created_at desc);

grant delete, insert, references, trigger, truncate, update on saml_relay_states to postgres;

grant select on saml_relay_states to postgres with grant option;

grant delete, insert, references, select, trigger, truncate, update on saml_relay_states to dashboard_user;

create index idx_auth_code
    on flow_state (auth_code);

create index idx_user_id_auth_method
    on flow_state (user_id, authentication_method);

create index flow_state_created_at_idx
    on flow_state (created_at desc);

grant delete, insert, references, trigger, truncate, update on flow_state to postgres;

grant select on flow_state to postgres with grant option;

grant delete, insert, references, select, trigger, truncate, update on flow_state to dashboard_user;

create table one_time_tokens
(
    id         uuid                     not null
        primary key,
    user_id    uuid                     not null
        references users
            on delete cascade,
    token_type auth.one_time_token_type not null,
    token_hash text                     not null
        constraint one_time_tokens_token_hash_check
            check (char_length(token_hash) > 0),
    relates_to text                     not null,
    created_at timestamp default now()  not null,
    updated_at timestamp default now()  not null
);

alter table one_time_tokens
    owner to supabase_auth_admin;

create index one_time_tokens_token_hash_hash_idx
    on one_time_tokens using hash (token_hash);

create index one_time_tokens_relates_to_hash_idx
    on one_time_tokens using hash (relates_to);

create unique index one_time_tokens_user_id_token_type_key
    on one_time_tokens (user_id, token_type);

grant delete, insert, references, trigger, truncate, update on one_time_tokens to postgres;

grant select on one_time_tokens to postgres with grant option;

grant delete, insert, references, select, trigger, truncate, update on one_time_tokens to dashboard_user;

create table oauth_clients
(
    id                         uuid                                                                    not null
        primary key,
    client_secret_hash         text,
    registration_type          auth.oauth_registration_type                                            not null,
    redirect_uris              text                                                                    not null,
    grant_types                text                                                                    not null,
    client_name                text
        constraint oauth_clients_client_name_length
            check (char_length(client_name) <= 1024),
    client_uri                 text
        constraint oauth_clients_client_uri_length
            check (char_length(client_uri) <= 2048),
    logo_uri                   text
        constraint oauth_clients_logo_uri_length
            check (char_length(logo_uri) <= 2048),
    created_at                 timestamp with time zone default now()                                  not null,
    updated_at                 timestamp with time zone default now()                                  not null,
    deleted_at                 timestamp with time zone,
    client_type                auth.oauth_client_type   default 'confidential'::auth.oauth_client_type not null,
    token_endpoint_auth_method text                                                                    not null
        constraint oauth_clients_token_endpoint_auth_method_check
            check (token_endpoint_auth_method = ANY
                   (ARRAY ['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text]))
);

alter table oauth_clients
    owner to supabase_auth_admin;

create table sessions
(
    id                     uuid not null
        primary key,
    user_id                uuid not null
        references users
            on delete cascade,
    created_at             timestamp with time zone,
    updated_at             timestamp with time zone,
    factor_id              uuid,
    aal                    auth.aal_level,
    not_after              timestamp with time zone,
    refreshed_at           timestamp,
    user_agent             text,
    ip                     inet,
    tag                    text,
    oauth_client_id        uuid
        references oauth_clients
            on delete cascade,
    refresh_token_hmac_key text,
    refresh_token_counter  bigint,
    scopes                 text
        constraint sessions_scopes_length
            check (char_length(scopes) <= 4096)
);

comment on table sessions is 'Auth: Stores session data associated to a user.';

comment on column sessions.not_after is 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';

comment on column sessions.refresh_token_hmac_key is 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';

comment on column sessions.refresh_token_counter is 'Holds the ID (counter) of the last issued refresh token.';

alter table sessions
    owner to supabase_auth_admin;

create table refresh_tokens
(
    instance_id uuid,
    id          bigserial
        primary key,
    token       varchar(255)
        constraint refresh_tokens_token_unique
            unique,
    user_id     varchar(255),
    revoked     boolean,
    created_at  timestamp with time zone,
    updated_at  timestamp with time zone,
    parent      varchar(255),
    session_id  uuid
        references sessions
            on delete cascade
);

comment on table refresh_tokens is 'Auth: Store of tokens used to refresh JWT tokens once they expire.';

alter table refresh_tokens
    owner to supabase_auth_admin;

grant select, update, usage on sequence refresh_tokens_id_seq to postgres;

grant select, update, usage on sequence refresh_tokens_id_seq to dashboard_user;

create index refresh_tokens_instance_id_idx
    on refresh_tokens (instance_id);

create index refresh_tokens_instance_id_user_id_idx
    on refresh_tokens (instance_id, user_id);

create index refresh_tokens_parent_idx
    on refresh_tokens (parent);

create index refresh_tokens_session_id_revoked_idx
    on refresh_tokens (session_id, revoked);

create index refresh_tokens_updated_at_idx
    on refresh_tokens (updated_at desc);

grant delete, insert, references, trigger, truncate, update on refresh_tokens to postgres;

grant select on refresh_tokens to postgres with grant option;

grant delete, insert, references, select, trigger, truncate, update on refresh_tokens to dashboard_user;

create index user_id_created_at_idx
    on sessions (user_id, created_at);

create index sessions_user_id_idx
    on sessions (user_id);

create index sessions_not_after_idx
    on sessions (not_after desc);

create index sessions_oauth_client_id_idx
    on sessions (oauth_client_id);

grant delete, insert, references, trigger, truncate, update on sessions to postgres;

grant select on sessions to postgres with grant option;

grant delete, insert, references, select, trigger, truncate, update on sessions to dashboard_user;

create table mfa_amr_claims
(
    session_id            uuid                     not null
        references sessions
            on delete cascade,
    created_at            timestamp with time zone not null,
    updated_at            timestamp with time zone not null,
    authentication_method text                     not null,
    id                    uuid                     not null
        constraint amr_id_pk
            primary key,
    constraint mfa_amr_claims_session_id_authentication_method_pkey
        unique (session_id, authentication_method)
);

comment on table mfa_amr_claims is 'auth: stores authenticator method reference claims for multi factor authentication';

alter table mfa_amr_claims
    owner to supabase_auth_admin;

grant delete, insert, references, trigger, truncate, update on mfa_amr_claims to postgres;

grant select on mfa_amr_claims to postgres with grant option;

grant delete, insert, references, select, trigger, truncate, update on mfa_amr_claims to dashboard_user;

create index oauth_clients_deleted_at_idx
    on oauth_clients (deleted_at);

grant delete, insert, references, select, trigger, truncate, update on oauth_clients to postgres;

grant delete, insert, references, select, trigger, truncate, update on oauth_clients to dashboard_user;

create table oauth_authorizations
(
    id                    uuid                                                                               not null
        primary key,
    authorization_id      text                                                                               not null
        unique,
    client_id             uuid                                                                               not null
        references oauth_clients
            on delete cascade,
    user_id               uuid
        references users
            on delete cascade,
    redirect_uri          text                                                                               not null
        constraint oauth_authorizations_redirect_uri_length
            check (char_length(redirect_uri) <= 2048),
    scope                 text                                                                               not null
        constraint oauth_authorizations_scope_length
            check (char_length(scope) <= 4096),
    state                 text
        constraint oauth_authorizations_state_length
            check (char_length(state) <= 4096),
    resource              text
        constraint oauth_authorizations_resource_length
            check (char_length(resource) <= 2048),
    code_challenge        text
        constraint oauth_authorizations_code_challenge_length
            check (char_length(code_challenge) <= 128),
    code_challenge_method auth.code_challenge_method,
    response_type         auth.oauth_response_type        default 'code'::auth.oauth_response_type           not null,
    status                auth.oauth_authorization_status default 'pending'::auth.oauth_authorization_status not null,
    authorization_code    text
        unique
        constraint oauth_authorizations_authorization_code_length
            check (char_length(authorization_code) <= 255),
    created_at            timestamp with time zone        default now()                                      not null,
    expires_at            timestamp with time zone        default (now() + '00:03:00'::interval)             not null,
    approved_at           timestamp with time zone,
    nonce                 text
        constraint oauth_authorizations_nonce_length
            check (char_length(nonce) <= 255),
    constraint oauth_authorizations_expires_at_future
        check (expires_at > created_at)
);

alter table oauth_authorizations
    owner to supabase_auth_admin;

create index oauth_auth_pending_exp_idx
    on oauth_authorizations (expires_at)
    where (status = 'pending'::auth.oauth_authorization_status);

grant delete, insert, references, select, trigger, truncate, update on oauth_authorizations to postgres;

grant delete, insert, references, select, trigger, truncate, update on oauth_authorizations to dashboard_user;

create table oauth_consents
(
    id         uuid                                   not null
        primary key,
    user_id    uuid                                   not null
        references users
            on delete cascade,
    client_id  uuid                                   not null
        references oauth_clients
            on delete cascade,
    scopes     text                                   not null
        constraint oauth_consents_scopes_length
            check (char_length(scopes) <= 2048)
        constraint oauth_consents_scopes_not_empty
            check (char_length(TRIM(BOTH FROM scopes)) > 0),
    granted_at timestamp with time zone default now() not null,
    revoked_at timestamp with time zone,
    constraint oauth_consents_user_client_unique
        unique (user_id, client_id),
    constraint oauth_consents_revoked_after_granted
        check ((revoked_at IS NULL) OR (revoked_at >= granted_at))
);

alter table oauth_consents
    owner to supabase_auth_admin;

create index oauth_consents_active_user_client_idx
    on oauth_consents (user_id, client_id)
    where (revoked_at IS NULL);

create index oauth_consents_user_order_idx
    on oauth_consents (user_id asc, granted_at desc);

create index oauth_consents_active_client_idx
    on oauth_consents (client_id)
    where (revoked_at IS NULL);

grant delete, insert, references, select, trigger, truncate, update on oauth_consents to postgres;

grant delete, insert, references, select, trigger, truncate, update on oauth_consents to dashboard_user;

create table oauth_client_states
(
    id            uuid                     not null
        primary key,
    provider_type text                     not null,
    code_verifier text,
    created_at    timestamp with time zone not null
);

comment on table oauth_client_states is 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';

alter table oauth_client_states
    owner to supabase_auth_admin;

create index idx_oauth_client_states_created_at
    on oauth_client_states (created_at);

grant delete, insert, references, select, trigger, truncate, update on oauth_client_states to postgres;

grant delete, insert, references, select, trigger, truncate, update on oauth_client_states to dashboard_user;

create table custom_oauth_providers
(
    id                    uuid                     default gen_random_uuid() not null
        primary key,
    provider_type         text                                               not null
        constraint custom_oauth_providers_provider_type_check
            check (provider_type = ANY (ARRAY ['oauth2'::text, 'oidc'::text])),
    identifier            text                                               not null
        unique
        constraint custom_oauth_providers_identifier_format
            check (identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text),
    name                  text                                               not null
        constraint custom_oauth_providers_name_length
            check ((char_length(name) >= 1) AND (char_length(name) <= 100)),
    client_id             text                                               not null
        constraint custom_oauth_providers_client_id_length
            check ((char_length(client_id) >= 1) AND (char_length(client_id) <= 512)),
    client_secret         text                                               not null,
    acceptable_client_ids text[]                   default '{}'::text[]      not null,
    scopes                text[]                   default '{}'::text[]      not null,
    pkce_enabled          boolean                  default true              not null,
    attribute_mapping     jsonb                    default '{}'::jsonb       not null,
    authorization_params  jsonb                    default '{}'::jsonb       not null,
    enabled               boolean                  default true              not null,
    email_optional        boolean                  default false             not null,
    issuer                text
        constraint custom_oauth_providers_issuer_length
            check ((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048))),
    discovery_url         text
        constraint custom_oauth_providers_discovery_url_length
            check ((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048)),
    skip_nonce_check      boolean                  default false             not null,
    cached_discovery      jsonb,
    discovery_cached_at   timestamp with time zone,
    authorization_url     text
        constraint custom_oauth_providers_authorization_url_https
            check ((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))
        constraint custom_oauth_providers_authorization_url_length
            check ((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048)),
    token_url             text
        constraint custom_oauth_providers_token_url_https
            check ((token_url IS NULL) OR (token_url ~~ 'https://%'::text))
        constraint custom_oauth_providers_token_url_length
            check ((token_url IS NULL) OR (char_length(token_url) <= 2048)),
    userinfo_url          text
        constraint custom_oauth_providers_userinfo_url_https
            check ((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))
        constraint custom_oauth_providers_userinfo_url_length
            check ((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)),
    jwks_uri              text
        constraint custom_oauth_providers_jwks_uri_https
            check ((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))
        constraint custom_oauth_providers_jwks_uri_length
            check ((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048)),
    created_at            timestamp with time zone default now()             not null,
    updated_at            timestamp with time zone default now()             not null,
    constraint custom_oauth_providers_oidc_requires_issuer
        check ((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL)),
    constraint custom_oauth_providers_oidc_issuer_https
        check ((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text)),
    constraint custom_oauth_providers_oidc_discovery_url_https
        check ((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text)),
    constraint custom_oauth_providers_oauth2_requires_endpoints
        check ((provider_type <> 'oauth2'::text) OR
               ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))
);

alter table custom_oauth_providers
    owner to supabase_auth_admin;

create index custom_oauth_providers_identifier_idx
    on custom_oauth_providers (identifier);

create index custom_oauth_providers_provider_type_idx
    on custom_oauth_providers (provider_type);

create index custom_oauth_providers_enabled_idx
    on custom_oauth_providers (enabled);

create index custom_oauth_providers_created_at_idx
    on custom_oauth_providers (created_at);

grant delete, insert, references, select, trigger, truncate, update on custom_oauth_providers to postgres;

grant delete, insert, references, select, trigger, truncate, update on custom_oauth_providers to dashboard_user;

create table webauthn_credentials
(
    id               uuid                     default gen_random_uuid() not null
        primary key,
    user_id          uuid                                               not null
        references users
            on delete cascade,
    credential_id    bytea                                              not null,
    public_key       bytea                                              not null,
    attestation_type text                     default ''::text          not null,
    aaguid           uuid,
    sign_count       bigint                   default 0                 not null,
    transports       jsonb                    default '[]'::jsonb       not null,
    backup_eligible  boolean                  default false             not null,
    backed_up        boolean                  default false             not null,
    friendly_name    text                     default ''::text          not null,
    created_at       timestamp with time zone default now()             not null,
    updated_at       timestamp with time zone default now()             not null,
    last_used_at     timestamp with time zone
);

alter table webauthn_credentials
    owner to supabase_auth_admin;

create unique index webauthn_credentials_credential_id_key
    on webauthn_credentials (credential_id);

create index webauthn_credentials_user_id_idx
    on webauthn_credentials (user_id);

grant delete, insert, references, select, trigger, truncate, update on webauthn_credentials to postgres;

grant delete, insert, references, select, trigger, truncate, update on webauthn_credentials to dashboard_user;

create table webauthn_challenges
(
    id             uuid                     default gen_random_uuid() not null
        primary key,
    user_id        uuid
        references users
            on delete cascade,
    challenge_type text                                               not null
        constraint webauthn_challenges_challenge_type_check
            check (challenge_type = ANY (ARRAY ['signup'::text, 'registration'::text, 'authentication'::text])),
    session_data   jsonb                                              not null,
    created_at     timestamp with time zone default now()             not null,
    expires_at     timestamp with time zone                           not null
);

alter table webauthn_challenges
    owner to supabase_auth_admin;

create index webauthn_challenges_user_id_idx
    on webauthn_challenges (user_id);

create index webauthn_challenges_expires_at_idx
    on webauthn_challenges (expires_at);

grant delete, insert, references, select, trigger, truncate, update on webauthn_challenges to postgres;

grant delete, insert, references, select, trigger, truncate, update on webauthn_challenges to dashboard_user;

create function uid() returns uuid
    stable
    language sql
as
$$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

comment on function uid() is 'Deprecated. Use auth.jwt() -> ''sub'' instead.';

alter function uid() owner to supabase_auth_admin;

grant execute on function uid() to dashboard_user;

create function role() returns text
    stable
    language sql
as
$$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

comment on function role() is 'Deprecated. Use auth.jwt() -> ''role'' instead.';

alter function role() owner to supabase_auth_admin;

grant execute on function role() to dashboard_user;

create function email() returns text
    stable
    language sql
as
$$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;

comment on function email() is 'Deprecated. Use auth.jwt() -> ''email'' instead.';

alter function email() owner to supabase_auth_admin;

grant execute on function email() to dashboard_user;

create function jwt() returns jsonb
    stable
    language sql
as
$$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;

alter function jwt() owner to supabase_auth_admin;

grant execute on function jwt() to postgres;

grant execute on function jwt() to dashboard_user;

create table users
(
    id           uuid      default gen_random_uuid() not null
        primary key,
    email        text                                not null
        unique,
    name         text,
    google_id    text,
    avatar       text,
    last_login   timestamp,
    created_at   timestamp default now(),
    lang         text      default 'he'::text,
    package_type text      default 'basic'::text,
    mobile       text,
    updated_at   timestamp default now()
);

alter table users
    owner to postgres;

create index idx_users_email
    on users (email);

create index idx_users_google_id
    on users (google_id);

grant delete, insert, references, select, trigger, truncate, update on users to anon;

grant delete, insert, references, select, trigger, truncate, update on users to authenticated;

grant delete, insert, references, select, trigger, truncate, update on users to service_role;

create table agent_hosts
(
    id               uuid                     default gen_random_uuid() not null
        constraint hosts_pkey
            primary key,
    host_name        varchar(255)                                       not null
        constraint hosts_host_name_key
            unique,
    ip_address       varchar(45)                                        not null,
    external_ip      varchar(45),
    status           varchar(20)              default 'active'::character varying,
    last_heartbeat   timestamp with time zone default now(),
    max_containers   integer                  default 50,
    port_range_start integer                  default 8001,
    port_range_end   integer                  default 8100,
    created_at       timestamp with time zone default now(),
    updated_at       timestamp with time zone default now()
);

alter table agent_hosts
    owner to postgres;

create table phones
(
    id                uuid      default gen_random_uuid() not null
        primary key,
    user_id           uuid
        references users
            on delete cascade,
    number            text                                not null,
    label             text,
    color             text      default '#4A90E2'::text,
    status            text      default 'active'::text,
    docker_url        text,
    docker_status     text      default 'unknown'::text,
    created_at        timestamp default now(),
    host_id           uuid
        references agent_hosts,
    container_id      varchar(100),
    container_name    varchar(100),
    api_port          integer,
    ws_port           integer,
    last_health_check timestamp with time zone,
    error_message     text,
    unique (user_id, number)
);

alter table phones
    owner to postgres;

create index phones_user_id_idx
    on phones (user_id);

create index idx_phones_host
    on phones (host_id);

create index idx_phones_docker_status
    on phones (docker_status);

grant delete, insert, references, select, trigger, truncate, update on phones to anon;

grant delete, insert, references, select, trigger, truncate, update on phones to authenticated;

grant delete, insert, references, select, trigger, truncate, update on phones to service_role;

create table contacts
(
    id         uuid      default gen_random_uuid() not null
        primary key,
    phone_id   uuid
        references phones
            on delete cascade,
    lid        text,
    number     text                                not null,
    name       text,
    email      text,
    avatar     text,
    tag        text,
    is_bot     boolean   default false,
    created_at timestamp default now(),
    unique (phone_id, number)
);

alter table contacts
    owner to postgres;

create index contacts_phone_id_idx
    on contacts (phone_id);

create index contacts_is_bot_idx
    on contacts (phone_id, is_bot);

grant delete, insert, references, select, trigger, truncate, update on contacts to anon;

grant delete, insert, references, select, trigger, truncate, update on contacts to authenticated;

grant delete, insert, references, select, trigger, truncate, update on contacts to service_role;

create table scenarios
(
    id                         uuid      default gen_random_uuid() not null
        primary key,
    phone_id                   uuid
        references phones
            on delete cascade,
    contact_id                 uuid
                                                                   references contacts
                                                                       on delete set null,
    name                       text                                not null,
    status                     text      default 'draft'::text,
    config                     jsonb     default '{}'::jsonb       not null,
    created_at                 timestamp default now(),
    estimated_duration_minutes interval,
    inter_leaf_response_time   interval
);

alter table scenarios
    owner to postgres;

create index scenarios_phone_id_idx
    on scenarios (phone_id);

create index scenarios_contact_id_idx
    on scenarios (contact_id);

grant delete, insert, references, select, trigger, truncate, update on scenarios to anon;

grant delete, insert, references, select, trigger, truncate, update on scenarios to authenticated;

grant delete, insert, references, select, trigger, truncate, update on scenarios to service_role;

create table schedules
(
    id            uuid      default gen_random_uuid() not null
        primary key,
    phone_id      uuid
        references phones
            on delete cascade,
    contact_id    uuid
                                                      references contacts
                                                          on delete set null,
    scenario_id   uuid
        references scenarios
            on delete cascade,
    schedule_name text,
    schedule_type text                                not null,
    status        text      default 'ready'::text,
    run_at        timestamp,
    cron_expr     text,
    interval_min  integer,
    last_run      timestamp,
    next_run      timestamp,
    created_at    timestamp default now()
);

alter table schedules
    owner to postgres;

create index schedules_phone_id_idx
    on schedules (phone_id);

create index schedules_scenario_id_idx
    on schedules (scenario_id);

grant delete, insert, references, select, trigger, truncate, update on schedules to anon;

grant delete, insert, references, select, trigger, truncate, update on schedules to authenticated;

grant delete, insert, references, select, trigger, truncate, update on schedules to service_role;

create index idx_hosts_status
    on agent_hosts (status);

grant delete, insert, references, select, trigger, truncate, update on agent_hosts to anon;

grant delete, insert, references, select, trigger, truncate, update on agent_hosts to authenticated;

grant delete, insert, references, select, trigger, truncate, update on agent_hosts to service_role;

create table agent_events
(
    id            uuid                     default uuid_generate_v4() not null
        primary key,
    agent_host_id uuid
        references agent_hosts,
    event_type    varchar,
    event_data    jsonb,
    created_at    timestamp with time zone default now()
);

alter table agent_events
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on agent_events to anon;

grant delete, insert, references, select, trigger, truncate, update on agent_events to authenticated;

grant delete, insert, references, select, trigger, truncate, update on agent_events to service_role;

create table phone_provisioning_events
(
    id            uuid                     default uuid_generate_v4() not null
        primary key,
    phone_id      uuid
        references phones,
    agent_host_id uuid
        references agent_hosts,
    status        varchar,
    event_data    jsonb,
    created_at    timestamp with time zone default now()
);

alter table phone_provisioning_events
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on phone_provisioning_events to anon;

grant delete, insert, references, select, trigger, truncate, update on phone_provisioning_events to authenticated;

grant delete, insert, references, select, trigger, truncate, update on phone_provisioning_events to service_role;

create table call_run_statuses
(
    id                uuid    default uuid_generate_v4() not null
        primary key,
    name              text                               not null,
    description       text,
    should_close_call boolean default false              not null
);

alter table call_run_statuses
    owner to postgres;

create table calls
(
    id                     uuid      default gen_random_uuid() not null
        primary key,
    phone_id               uuid
        references phones
            on delete cascade,
    contact_id             uuid
                                                               references contacts
                                                                   on delete set null,
    scenario_id            uuid
                                                               references scenarios
                                                                   on delete set null,
    status                 text                                not null,
    started_at             timestamp,
    ended_at               timestamp,
    created_at             timestamp default now(),
    expected_end           timestamp,
    last_status_id         uuid
        references call_run_statuses,
    last_status_updated_at timestamp
);

alter table calls
    owner to postgres;

create index calls_phone_id_idx
    on calls (phone_id);

create index calls_contact_id_idx
    on calls (contact_id);

grant delete, insert, references, select, trigger, truncate, update on calls to anon;

grant delete, insert, references, select, trigger, truncate, update on calls to authenticated;

grant delete, insert, references, select, trigger, truncate, update on calls to service_role;

create table messages
(
    id            uuid      default gen_random_uuid() not null
        primary key,
    call_id       uuid
        references calls
            on delete cascade,
    sender        text                                not null
        constraint messages_sender_check
            check (sender = ANY (ARRAY ['bot'::text, 'test'::text])),
    content       jsonb                               not null,
    status        text      default 'sent'::text,
    sent_at       timestamp default now(),
    leaf_id       varchar(100),
    direction     boolean                             not null,
    retry_counter integer   default 1                 not null,
    tool_tip      varchar(100)
);

alter table messages
    owner to postgres;

create index messages_call_id_idx
    on messages (call_id);

create index messages_call_sent_at_idx
    on messages (call_id, sent_at);

grant delete, insert, references, select, trigger, truncate, update on messages to anon;

grant delete, insert, references, select, trigger, truncate, update on messages to authenticated;

grant delete, insert, references, select, trigger, truncate, update on messages to service_role;

create table scenario_runs
(
    id          uuid      default uuid_generate_v4() not null
        primary key,
    scenario_id uuid
        references scenarios,
    phone_id    uuid
        references phones,
    status      text,
    started_at  timestamp,
    ended_at    timestamp,
    created_at  timestamp default now(),
    call_id     uuid
        references calls,
    status_id   uuid
        references call_run_statuses,
    config      jsonb
);

alter table scenario_runs
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on scenario_runs to anon;

grant delete, insert, references, select, trigger, truncate, update on scenario_runs to authenticated;

grant delete, insert, references, select, trigger, truncate, update on scenario_runs to service_role;

grant delete, insert, references, select, trigger, truncate, update on call_run_statuses to anon;

grant delete, insert, references, select, trigger, truncate, update on call_run_statuses to authenticated;

grant delete, insert, references, select, trigger, truncate, update on call_run_statuses to service_role;

create function handle_new_user() returns trigger
    security definer
    language plpgsql
as
$$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    avatar,
    google_id,
    lang,
    package_type,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    NEW.raw_user_meta_data->>'sub',
    COALESCE(NEW.raw_user_meta_data->>'lang', 'he'),
    'basic',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    last_login = NOW(),
    name = COALESCE(NULLIF(EXCLUDED.name, ''), public.users.name),
    avatar = COALESCE(NULLIF(EXCLUDED.avatar, ''), public.users.avatar);
  
  RETURN NEW;
END;
$$;

alter function handle_new_user() owner to postgres;

grant execute on function handle_new_user() to anon;

grant execute on function handle_new_user() to authenticated;

grant execute on function handle_new_user() to service_role;

create function update_updated_at() returns trigger
    language plpgsql
as
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

alter function update_updated_at() owner to postgres;

grant execute on function update_updated_at() to anon;

grant execute on function update_updated_at() to authenticated;

grant execute on function update_updated_at() to service_role;






