export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  is_superuser: boolean
  is_system_auditor: boolean
  created: string
  modified: string
  last_login: string | null
  password: string
}

export interface MeResponse {
  count: number
  results: User[]
}

export interface DashboardCount {
  url: string
  total: number
  failed?: number
}

export interface DashboardResponse {
  inventories: DashboardCount
  groups: DashboardCount
  hosts: DashboardCount & { failed: number }
  projects: DashboardCount & { failed: number }
  users: DashboardCount
  organizations: DashboardCount
  teams: DashboardCount
  credentials: DashboardCount
  job_templates: DashboardCount
}

export interface DashboardJobGraphResponse {
  jobs: {
    successful: Array<[number, number]>
    failed: Array<[number, number]>
  }
}

export type JobStatus =
  | 'successful'
  | 'failed'
  | 'error'
  | 'canceled'
  | 'pending'
  | 'waiting'
  | 'running'
  | 'new'

export type LaunchType =
  | 'manual'
  | 'relaunch'
  | 'callback'
  | 'scheduled'
  | 'dependency'
  | 'workflow'
  | 'webhook'
  | 'sync'
  | 'scm'

export interface UnifiedJob {
  id: number
  name: string
  type: string
  status: JobStatus
  started: string | null
  finished: string | null
  elapsed: number
  failed: boolean
  launch_type: LaunchType
  execution_node: string
  controller_node: string
  created: string
  summary_fields: {
    organization?: { id: number; name: string }
    created_by?: { id: number; username: string }
    unified_job_template?: { id: number; name: string; unified_job_type: string }
  }
}

export interface JobDetail extends UnifiedJob {
  job_template: number | null
  inventory: number | null
  project: number | null
  playbook: string
  scm_branch: string
  forks: number
  limit: string
  verbosity: number
  extra_vars: string
  job_tags: string
  skip_tags: string
  diff_mode: boolean
  scm_revision: string
  job_slice_number: number
  job_slice_count: number
  host_status_counts: Record<string, number>
  playbook_counts: Record<string, number>
  summary_fields: UnifiedJob['summary_fields'] & {
    job_template?: { id: number; name: string; description: string }
    inventory?: { id: number; name: string; kind: string }
    project?: { id: number; name: string; scm_type: string }
    execution_environment?: { id: number; name: string; image: string }
    credentials?: Array<{ id: number; name: string; kind: string }>
    labels?: { count: number; results: Array<{ id: number; name: string }> }
    launched_by?: { id: number; name: string; type: string }
  }
}

export interface JobStdoutResponse {
  range: { start: number; end: number; absolute_end: number }
  content: string
}

export interface JobHostSummary {
  id: number
  host_id: number
  host_name: string
  ok: number
  changed: number
  dark: number
  failures: number
  skipped: number
  ignored: number
  rescued: number
  processed: number
  failed: boolean
}

// --- Job Templates ---

export interface JobTemplate {
  id: number
  name: string
  description: string
  type: 'job_template'
  status: JobStatus
  last_job_run: string | null
  last_job_failed: boolean
  job_type: string
  playbook: string
  forks: number
  limit: string
  verbosity: number
  extra_vars: string
  job_tags: string
  skip_tags: string
  diff_mode: boolean
  ask_variables_on_launch: boolean
  ask_limit_on_launch: boolean
  ask_tags_on_launch: boolean
  ask_skip_tags_on_launch: boolean
  ask_job_type_on_launch: boolean
  ask_verbosity_on_launch: boolean
  ask_inventory_on_launch: boolean
  ask_credential_on_launch: boolean
  ask_execution_environment_on_launch: boolean
  ask_forks_on_launch: boolean
  ask_job_slice_count_on_launch: boolean
  ask_labels_on_launch: boolean
  ask_timeout_on_launch: boolean
  survey_enabled: boolean
  become_enabled: boolean
  allow_simultaneous: boolean
  job_slice_count: number
  webhook_service: string
  created: string
  modified: string
  summary_fields: {
    organization?: { id: number; name: string }
    inventory?: { id: number; name: string; kind: string }
    project?: { id: number; name: string; scm_type: string }
    execution_environment?: { id: number; name: string; image: string }
    last_job?: { id: number; name: string; status: JobStatus; finished: string | null }
    last_update?: { id: number; name: string; status: JobStatus }
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
    credentials?: Array<{ id: number; name: string; kind: string }>
    labels?: { count: number; results: Array<{ id: number; name: string }> }
    recent_jobs?: Array<{ id: number; status: JobStatus; finished: string }>
    object_roles?: Record<string, ObjectRole>
  }
}

