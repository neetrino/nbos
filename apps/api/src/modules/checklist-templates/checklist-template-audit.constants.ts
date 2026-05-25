export const CHECKLIST_TEMPLATE_AUDIT_ENTITY_TYPE = 'ChecklistTemplate';

export const ChecklistTemplateAuditAction = {
  CREATED: 'checklist_template.created',
  METADATA_UPDATED: 'checklist_template.metadata_updated',
  DRAFT_UPDATED: 'checklist_template.draft_updated',
  VERSION_PUBLISHED: 'checklist_template.version_published',
  ARCHIVED: 'checklist_template.archived',
  DUPLICATED: 'checklist_template.duplicated',
  INSTANCE_COMPLETED: 'checklist_instance.completed',
  INSTANCE_ITEM_MARKED: 'checklist_instance.item_marked',
} as const;
