-- AddIndex: audit_logs.action (standalone — cho queries filter by action only)
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- AddIndex: audit_logs.resource (standalone — cho queries filter by resource only)
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- AddIndex: workflow_templates.name
CREATE INDEX "workflow_templates_name_idx" ON "workflow_templates"("name");

-- AddIndex: workflow_templates.createdById
CREATE INDEX "workflow_templates_createdById_idx" ON "workflow_templates"("createdById");