export interface WorkflowJobTemplate {
  id: number
  name: string
  description: string
  type: 'workflow_job_template'
  status: JobStatus
  organization: number | null
  inventory: number | null
  limit: string | null
  scm_branch: string | null
  skip_tags: string | null
  job_tags: string | null
  last_job_run: string | null
  last_job_failed: boolean
  survey_enabled: boolean
  allow_simultaneous: boolean
  ask_variables_on_launch: boolean
  ask_inventory_on_launch: boolean
  ask_limit_on_launch: boolean
  ask_scm_branch_on_launch: boolean
  ask_labels_on_launch: boolean
  ask_skip_tags_on_launch: boolean
  ask_tags_on_launch: boolean
  extra_vars: string
  webhook_service: string
  created: string
  modified: string
  summary_fields: {
    organization?: { id: number; name: string }
    last_job?: { id: number; name: string; status: JobStatus; finished: string | null }
    last_update?: { id: number; name: string; status: JobStatus }
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
    labels?: { count: number; results: Array<{ id: number; name: string }> }
    recent_jobs?: Array<{ id: number; status: JobStatus; finished: string }>
    object_roles?: Record<string, ObjectRole>
  }
}

export type Template = JobTemplate | WorkflowJobTemplate

// --- Projects ---

export type ProjectStatus = 'successful' | 'failed' | 'error' | 'canceled' | 'pending' | 'waiting' | 'running' | 'new' | 'ok' | 'missing' | 'never updated'

export interface Project {
  id: number
  name: string
  description: string
  status: ProjectStatus
  scm_type: string
  scm_url: string
  scm_branch: string
  scm_revision: string
  scm_clean: boolean
  scm_delete_on_update: boolean
  scm_track_submodules: boolean
  scm_update_on_launch: boolean
  scm_update_cache_timeout: number
  allow_override: boolean
  last_job_run: string | null
  last_job_failed: boolean
  last_update_failed: boolean
  created: string
  modified: string
  summary_fields: {
    organization?: { id: number; name: string }
    default_environment?: { id: number; name: string; image: string }
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
    last_job?: { id: number; name: string; status: JobStatus; finished: string | null }
    last_update?: { id: number; name: string; status: JobStatus; failed: boolean }
    credential?: { id: number; name: string; kind: string }
    object_roles?: Record<string, ObjectRole>
  }
}

// --- Inventories ---

export interface Inventory {
  id: number
  name: string
  description: string
  kind: '' | 'smart' | 'constructed'
  type: 'inventory'
  total_hosts: number
  hosts_with_active_failures: number
  total_groups: number
  has_active_failures: boolean
  total_inventory_sources: number
  has_inventory_sources: boolean
  organization: number
  variables: string
  created: string
  modified: string
  summary_fields: {
    organization: { id: number; name: string }
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
    object_roles?: Record<string, ObjectRole>
  }
}

export interface Host {
  id: number
  name: string
  description: string
  enabled: boolean
  instance_id: string
  variables: string
  has_active_failures: boolean
  has_inventory_sources: boolean
  last_job: number | null
  last_job_host_summary: number | null
  inventory: number
  created: string
  modified: string
  summary_fields: {
    inventory: { id: number; name: string }
    last_job?: { id: number; name: string; status: JobStatus; finished: string | null }
    last_job_host_summary?: { failed: boolean }
    groups?: { count: number; results: Array<{ id: number; name: string }> }
    recent_jobs?: Array<{ id: number; name: string; status: JobStatus; finished: string }>
  }
}

