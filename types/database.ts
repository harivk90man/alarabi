export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      maintenance_categories: {
        Row: {
          code: string
          description: string
          discipline: 'mechanical' | 'electrical' | 'pneumatic' | 'hydraulic' | 'facilities' | 'general'
        }
        Insert: {
          code: string
          description: string
          discipline?: 'mechanical' | 'electrical' | 'pneumatic' | 'hydraulic' | 'facilities' | 'general'
        }
        Update: {
          code?: string
          description?: string
          discipline?: 'mechanical' | 'electrical' | 'pneumatic' | 'hydraulic' | 'facilities' | 'general'
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          prefix: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          prefix: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          prefix?: string
          description?: string | null
          created_at?: string
        }
      }
      machines: {
        Row: {
          id: string
          name: string
          model: string | null
          category_id: string | null
          manufacturer: string | null
          status: 'Running' | 'Down' | 'Maintenance' | 'Minor Issue'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          model?: string | null
          category_id?: string | null
          manufacturer?: string | null
          status?: 'Running' | 'Down' | 'Maintenance' | 'Minor Issue'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          model?: string | null
          category_id?: string | null
          manufacturer?: string | null
          status?: 'Running' | 'Down' | 'Maintenance' | 'Minor Issue'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      operators: {
        Row: {
          id: string
          name: string
          role: 'operator' | 'admin' | 'technician'
          email: string | null
          phone: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          role?: 'operator' | 'admin' | 'technician'
          email?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'operator' | 'admin' | 'technician'
          email?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      issues: {
        Row: {
          id: string
          issue_number: string
          machine_id: string
          type: 'breakdown' | 'minor' | 'preventive'
          severity: 'minor' | 'major' | 'severe'
          maintenance_category_code: string | null
          description: string
          start_time: string
          end_time: string | null
          duration_minutes: number | null
          downtime: boolean
          reported_by: string | null
          assigned_to: string | null
          resolution: string | null
          status: 'open' | 'in_progress' | 'resolved'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          issue_number?: string
          machine_id: string
          type: 'breakdown' | 'minor' | 'preventive'
          severity?: 'minor' | 'major' | 'severe'
          maintenance_category_code?: string | null
          description: string
          start_time?: string
          end_time?: string | null
          downtime?: boolean
          reported_by?: string | null
          assigned_to?: string | null
          resolution?: string | null
          status?: 'open' | 'in_progress' | 'resolved'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          issue_number?: string
          machine_id?: string
          type?: 'breakdown' | 'minor' | 'preventive'
          severity?: 'minor' | 'major' | 'severe'
          maintenance_category_code?: string | null
          description?: string
          start_time?: string
          end_time?: string | null
          downtime?: boolean
          reported_by?: string | null
          assigned_to?: string | null
          resolution?: string | null
          status?: 'open' | 'in_progress' | 'resolved'
          created_at?: string
          updated_at?: string
        }
      }
      spare_parts: {
        Row: {
          id: string
          part_number: string
          name: string
          description: string | null
          category: string | null
          stock_category: string | null
          quantity: number
          min_quantity: number
          unit_cost: number
          unit: string
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          part_number: string
          name: string
          description?: string | null
          category?: string | null
          stock_category?: string | null
          quantity?: number
          min_quantity?: number
          unit_cost?: number
          unit?: string
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          part_number?: string
          name?: string
          description?: string | null
          category?: string | null
          stock_category?: string | null
          quantity?: number
          min_quantity?: number
          unit_cost?: number
          unit?: string
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      issue_parts: {
        Row: {
          id: string
          issue_id: string
          part_id: string
          quantity_used: number
          created_at: string
        }
        Insert: {
          id?: string
          issue_id: string
          part_id: string
          quantity_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          issue_id?: string
          part_id?: string
          quantity_used?: number
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          operator_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          operator_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          operator_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
      }
    }
  }
}

// Convenience types
export type Category = Database['public']['Tables']['categories']['Row']
export type Machine = Database['public']['Tables']['machines']['Row']
export type Operator = Database['public']['Tables']['operators']['Row']
export type Issue = Database['public']['Tables']['issues']['Row']
export type SparePart = Database['public']['Tables']['spare_parts']['Row']
export type IssuePart = Database['public']['Tables']['issue_parts']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']
export type MaintenanceCategory = Database['public']['Tables']['maintenance_categories']['Row']

export type MachineStatus = 'Running' | 'Down' | 'Maintenance' | 'Minor Issue'
export type IssueType = 'breakdown' | 'minor' | 'preventive'
export type IssueSeverity = 'minor' | 'major' | 'severe'
export type IssueStatus = 'open' | 'in_progress' | 'resolved'
export type OperatorRole = 'operator' | 'admin' | 'technician'
