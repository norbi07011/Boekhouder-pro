// Auto-generated types from Supabase
// Generated on: 2024-12-16

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          organization_id: string
          record_id: string
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id: string
          record_id: string
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string
          record_id?: string
          table_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channel_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channel_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string
          id: string
          name: string
          organization_id: string
          type: Database["public"]["Enums"]["channel_type"] | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          organization_id: string
          type?: Database["public"]["Enums"]["channel_type"] | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          organization_id?: string
          type?: Database["public"]["Enums"]["channel_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_attachments: {
        Row: {
          created_at: string | null
          file_path: string
          file_size: number | null
          id: string
          message_id: string
          name: string | null
          type: Database["public"]["Enums"]["attachment_type"]
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          message_id: string
          name?: string | null
          type: Database["public"]["Enums"]["attachment_type"]
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          message_id?: string
          name?: string | null
          type?: Database["public"]["Enums"]["attachment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string
          created_at: string | null
          id: string
          is_edited: boolean | null
          text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          btw_number: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          kvk_number: string | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          btw_number?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          kvk_number?: string | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          btw_number?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          kvk_number?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"] | null
          client_id: string | null
          created_at: string | null
          file_path: string
          file_size: number
          id: string
          mime_type: string
          name: string
          organization_id: string
          quarter: number | null
          task_id: string | null
          updated_at: string | null
          uploaded_by: string
          year: number | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"] | null
          client_id?: string | null
          created_at?: string | null
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          name: string
          organization_id: string
          quarter?: number | null
          task_id?: string | null
          updated_at?: string | null
          uploaded_by: string
          year?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"] | null
          client_id?: string | null
          created_at?: string | null
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          name?: string
          organization_id?: string
          quarter?: number | null
          task_id?: string | null
          updated_at?: string | null
          uploaded_by?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dutch_tax_deadlines: {
        Row: {
          created_at: string | null
          date: string
          description_nl: string
          description_pl: string
          description_tr: string
          id: string
          is_recurring: boolean | null
        }
        Insert: {
          created_at?: string | null
          date: string
          description_nl: string
          description_pl: string
          description_tr: string
          id?: string
          is_recurring?: boolean | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description_nl?: string
          description_pl?: string
          description_tr?: string
          id?: string
          is_recurring?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          btw_number: string | null
          created_at: string | null
          id: string
          kvk_number: string | null
          logo_url: string | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          btw_number?: string | null
          created_at?: string | null
          id?: string
          kvk_number?: string | null
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          btw_number?: string | null
          created_at?: string | null
          id?: string
          kvk_number?: string | null
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          id: string
          linkedin: string | null
          location: string | null
          name: string
          organization_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          id: string
          linkedin?: string | null
          location?: string | null
          name: string
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          id?: string
          linkedin?: string | null
          location?: string | null
          name?: string
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          task_id: string
          type: Database["public"]["Enums"]["attachment_type"]
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          task_id: string
          type: Database["public"]["Enums"]["attachment_type"]
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          task_id?: string
          type?: Database["public"]["Enums"]["attachment_type"]
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          category: Database["public"]["Enums"]["task_category"] | null
          color: string | null
          created_at: string | null
          created_by: string | null
          description_nl: string | null
          description_pl: string | null
          description_tr: string | null
          id: string
          is_system: boolean | null
          label: string
          organization_id: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          title: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["task_category"] | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description_nl?: string | null
          description_pl?: string | null
          description_tr?: string | null
          id?: string
          is_system?: boolean | null
          label: string
          organization_id: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["task_category"] | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description_nl?: string | null
          description_pl?: string | null
          description_tr?: string | null
          id?: string
          is_system?: boolean | null
          label?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          category: Database["public"]["Enums"]["task_category"] | null
          client_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          due_time: string | null
          estimated_hours: number | null
          id: string
          organization_id: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          client_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_hours?: number | null
          id?: string
          organization_id: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_hours?: number | null
          id?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          compact_mode: boolean | null
          created_at: string | null
          dark_mode: boolean | null
          default_currency: string | null
          email_notifications: boolean | null
          fiscal_year_end: string | null
          id: string
          language: Database["public"]["Enums"]["app_language"] | null
          push_notifications: boolean | null
          sound_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          compact_mode?: boolean | null
          created_at?: string | null
          dark_mode?: boolean | null
          default_currency?: string | null
          email_notifications?: boolean | null
          fiscal_year_end?: string | null
          id?: string
          language?: Database["public"]["Enums"]["app_language"] | null
          push_notifications?: boolean | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          compact_mode?: boolean | null
          created_at?: string | null
          dark_mode?: boolean | null
          default_currency?: string | null
          email_notifications?: boolean | null
          fiscal_year_end?: string | null
          id?: string
          language?: Database["public"]["Enums"]["app_language"] | null
          push_notifications?: boolean | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      tasks_with_details: {
        Row: {
          assignee_avatar: string | null
          assignee_id: string | null
          assignee_name: string | null
          category: Database["public"]["Enums"]["task_category"] | null
          client_id: string | null
          client_kvk: string | null
          client_name: string | null
          created_at: string | null
          created_by: string | null
          creator_name: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          estimated_hours: number | null
          id: string | null
          organization_id: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      team_members_stats: {
        Row: {
          active_tasks: number | null
          avatar_url: string | null
          completed_tasks: number | null
          email: string | null
          id: string | null
          name: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["user_status"] | null
        }
        Relationships: []
      }
      unread_notifications_count: {
        Row: {
          unread_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
      upcoming_deadlines: {
        Row: {
          assignee_name: string | null
          client_name: string | null
          due_date: string | null
          organization_id: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_id: string | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_notification: {
        Args: {
          p_link?: string
          p_message: string
          p_organization_id: string
          p_related_task_id?: string
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: string
      }
      get_dashboard_stats: {
        Args: { org_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_language: "PL" | "TR" | "NL"
      attachment_type: "image" | "file" | "voice" | "gif" | "sticker"
      channel_type: "group" | "dm"
      document_category:
        | "invoice"
        | "receipt"
        | "tax_form"
        | "contract"
        | "report"
        | "other"
      notification_type:
        | "task_assigned"
        | "task_due"
        | "message"
        | "document"
        | "system"
      task_category:
        | "General"
        | "Tax"
        | "Payroll"
        | "Meeting"
        | "Audit"
        | "Advisory"
      task_priority: "Low" | "Medium" | "High"
      task_status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
      user_role: "Accountant" | "Manager" | "Admin"
      user_status: "Online" | "Offline" | "Busy"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]
export type Views<T extends keyof Database["public"]["Views"]> = Database["public"]["Views"][T]["Row"]

// Convenience type aliases
export type Profile = Tables<"profiles">
export type Organization = Tables<"organizations">
export type Client = Tables<"clients">
export type Task = Tables<"tasks">
export type TaskTemplate = Tables<"task_templates">
export type TaskAttachment = Tables<"task_attachments">
export type ChatChannel = Tables<"chat_channels">
export type ChatChannelMember = Tables<"chat_channel_members">
export type ChatMessage = Tables<"chat_messages">
export type ChatMessageAttachment = Tables<"chat_message_attachments">
export type Document = Tables<"documents">
export type Notification = Tables<"notifications">
export type UserSettings = Tables<"user_settings">
export type AuditLog = Tables<"audit_logs">
export type DutchTaxDeadline = Tables<"dutch_tax_deadlines">

// View types
export type TaskWithDetails = Views<"tasks_with_details">
export type TeamMemberStats = Views<"team_members_stats">
export type UpcomingDeadline = Views<"upcoming_deadlines">