export interface Group {
  id: number
  name: string
  description: string
  inventory: number
  variables: string
  total_hosts: number
  hosts_with_active_failures: number
  total_groups: number
  has_active_failures: boolean
  has_inventory_sources: boolean
  created: string
  modified: string
  summary_fields: {
    inventory: { id: number; name: string }
  }
}

export interface InventorySource {
  id: number
  name: string
  description: string
  source: string
  source_path: string
  source_vars: string
  enabled_var: string
  enabled_value: string
  host_filter: string
  overwrite: boolean
  overwrite_vars: boolean
  update_on_launch: boolean
  update_cache_timeout: number
  status: JobStatus
  last_job_run: string | null
  last_job_failed: boolean
  inventory: number
  created: string
  modified: string
  summary_fields: {
    inventory: { id: number; name: string }
    credential?: { id: number; name: string; kind: string }
    source_project?: { id: number; name: string }
    last_job?: { id: number; name: string; status: JobStatus; finished: string | null }
  }
}

// --- Credentials ---

export interface CredentialType {
  id: number
  name: string
  description: string
  kind: 'ssh' | 'vault' | 'net' | 'scm' | 'cloud' | 'registry' | 'token' | 'insights' | 'external' | 'kubernetes' | 'galaxy' | 'cryptography'
  namespace: string | null
  managed: boolean
  inputs: Record<string, unknown>
  injectors: Record<string, unknown>
  created: string
  modified: string
}

export interface Credential {
  id: number
  name: string
  description: string
  credential_type: number
  managed: boolean
  inputs: Record<string, unknown>
  organization: number | null
  kind: string
  cloud: boolean
  kubernetes: boolean
  created: string
  modified: string
  summary_fields: {
    credential_type: { id: number; name: string; kind: string }
    organization?: { id: number; name: string }
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
    owners?: Array<{ id: number; type: string; name: string; url: string }>
    object_roles?: Record<string, ObjectRole>
  }
}

// --- Organizations ---

export interface Organization {
  id: number
  name: string
  description: string
  max_hosts: number
  created: string
  modified: string
  summary_fields: {
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
    related_field_counts?: {
      inventories: number
      teams: number
      users: number
      job_templates: number
      admins: number
      projects: number
    }
    object_roles?: Record<string, ObjectRole>
  }
}

// --- Teams ---

export interface Team {
  id: number
  name: string
  description: string
  organization: number
  created: string
  modified: string
  summary_fields: {
    organization: { id: number; name: string }
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
  }
}

// --- Activity Stream ---

export interface ActivityStreamEntry {
  id: number
  timestamp: string
  operation: 'create' | 'update' | 'delete' | 'associate' | 'disassociate'
  changes: Record<string, unknown>
  object1: string
  object2: string
  actor_ip?: string
  actor_user_agent?: string
  actor_session_id?: string
  summary_fields: {
    actor?: { id: number; username: string }
  }
}

// --- Audit Events ---

export interface AuditEvent {
  id: number
  timestamp: string
  actor: number | null
  actor_username: string
  actor_ip: string | null
  actor_user_agent: string
  actor_session_id: string
  category: 'auth' | 'credential_access' | 'permission_change' | 'resource_change' | 'system'
  severity: 'info' | 'warning' | 'critical'
  action: string
  description: string
  resource_type: string
  resource_id: number | null
  resource_name: string
  action_node: string
  detail: Record<string, unknown>
  organization: number | null
}

// --- Schedules ---

