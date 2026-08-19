import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useMe } from '@/api/hooks/useAuth'
import { useThemeStore } from '@/stores/theme'
import { AppLayout } from '@/components/layout/AppLayout'
import { AssistantPanel } from '@/components/assistant/AssistantPanel'
import { Login } from '@/pages/Login'
import { ForcePasswordChange } from '@/pages/ForcePasswordChange'
import { lazy, Suspense, useEffect } from 'react'

// Every page below is loaded on demand. Imported eagerly they all landed in
// one entry chunk, ~1.44 MB before gzip, which every visitor parsed before
// the first screen appeared -- while a session typically touches a handful of
// them. Login and ForcePasswordChange stay eager: they are the first paint
// for an unauthenticated or first-login user, so deferring them would only
// add a spinner ahead of the thing being waited for.
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Jobs = lazy(() => import('@/pages/Jobs').then((m) => ({ default: m.Jobs })))
const JobDetail = lazy(() => import('@/pages/JobDetail').then((m) => ({ default: m.JobDetail })))
const Templates = lazy(() => import('@/pages/Templates').then((m) => ({ default: m.Templates })))
const TemplateDetail = lazy(() => import('@/pages/TemplateDetail').then((m) => ({ default: m.TemplateDetail })))
const Projects = lazy(() => import('@/pages/Projects').then((m) => ({ default: m.Projects })))
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail').then((m) => ({ default: m.ProjectDetail })))
const Inventories = lazy(() => import('@/pages/Inventories').then((m) => ({ default: m.Inventories })))
const InventoryDetail = lazy(() => import('@/pages/InventoryDetail').then((m) => ({ default: m.InventoryDetail })))
const Credentials = lazy(() => import('@/pages/Credentials').then((m) => ({ default: m.Credentials })))
const CredentialDetail = lazy(() => import('@/pages/CredentialDetail').then((m) => ({ default: m.CredentialDetail })))
const Organizations = lazy(() => import('@/pages/Organizations').then((m) => ({ default: m.Organizations })))
const OrganizationDetail = lazy(() => import('@/pages/OrganizationDetail').then((m) => ({ default: m.OrganizationDetail })))
const Users = lazy(() => import('@/pages/Users').then((m) => ({ default: m.Users })))
const UserDetail = lazy(() => import('@/pages/UserDetail').then((m) => ({ default: m.UserDetail })))
const Teams = lazy(() => import('@/pages/Teams').then((m) => ({ default: m.Teams })))
const TeamDetail = lazy(() => import('@/pages/TeamDetail').then((m) => ({ default: m.TeamDetail })))
const Hosts = lazy(() => import('@/pages/Hosts').then((m) => ({ default: m.Hosts })))
const HostDetail = lazy(() => import('@/pages/HostDetail').then((m) => ({ default: m.HostDetail })))
const Schedules = lazy(() => import('@/pages/Schedules').then((m) => ({ default: m.Schedules })))
const ScheduleDetail = lazy(() => import('@/pages/ScheduleDetail').then((m) => ({ default: m.ScheduleDetail })))
const ActivityStream = lazy(() => import('@/pages/ActivityStream').then((m) => ({ default: m.ActivityStream })))
const AuditLog = lazy(() => import('@/pages/AuditLog').then((m) => ({ default: m.AuditLog })))
const JobTemplateForm = lazy(() => import('@/pages/JobTemplateForm').then((m) => ({ default: m.JobTemplateForm })))
const ProjectForm = lazy(() => import('@/pages/ProjectForm').then((m) => ({ default: m.ProjectForm })))
const InventoryForm = lazy(() => import('@/pages/InventoryForm').then((m) => ({ default: m.InventoryForm })))
const CredentialForm = lazy(() => import('@/pages/CredentialForm').then((m) => ({ default: m.CredentialForm })))
const OrganizationForm = lazy(() => import('@/pages/OrganizationForm').then((m) => ({ default: m.OrganizationForm })))
const Instances = lazy(() => import('@/pages/Instances').then((m) => ({ default: m.Instances })))
const InstanceDetail = lazy(() => import('@/pages/InstanceDetail').then((m) => ({ default: m.InstanceDetail })))
const InstanceGroups = lazy(() => import('@/pages/InstanceGroups').then((m) => ({ default: m.InstanceGroups })))
const InstanceGroupDetail = lazy(() => import('@/pages/InstanceGroupDetail').then((m) => ({ default: m.InstanceGroupDetail })))
const ExecutionEnvironments = lazy(() => import('@/pages/ExecutionEnvironments').then((m) => ({ default: m.ExecutionEnvironments })))
const ExecutionEnvironmentDetail = lazy(() => import('@/pages/ExecutionEnvironmentDetail').then((m) => ({ default: m.ExecutionEnvironmentDetail })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))
const SettingsCategory = lazy(() => import('@/pages/SettingsCategory').then((m) => ({ default: m.SettingsCategory })))
const UserForm = lazy(() => import('@/pages/UserForm').then((m) => ({ default: m.UserForm })))
const TeamForm = lazy(() => import('@/pages/TeamForm').then((m) => ({ default: m.TeamForm })))
const WorkflowJobTemplateForm = lazy(() => import('@/pages/WorkflowJobTemplateForm').then((m) => ({ default: m.WorkflowJobTemplateForm })))
const NotificationTemplates = lazy(() => import('@/pages/NotificationTemplates').then((m) => ({ default: m.NotificationTemplates })))
const NotificationTemplateDetail = lazy(() => import('@/pages/NotificationTemplateDetail').then((m) => ({ default: m.NotificationTemplateDetail })))
const NotificationTemplateForm = lazy(() => import('@/pages/NotificationTemplateForm').then((m) => ({ default: m.NotificationTemplateForm })))
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })))
const ScheduleForm = lazy(() => import('@/pages/ScheduleForm').then((m) => ({ default: m.ScheduleForm })))
const WorkflowTemplateDetail = lazy(() => import('@/pages/WorkflowTemplateDetail').then((m) => ({ default: m.WorkflowTemplateDetail })))
const TopologyPage = lazy(() => import('@/pages/TopologyPage').then((m) => ({ default: m.TopologyPage })))
const EventRules = lazy(() => import('@/pages/EventRules').then((m) => ({ default: m.EventRules })))
const EventRuleDetail = lazy(() => import('@/pages/EventRuleDetail').then((m) => ({ default: m.EventRuleDetail })))
const EventRuleForm = lazy(() => import('@/pages/EventRuleForm').then((m) => ({ default: m.EventRuleForm })))
const EventLogs = lazy(() => import('@/pages/EventLogs').then((m) => ({ default: m.EventLogs })))
const EventLogDetail = lazy(() => import('@/pages/EventLogDetail').then((m) => ({ default: m.EventLogDetail })))
const OutboundWebhooks = lazy(() => import('@/pages/OutboundWebhooks').then((m) => ({ default: m.OutboundWebhooks })))
const OutboundWebhookDetail = lazy(() => import('@/pages/OutboundWebhookDetail').then((m) => ({ default: m.OutboundWebhookDetail })))
const OutboundWebhookForm = lazy(() => import('@/pages/OutboundWebhookForm').then((m) => ({ default: m.OutboundWebhookForm })))
const DriftDetections = lazy(() => import('@/pages/DriftDetections').then((m) => ({ default: m.DriftDetections })))
const DriftDetectionDetail = lazy(() => import('@/pages/DriftDetectionDetail').then((m) => ({ default: m.DriftDetectionDetail })))
const DriftAlertRules = lazy(() => import('@/pages/DriftAlertRules').then((m) => ({ default: m.DriftAlertRules })))
const DriftAlertRuleDetail = lazy(() => import('@/pages/DriftAlertRuleDetail').then((m) => ({ default: m.DriftAlertRuleDetail })))
const DriftAlertRuleForm = lazy(() => import('@/pages/DriftAlertRuleForm').then((m) => ({ default: m.DriftAlertRuleForm })))
const DriftAlerts = lazy(() => import('@/pages/DriftAlerts').then((m) => ({ default: m.DriftAlerts })))
const DriftAlertDetail = lazy(() => import('@/pages/DriftAlertDetail').then((m) => ({ default: m.DriftAlertDetail })))
const FactSnapshots = lazy(() => import('@/pages/FactSnapshots').then((m) => ({ default: m.FactSnapshots })))
const Analytics = lazy(() => import('@/pages/Analytics').then((m) => ({ default: m.Analytics })))
const ServicePortal = lazy(() => import('@/pages/ServicePortal').then((m) => ({ default: m.ServicePortal })))
const MyServiceRequests = lazy(() => import('@/pages/MyServiceRequests').then((m) => ({ default: m.MyServiceRequests })))
const ServiceRequestDetail = lazy(() => import('@/pages/ServiceRequestDetail').then((m) => ({ default: m.ServiceRequestDetail })))
const ServiceApprovals = lazy(() => import('@/pages/ServiceApprovals').then((m) => ({ default: m.ServiceApprovals })))
const ServiceCatalogAdmin = lazy(() => import('@/pages/ServiceCatalogAdmin').then((m) => ({ default: m.ServiceCatalogAdmin })))
const ServiceCatalogItemForm = lazy(() => import('@/pages/ServiceCatalogItemForm').then((m) => ({ default: m.ServiceCatalogItemForm })))
const UserSecurity = lazy(() => import('@/pages/UserSecurity').then((m) => ({ default: m.UserSecurity })))
const MfaChallenge = lazy(() => import('@/pages/MfaChallenge').then((m) => ({ default: m.MfaChallenge })))
const Policies = lazy(() => import('@/pages/Policies').then((m) => ({ default: m.Policies })))
const PolicyForm = lazy(() => import('@/pages/PolicyForm').then((m) => ({ default: m.PolicyForm })))
const PolicyDecisions = lazy(() => import('@/pages/PolicyDecisions').then((m) => ({ default: m.PolicyDecisions })))
const Scanners = lazy(() => import('@/pages/Scanners').then((m) => ({ default: m.Scanners })))
const ScannerForm = lazy(() => import('@/pages/ScannerForm').then((m) => ({ default: m.ScannerForm })))
const ScanResults = lazy(() => import('@/pages/ScanResults').then((m) => ({ default: m.ScanResults })))
const Observability = lazy(() => import('@/pages/Observability').then((m) => ({ default: m.Observability })))
const Tenants = lazy(() => import('@/pages/Tenants').then((m) => ({ default: m.Tenants })))
const TenantForm = lazy(() => import('@/pages/TenantForm').then((m) => ({ default: m.TenantForm })))
const TenantDetail = lazy(() => import('@/pages/TenantDetail').then((m) => ({ default: m.TenantDetail })))
const TenantQuotaEvents = lazy(() => import('@/pages/TenantQuotaEvents').then((m) => ({ default: m.TenantQuotaEvents })))
const GettingStartedWizard = lazy(() => import('@/pages/wizards/GettingStartedWizard').then((m) => ({ default: m.GettingStartedWizard })))
const AutomationWizard = lazy(() => import('@/pages/wizards/AutomationWizard').then((m) => ({ default: m.AutomationWizard })))
const SelfServiceWizard = lazy(() => import('@/pages/wizards/SelfServiceWizard').then((m) => ({ default: m.SelfServiceWizard })))
const TenancyWizard = lazy(() => import('@/pages/wizards/TenancyWizard').then((m) => ({ default: m.TenancyWizard })))
const ComplianceWizard = lazy(() => import('@/pages/wizards/ComplianceWizard').then((m) => ({ default: m.ComplianceWizard })))
const ResourcesWizard = lazy(() => import('@/pages/wizards/ResourcesWizard').then((m) => ({ default: m.ResourcesWizard })))
const AccessWizard = lazy(() => import('@/pages/wizards/AccessWizard').then((m) => ({ default: m.AccessWizard })))

