import { supabase } from './supabase'

export type AuditAction =
  | 'ISSUE_CREATED'
  | 'ISSUE_RESOLVED'
  | 'ISSUE_UPDATED'
  | 'ISSUE_ASSIGNED'
  | 'PART_USED'
  | 'MACHINE_STATUS_CHANGED'
  | 'PART_STOCK_UPDATED'
  | 'OPERATOR_LOGIN'
  | 'OPERATOR_LOGOUT'

export async function logAudit(
  operatorId: string,
  action: AuditAction,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>
) {
  try {
    await supabase.from('audit_log').insert({
      operator_id: operatorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details ?? null,
    })
  } catch {
    // Audit log failures should never break the main flow
    console.warn('Audit log failed:', action, entityId)
  }
}