export interface Schedule {
  id: number
  name: string
  description: string
  rrule: string
  dtstart: string
  dtend: string | null
  next_run: string | null
  enabled: boolean
  unified_job_template: number
  created: string
  modified: string
  summary_fields: {
    unified_job_template: { id: number; name: string; unified_job_type: string }
    created_by?: { id: number; username: string }
  }
}

// --- Schedule Helpers ---

export interface SchedulePreviewResponse {
  local: string[]
  utc: string[]
}

export interface ScheduleZoneInfoResponse {
  zones: string[]
  links: Record<string, string>
}

export interface SchedulePayload {
  name: string
  description?: string
  rrule: string
  enabled: boolean
  unified_job_template: number
}

// --- Workflow Nodes ---

export interface WorkflowNode {
  id: number
  workflow_job_template: number
  unified_job_template: number | null
  success_nodes: number[]
  failure_nodes: number[]
  always_nodes: number[]
  all_parents_must_converge: boolean
  identifier: string
  extra_data: Record<string, unknown>
  inventory: number | null
  scm_branch: string
  job_type: string
  limit: string
  verbosity: number | null
  survey_enabled: boolean
  survey_spec: Record<string, unknown>
  summary_fields: {
    unified_job_template?: { id: number; name: string; unified_job_type: string }
    workflow_job_template: { id: number; name: string }
  }
}

export interface WorkflowNodePayload {
  unified_job_template?: number
  all_parents_must_converge?: boolean
  identifier?: string
  extra_data?: Record<string, unknown>
  inventory?: number | null
  scm_branch?: string
  job_type?: string
  limit?: string
  verbosity?: number | null
  survey_enabled?: boolean
  survey_spec?: Record<string, unknown>
}

export interface WorkflowNodeSurveyInfo {
  node_id: number
  identifier: string
  node_name: string
  survey_spec: {
    name?: string
    description?: string
    spec: Array<{
      variable: string
      question_name: string
      question_description: string
      type: string
      required: boolean
      default: string
      choices: string
      min: number | null
      max: number | null
    }>
  }
}

// --- Receptor / Topology ---

export interface ReceptorAddress {
  id: number
  address: string
  port: number
  protocol: string
  is_internal: boolean
  canonical: boolean
  instance: number
}

// --- Notification Templates ---

export type NotificationType =
  | 'awssns'
  | 'email'
  | 'slack'
  | 'twilio'
  | 'pagerduty'
  | 'grafana'
  | 'webhook'
  | 'mattermost'
  | 'rocketchat'
  | 'irc'

export interface NotificationTemplate {
  id: number
  name: string
  description: string
  organization: number | null
  notification_type: NotificationType
  notification_configuration: Record<string, unknown>
  messages: Record<string, unknown> | null
  created: string
  modified: string
  summary_fields: {
    organization?: { id: number; name: string }
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
    recent_notifications?: Array<{ id: number; status: string; created: string; error: string }>
    user_capabilities?: { edit: boolean; delete: boolean; copy: boolean }
  }
}

export interface Notification {
  id: number
  notification_template: number
  notification_type: NotificationType
  status: 'successful' | 'failed' | 'pending'
  error: string
  subject: string
  recipients: string
  body: Record<string, unknown>
  created: string
}

// --- RBAC ---

export interface ObjectRole {
  id: number
  name: string
  description: string
  user_only?: boolean
}

export interface RoleUser {
  id: number
  username: string
  first_name: string
  last_name: string
}

export interface RoleTeam {
  id: number
  name: string
}

// --- Instances & Instance Groups ---

export interface Instance {
  id: number
  hostname: string
  node_type: 'control' | 'execution' | 'hybrid' | 'hop'
  node_state: string
  enabled: boolean
  capacity: number
  consumed_capacity: number
  percent_capacity_remaining: number
  jobs_running: number
  jobs_total: number
  cpu: number
  memory: number
  cpu_capacity: number
  mem_capacity: number
  version: string
  errors: string
  last_seen: string
  health_check_started: string | null
  health_check_pending: boolean
  created: string
  modified: string
}