function RouteFallback() {
  return (
    <div className="flex h-64 items-center justify-center" role="status" aria-label="Loading page">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function AuthenticatedRoutes() {
  return (
    <AppLayout>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Jobs */}
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />

        {/* Templates */}
        <Route path="/templates" element={<Templates />} />
        <Route path="/templates/job_template/new" element={<JobTemplateForm />} />
        <Route path="/templates/job_template/:id/edit" element={<JobTemplateForm />} />
        <Route path="/templates/workflow_job_template/new" element={<WorkflowJobTemplateForm />} />
        <Route path="/templates/workflow_job_template/:id/edit" element={<WorkflowJobTemplateForm />} />
        <Route path="/templates/workflow_job_template/:id" element={<WorkflowTemplateDetail />} />
        <Route path="/templates/:type/:id" element={<TemplateDetail />} />

        {/* Projects */}
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/new" element={<ProjectForm />} />
        <Route path="/projects/:id/edit" element={<ProjectForm />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />

        {/* Inventories */}
        <Route path="/inventories" element={<Inventories />} />
        <Route path="/inventories/new" element={<InventoryForm />} />
        <Route path="/inventories/:id/edit" element={<InventoryForm />} />
        <Route path="/inventories/:id" element={<InventoryDetail />} />

        {/* Credentials */}
        <Route path="/credentials" element={<Credentials />} />
        <Route path="/credentials/new" element={<CredentialForm />} />
        <Route path="/credentials/:id/edit" element={<CredentialForm />} />
        <Route path="/credentials/:id" element={<CredentialDetail />} />

        {/* Access */}
        <Route path="/organizations" element={<Organizations />} />
        <Route path="/organizations/new" element={<OrganizationForm />} />
        <Route path="/organizations/:id/edit" element={<OrganizationForm />} />
        <Route path="/organizations/:id" element={<OrganizationDetail />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/new" element={<UserForm />} />
        <Route path="/users/:id/edit" element={<UserForm />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/new" element={<TeamForm />} />
        <Route path="/teams/:id/edit" element={<TeamForm />} />
        <Route path="/teams/:id" element={<TeamDetail />} />

        {/* Administration */}
        <Route path="/instances" element={<Instances />} />
        <Route path="/instances/:id" element={<InstanceDetail />} />
        <Route path="/instance_groups" element={<InstanceGroups />} />
        <Route path="/instance_groups/:id" element={<InstanceGroupDetail />} />
        <Route path="/execution_environments" element={<ExecutionEnvironments />} />
        <Route path="/execution_environments/:id" element={<ExecutionEnvironmentDetail />} />

        {/* Other */}
        <Route path="/hosts" element={<Hosts />} />
        <Route path="/hosts/:id" element={<HostDetail />} />
        <Route path="/schedules" element={<Schedules />} />
        <Route path="/schedules/new" element={<ScheduleForm />} />
        <Route path="/schedules/:id/edit" element={<ScheduleForm />} />
        <Route path="/schedules/:id" element={<ScheduleDetail />} />
        <Route path="/notification_templates" element={<NotificationTemplates />} />
        <Route path="/notification_templates/new" element={<NotificationTemplateForm />} />
        <Route path="/notification_templates/:id/edit" element={<NotificationTemplateForm />} />
        <Route path="/notification_templates/:id" element={<NotificationTemplateDetail />} />
        <Route path="/topology" element={<TopologyPage />} />
        <Route path="/activity" element={<ActivityStream />} />
        <Route path="/audit" element={<AuditLog />} />

        {/* Event-Driven Automation */}
        <Route path="/event_rules" element={<EventRules />} />
        <Route path="/event_rules/new" element={<EventRuleForm />} />
        <Route path="/event_rules/:id/edit" element={<EventRuleForm />} />
        <Route path="/event_rules/:id" element={<EventRuleDetail />} />
        <Route path="/event_logs" element={<EventLogs />} />
        <Route path="/event_logs/:id" element={<EventLogDetail />} />
        <Route path="/outbound_webhooks" element={<OutboundWebhooks />} />
        <Route path="/outbound_webhooks/new" element={<OutboundWebhookForm />} />
        <Route path="/outbound_webhooks/:id/edit" element={<OutboundWebhookForm />} />
        <Route path="/outbound_webhooks/:id" element={<OutboundWebhookDetail />} />

        {/* Drift Detection */}
        <Route path="/drift_detections" element={<DriftDetections />} />
        <Route path="/drift_detections/:id" element={<DriftDetectionDetail />} />
        <Route path="/drift_alert_rules" element={<DriftAlertRules />} />
        <Route path="/drift_alert_rules/new" element={<DriftAlertRuleForm />} />
        <Route path="/drift_alert_rules/:id/edit" element={<DriftAlertRuleForm />} />
        <Route path="/drift_alert_rules/:id" element={<DriftAlertRuleDetail />} />
        <Route path="/drift_alerts" element={<DriftAlerts />} />
        <Route path="/drift_alerts/:id" element={<DriftAlertDetail />} />
        <Route path="/fact_snapshots" element={<FactSnapshots />} />

        {/* Analytics */}
        <Route path="/analytics" element={<Analytics />} />

        {/* Self-Service Portal */}
        <Route path="/service_portal" element={<ServicePortal />} />
        <Route path="/my_requests" element={<MyServiceRequests />} />
        <Route path="/service_requests/:id" element={<ServiceRequestDetail />} />
        <Route path="/service_approvals" element={<ServiceApprovals />} />
        <Route path="/service_catalog" element={<ServiceCatalogAdmin />} />
        <Route path="/service_catalog/new" element={<ServiceCatalogItemForm />} />
        <Route path="/service_catalog/:id/edit" element={<ServiceCatalogItemForm />} />

        {/* Account security */}
        <Route path="/me/security" element={<UserSecurity />} />
        <Route path="/auth/mfa" element={<MfaChallenge />} />

        {/* Policy-as-Code */}
        <Route path="/policies" element={<Policies />} />
        <Route path="/policies/new" element={<PolicyForm />} />
        <Route path="/policies/:id/edit" element={<PolicyForm />} />
        <Route path="/policy_decisions" element={<PolicyDecisions />} />
        <Route path="/scanners" element={<Scanners />} />
        <Route path="/scanners/new" element={<ScannerForm />} />
        <Route path="/scanners/:id/edit" element={<ScannerForm />} />
        <Route path="/scan_results" element={<ScanResults />} />
        <Route path="/observability" element={<Observability />} />

        {/* Multi-Tenancy */}
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/tenants/new" element={<TenantForm />} />
        <Route path="/tenants/:id/edit" element={<TenantForm />} />
        <Route path="/tenants/:id" element={<TenantDetail />} />
        <Route path="/tenant_quota_events" element={<TenantQuotaEvents />} />

        {/* Wizards */}
        <Route path="/wizards/getting-started" element={<GettingStartedWizard />} />
        <Route path="/wizards/automation" element={<AutomationWizard />} />
        <Route path="/wizards/self-service" element={<SelfServiceWizard />} />
        <Route path="/wizards/tenancy" element={<TenancyWizard />} />
        <Route path="/wizards/compliance" element={<ComplianceWizard />} />
        <Route path="/wizards/resources" element={<ResourcesWizard />} />
        <Route path="/wizards/access" element={<AccessWizard />} />

        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/:slug" element={<SettingsCategory />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      <AssistantPanel />
    </AppLayout>
  )
}

export function App() {
  const { data: me, isLoading, isError } = useMe()
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !me) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Force password change on first login after deployment
  const passwordChangedKey = `forail_password_changed_${me.id}`
  const needsPasswordChange = me.is_superuser && !localStorage.getItem(passwordChangedKey)

  if (needsPasswordChange) {
    return (
      <Routes>
        <Route path="*" element={<ForcePasswordChange />} />
      </Routes>
    )
  }

  return <AuthenticatedRoutes />
}