export interface InstanceGroup {
  id: number
  name: string
  is_container_group: boolean
  capacity: number
  consumed_capacity: number
  percent_capacity_remaining: number
  jobs_running: number
  jobs_total: number
  instances: number
  policy_instance_minimum: number
  policy_instance_percentage: number
  max_concurrent_jobs: number
  max_forks: number
  created: string
  modified: string
  summary_fields: {
    object_roles?: Record<string, { id: number; name: string; description: string }>
  }
}

// --- Execution Environments ---

export interface ExecutionEnvironment {
  id: number
  name: string
  description: string
  image: string
  managed: boolean
  pull: 'always' | 'missing' | 'never'
  organization: number | null
  credential: number | null
  created: string
  modified: string
  summary_fields: {
    organization?: { id: number; name: string }
    credential?: { id: number; name: string }
  }
}

// --- Event-Driven Automation (EDA) ---

export type EventRuleSourceType =
  | 'webhook_generic'
  | 'webhook_github'
  | 'webhook_gitlab'
  | 'alertmanager'
  | 'pagerduty'
  | 'datadog'
  | 'cloudwatch'

export type EventRuleActionType =
  | 'launch_job_template'
  | 'launch_workflow'
  | 'send_notification'

export interface EventRuleCondition {
  jinja2_expression: string
  description?: string
}

export interface EventRuleAction {
  action_type: EventRuleActionType
  target_id: number
  extra_vars?: Record<string, unknown>
  description?: string
}

export interface EventRule {
  id: number
  type: 'event_rule'
  url: string
  related: {
    organization?: string
    event_logs?: string
    webhook_key?: string
  }
  name: string
  description: string
  organization: number | null
  enabled: boolean
  source_type: EventRuleSourceType
  webhook_path: string
  conditions: EventRuleCondition[]
  actions: EventRuleAction[]
  throttle_seconds: number
  last_fired_at: string | null
  fire_count: number
  webhook_url: string
  created: string
  modified: string
}

export type EventLogStatus =
  | 'received'
  | 'matched'
  | 'unmatched'
  | 'throttled'
  | 'action_fired'
  | 'action_failed'
  | 'error'
  | 'signature_failed'

export interface EventLog {
  id: number
  type: 'event_log'
  url: string
  related: {
    event_rule?: string
    job?: string
    organization?: string
  }
  created: string
  event_rule: number | null
  event_rule_name: string
  source_type: string
  source_ip: string | null
  event_type: string
  event_guid: string
  payload: Record<string, unknown>
  headers: Record<string, string>
  conditions_matched: boolean
  condition_results: Array<{
    expression: string
    description: string
    matched: boolean
    error?: string
  }>
  actions_triggered: Array<{
    action_type: string
    target_id: number
    description: string
    status: string
    job_id?: number
    error?: string
  }>
  status: EventLogStatus
  error_detail: string
  job_id: number | null
  organization: number | null
}

export type OutboundWebhookEventType =
  | 'job.started'
  | 'job.succeeded'
  | 'job.failed'
  | 'job.canceled'
  | 'workflow.started'
  | 'workflow.succeeded'
  | 'workflow.failed'

export interface OutboundWebhook {
  id: number
  type: 'outbound_webhook'
  url: string
  related: {
    organization?: string
  }
  name: string
  description: string
  organization: number | null
  target_url: string
  events: OutboundWebhookEventType[]
  custom_headers: Record<string, string>
  enabled: boolean
  ssl_verify: boolean
  last_status: string
  last_sent_at: string | null
  last_error: string
  created: string
  modified: string
}

// --- Drift Detection ---

export type DriftCategory = 'packages' | 'services' | 'users_groups' | 'network' | 'mounts' | 'kernel' | 'other'
export type DriftSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface HostFactSnapshot {
  id: number
  type: 'fact_snapshot'
  url: string
  related: {
    host?: string
    job?: string
    inventory?: string
  }
  host: number
  job: number | null
  inventory: number | null
  organization: number | null
  captured_at: string
  facts: Record<string, unknown>
  facts_hash: string
}

export interface DriftDetection {
  id: number
  type: 'drift_detection'
  url: string
  related: {
    host?: string
    job?: string
    snapshot_before?: string
    snapshot_after?: string
  }
  host: number
  host_name: string
  inventory: number | null
  organization: number | null
  snapshot_before: number | null
  snapshot_after: number
  detected_at: string
  job: number | null
  category: DriftCategory
  severity: DriftSeverity
  fact_path: string
  summary: string
  detail: {
    before: unknown
    after: unknown
    diff_type: 'added' | 'removed' | 'changed'
  }
  acknowledged: boolean
  acknowledged_by: number | null
  acknowledged_at: string | null
}

export interface DriftAlertRule {
  id: number
  type: 'drift_alert_rule'
  url: string
  related: {
    organization?: string
    inventory?: string
    notification_template?: string
  }
  name: string
  description: string
  organization: number | null
  enabled: boolean
  inventory: number | null
  host_filter: string
  categories: DriftCategory[]
  severity_min: DriftSeverity
  threshold_count: number
  threshold_window_minutes: number
  notification_template: number | null
  last_triggered_at: string | null
  trigger_count: number
  cooldown_minutes: number
  created: string
  modified: string
}

export interface DriftAlert {
  id: number
  type: 'drift_alert'
  url: string
  related: {
    alert_rule?: string
    host?: string
  }
  created: string
  alert_rule: number | null
  alert_rule_name: string
  host: number | null
  organization: number | null
  drift_count: number
  summary: string
  notification_status: 'pending' | 'sent' | 'failed'
  notification_error: string
}

export interface DriftSummary {
  total_hosts_with_drift: number
  total_drift_items: number
  unacknowledged_count: number
  by_category: Record<DriftCategory, number>
  by_severity: Record<DriftSeverity, number>
}

// --- Analytics ---

export interface AnalyticsJobTrend {
  date: string
  avg_duration: number
  job_count: number
  successful: number
  failed: number
}

export interface AnalyticsSuccessRate {
  date: string
  total: number
  successful: number
  failed: number
  error: number
  canceled: number
  success_rate: number
}

export interface AnalyticsTopTemplate {
  template_id: number
  template_name: string
  run_count: number
  avg_duration: number
  success_rate: number
}

export interface AnalyticsBusiestHost {
  host_name: string
  job_count: number
  total_ok: number
  total_changed: number
  total_failures: number
  total_skipped: number
}

export interface AnalyticsHostCoverage {
  total_hosts: number
  automated_hosts: number
  coverage_pct: number
  by_inventory: Array<{
    inventory_id: number
    name: string
    total: number
    automated: number
    pct: number
  }>
}

export interface AnalyticsFailureAnalysis {
  by_template: Array<{ template_name: string; failure_count: number }>
  by_host: Array<{ host_name: string; failure_count: number }>
}

export interface AnalyticsTimeSavings {
  total_automated_seconds: number
  estimated_manual_seconds: number
  time_saved_seconds: number
  time_saved_hours: number
  job_count: number
  avg_job_duration: number
  manual_multiplier: number
}

// ---------------------------------------------------------------------------
// Self-Service Portal
// ---------------------------------------------------------------------------

export type ServiceRequestStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'running'
  | 'successful'
  | 'failed'
  | 'canceled'

export interface ServiceCatalogItem {
  id: number
  type: 'service_catalog_item'
  url: string
  related?: Record<string, string>
  summary_fields?: {
    organization?: { id: number; name: string }
    template?: { id: number; name: string; kind: 'job_template' | 'workflow_job_template' }
    approver_team?: { id: number; name: string }
  }
  name: string
  description: string
  icon: string
  category: string
  tags: string[]
  organization: number | null
  job_template: number | null
  workflow_job_template: number | null
  requires_approval: boolean
  approver_team: number | null
  enabled: boolean
  is_workflow: boolean
  created: string
  modified: string
}

export interface ServiceCatalogItemLaunchData {
  catalog_item: {
    id: number
    name: string
    description: string
    icon: string
    requires_approval: boolean
  }
  is_workflow: boolean
  survey_enabled: boolean
  survey_spec: { spec?: SurveyQuestion[]; name?: string; description?: string } | Record<string, unknown>
  ask_variables_on_launch: boolean
  node_surveys?: Array<{
    node_id: number
    identifier: string
    survey_spec: { spec?: SurveyQuestion[] } | Record<string, unknown>
  }>
}

export interface SurveyQuestion {
  question_name: string
  question_description?: string
  variable: string
  type: 'text' | 'textarea' | 'password' | 'integer' | 'float' | 'multiplechoice' | 'multiselect'
  required: boolean
  default?: string | number
  choices?: string | string[]
  min?: number
  max?: number
}

export interface ServiceRequest {
  id: number
  type: 'service_request'
  url: string
  related?: Record<string, string>
  summary_fields?: {
    catalog_item: { id: number; name: string; icon: string; category: string }
    requested_by?: { id: number; username: string }
    approved_by?: { id: number; username: string }
    unified_job?: { id: number; status: string | null }
  }
  catalog_item: number
  requested_by: number | null
  status: ServiceRequestStatus
  extra_vars: Record<string, unknown>
  node_survey_data: Record<string, Record<string, unknown>>
  justification: string
  approved_by: number | null
  approved_at: string | null
  rejection_reason: string
  unified_job: number | null
  created: string
  modified: string
}

export interface ServiceRequestSubmitPayload {
  extra_vars?: Record<string, unknown>
  node_survey_data?: Record<string, Record<string, unknown>>
  justification?: string
}

// ---------------------------------------------------------------------------
// WebAuthn / FIDO2
// ---------------------------------------------------------------------------

export interface WebAuthnCredential {
  id: number
  label: string
  transports: string[]
  aaguid: string
  created: string
  last_used_at: string | null
  sign_count: number
  backup_eligible: boolean
  backup_state: boolean
}

export interface WebAuthnAuthenticationCompleteResponse {
  logged_in?: boolean
  mfa_satisfied?: boolean
  username?: string
}

// ---------------------------------------------------------------------------
// Policy-as-Code (OPA)
// ---------------------------------------------------------------------------

export type PolicyEnforcement = 'none' | 'warn' | 'enforce'
export type PolicyDecisionKind = 'allow' | 'warn' | 'deny'
export type PolicyAppliesTo = 'job_template' | 'workflow_job_template' | 'ad_hoc_command'

export interface Policy {
  id: number
  type: 'policy'
  url: string
  related?: Record<string, string>
  name: string
  description: string
  organization: number | null
  rego_module: string
  package_path: string
  enforcement: PolicyEnforcement
  enabled: boolean
  applies_to: PolicyAppliesTo[]
  trigger_count: number
  last_triggered_at: string | null
  last_evaluated_at: string | null
  last_sync_status: string
  created: string
  modified: string
}

export interface PolicyDecision {
  id: number
  type: 'policy_decision'
  url: string
  policy: number | null
  policy_name: string
  decision: PolicyDecisionKind
  unified_job: number | null
  unified_job_template: number | null
  organization: number | null
  triggered_by: number | null
  message: string
  context: Record<string, unknown>
  created: string
}

export interface PolicyTestResponse {
  allowed: boolean
  warnings: string[]
  denies: string[]
  raw: unknown
}

// ---------------------------------------------------------------------------
// Observability
// ---------------------------------------------------------------------------

export interface ObservabilityConfig {
  enabled: boolean
  service_name: string
  exporter_endpoint: string
  sampler: string
  sampler_arg: string
  collector_healthy: boolean
  collector_last_check: string | null
}

// ---------------------------------------------------------------------------
// Multi-Tenancy
// ---------------------------------------------------------------------------

export interface TenantQuota {
  max_concurrent_jobs: number | null
  max_daily_launches: number | null
  max_hosts: number | null
  max_storage_mb: number | null
  api_rate_limit: number | null
}

export interface TenantUsage {
  concurrent_jobs_count: number
  launches_today_count: number
  hosts_count: number
  storage_mb_used: number
  last_recalculated_at: string | null
}

export interface TenantBranding {
  logo_url: string
  primary_color: string
  secondary_color: string
  custom_domain: string
}

export interface Tenant {
  id: number
  name: string
  is_tenant_root: boolean
  contact_email: string
  isolation_strict: boolean
  quota: TenantQuota
  usage: TenantUsage
  branding: TenantBranding
  created: string
  modified: string
}

export type TenantQuotaKind = 'concurrent_jobs' | 'daily_launches' | 'hosts' | 'storage_mb'
export type TenantQuotaDecision = 'allowed' | 'blocked'

export interface TenantQuotaEvent {
  id: number
  organization: number | null
  organization_name: string
  quota_kind: TenantQuotaKind
  decision: TenantQuotaDecision
  current_value: number
  limit_value: number | null
  triggered_by: number | null
  unified_job_template: number | null
  message: string
  created: string
}

export interface Branding {
  tenant_id: number
  name: string
  logo_url: string
  primary_color: string
  secondary_color: string
  contact_email: string
}

export interface TenantProvisionPayload {
  name: string
  admin_username: string
  admin_email: string
  admin_password: string
  contact_email?: string
  isolation_strict?: boolean
  quota?: Partial<TenantQuota>
  branding?: Partial<TenantBranding>
}

export interface TenantIsolationEvent {
  id: number
  user: number | null
  user_organization: number | null
  accessed_organization: number | null
  resource_type: string
  resource_id: number | null
  request_path: string
  blocked: boolean
  created: string
}

// ---------------------------------------------------------------------------
// IaC Scanning & Supply Chain Security
// ---------------------------------------------------------------------------

export type ScannerTool = 'ansible-lint' | 'checkov' | 'pip-audit'
export type ScannerEnforcement = 'warn' | 'enforce'
export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical'
export type ScanStatus = 'ok' | 'warn' | 'blocked' | 'error' | 'timeout'
export type ScannerAppliesTo = 'job_template' | 'workflow_job_template' | 'ad_hoc_command'

export interface Scanner {
  id: number
  type?: 'scanner'
  url?: string
  related?: Record<string, string>
  name: string
  description: string
  organization: number | null
  tool: ScannerTool
  config: Record<string, unknown>
  severity_threshold: Severity
  enforcement: ScannerEnforcement
  enabled: boolean
  applies_to: ScannerAppliesTo[]
  trigger_count: number
  last_run_at: string | null
  last_run_status: string
  created: string
  modified: string
}

export interface ScanFinding {
  id: number
  rule_id: string
  severity: Severity
  file_path: string
  line: number | null
  message: string
}

export interface ScanResult {
  id: number
  type?: 'scan_result'
  url?: string
  scanner: number | null
  scanner_name: string
  unified_job: number | null
  unified_job_template: number | null
  organization: number | null
  triggered_by: number | null
  status: ScanStatus
  duration_ms: number
  finding_count: number
  highest_severity: string
  message: string
  raw_output: string
  findings: ScanFinding[]
  created: string
  modified: string
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export type RecommendationSeverity = 'info' | 'warn' | 'critical'
export type RecommendationScope =
  | 'dashboard'
  | 'automation'
  | 'self_service'
  | 'tenancy'
  | 'compliance'
  | 'resources'
  | 'access'
  | 'all'

export interface Recommendation {
  id: string
  scope: RecommendationScope
  severity: RecommendationSeverity
  title: string
  why: string
  action_link: string
}
