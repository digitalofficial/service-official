export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          organization_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string
          user_agent?: string | null
          user_id?: string | null
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
      automation_logs: {
        Row: {
          actions_executed: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          organization_id: string | null
          rule_id: string
          status: string | null
          triggered_by: string | null
          updated_at: string | null
        }
        Insert: {
          actions_executed?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string | null
          rule_id: string
          status?: string | null
          triggered_by?: string | null
          updated_at?: string | null
        }
        Update: {
          actions_executed?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string | null
          rule_id?: string
          status?: string | null
          triggered_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          organization_id: string
          run_count: number | null
          trigger_conditions: Json | null
          trigger_event: string
          updated_at: string | null
        }
        Insert: {
          actions: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          organization_id: string
          run_count?: number | null
          trigger_conditions?: Json | null
          trigger_event: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          organization_id?: string
          run_count?: number | null
          trigger_conditions?: Json | null
          trigger_event?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprint_sheets: {
        Row: {
          blueprint_id: string
          created_at: string | null
          discipline: string | null
          height_px: number | null
          id: string
          metadata: Json | null
          organization_id: string | null
          page_number: number
          public_url: string | null
          scale: string | null
          sheet_number: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          width_px: number | null
        }
        Insert: {
          blueprint_id: string
          created_at?: string | null
          discipline?: string | null
          height_px?: number | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          page_number: number
          public_url?: string | null
          scale?: string | null
          sheet_number?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          width_px?: number | null
        }
        Update: {
          blueprint_id?: string
          created_at?: string | null
          discipline?: string | null
          height_px?: number | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          page_number?: number
          public_url?: string | null
          scale?: string | null
          sheet_number?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          width_px?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blueprint_sheets_blueprint_id_fkey"
            columns: ["blueprint_id"]
            isOneToOne: false
            referencedRelation: "blueprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blueprint_sheets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprints: {
        Row: {
          created_at: string | null
          description: string | null
          discipline: string | null
          file_id: string | null
          id: string
          is_processed: boolean | null
          name: string
          organization_id: string
          page_count: number | null
          processing_status: string | null
          project_id: string | null
          public_url: string | null
          scale: string | null
          storage_path: string | null
          updated_at: string | null
          uploaded_by: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discipline?: string | null
          file_id?: string | null
          id?: string
          is_processed?: boolean | null
          name: string
          organization_id: string
          page_count?: number | null
          processing_status?: string | null
          project_id?: string | null
          public_url?: string | null
          scale?: string | null
          storage_path?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discipline?: string | null
          file_id?: string | null
          id?: string
          is_processed?: boolean | null
          name?: string
          organization_id?: string
          page_count?: number | null
          processing_status?: string | null
          project_id?: string | null
          public_url?: string | null
          scale?: string | null
          storage_path?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blueprints_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blueprints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blueprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blueprints_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_categories: {
        Row: {
          budgeted_amount: number | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number | null
          organization_id: string | null
          project_id: string
          type: Database["public"]["Enums"]["budget_category_type"]
          updated_at: string | null
        }
        Insert: {
          budgeted_amount?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
          organization_id?: string | null
          project_id: string
          type: Database["public"]["Enums"]["budget_category_type"]
          updated_at?: string | null
        }
        Update: {
          budgeted_amount?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
          organization_id?: string | null
          project_id?: string
          type?: Database["public"]["Enums"]["budget_category_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_line_items: {
        Row: {
          budget_category_id: string
          budgeted_amount: number | null
          created_at: string | null
          description: string | null
          expense_id: string | null
          id: string
          material_id: string | null
          name: string
          order_index: number | null
          organization_id: string | null
          project_id: string
          time_entry_id: string | null
          updated_at: string | null
        }
        Insert: {
          budget_category_id: string
          budgeted_amount?: number | null
          created_at?: string | null
          description?: string | null
          expense_id?: string | null
          id?: string
          material_id?: string | null
          name: string
          order_index?: number | null
          organization_id?: string | null
          project_id: string
          time_entry_id?: string | null
          updated_at?: string | null
        }
        Update: {
          budget_category_id?: string
          budgeted_amount?: number | null
          created_at?: string | null
          description?: string | null
          expense_id?: string | null
          id?: string
          material_id?: string | null
          name?: string
          order_index?: number | null
          organization_id?: string | null
          project_id?: string
          time_entry_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_line_items_budget_category_id_fkey"
            columns: ["budget_category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_line_items_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_line_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "project_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_line_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_line_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_line_items_time_entry_id_fkey"
            columns: ["time_entry_id"]
            isOneToOne: false
            referencedRelation: "time_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      change_orders: {
        Row: {
          amount: number | null
          approved_amount: number | null
          approved_at: string | null
          approved_by: string | null
          client_signature_url: string | null
          co_number: string | null
          created_at: string | null
          created_by: string | null
          declined_at: string | null
          description: string | null
          id: string
          organization_id: string | null
          project_id: string
          reason: string | null
          schedule_days_impact: number | null
          status: Database["public"]["Enums"]["change_order_status"] | null
          submitted_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          client_signature_url?: string | null
          co_number?: string | null
          created_at?: string | null
          created_by?: string | null
          declined_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          project_id: string
          reason?: string | null
          schedule_days_impact?: number | null
          status?: Database["public"]["Enums"]["change_order_status"] | null
          submitted_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          client_signature_url?: string | null
          co_number?: string | null
          created_at?: string | null
          created_by?: string | null
          declined_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          project_id?: string
          reason?: string | null
          schedule_days_impact?: number | null
          status?: Database["public"]["Enums"]["change_order_status"] | null
          submitted_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel: Database["public"]["Enums"]["message_channel"]
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          email_address: string | null
          id: string
          is_archived: boolean | null
          last_message_at: string | null
          organization_id: string
          phone_number: string | null
          project_id: string | null
          subject: string | null
        }
        Insert: {
          channel: Database["public"]["Enums"]["message_channel"]
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          email_address?: string | null
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
          organization_id: string
          phone_number?: string | null
          project_id?: string | null
          subject?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["message_channel"]
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          email_address?: string | null
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
          organization_id?: string
          phone_number?: string | null
          project_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          billing_address: Json | null
          billing_same_as_service: boolean | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          email: string | null
          email_secondary: string | null
          first_name: string | null
          id: string
          internal_notes: string | null
          is_active: boolean | null
          last_name: string | null
          notes: string | null
          organization_id: string
          outstanding_balance: number | null
          phone: string | null
          phone_secondary: string | null
          portal_access: boolean | null
          portal_token: string | null
          sms_opt_in: boolean | null
          source: string | null
          state: string | null
          tags: string[] | null
          total_revenue: number | null
          type: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          billing_address?: Json | null
          billing_same_as_service?: boolean | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          email_secondary?: string | null
          first_name?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean | null
          last_name?: string | null
          notes?: string | null
          organization_id: string
          outstanding_balance?: number | null
          phone?: string | null
          phone_secondary?: string | null
          portal_access?: boolean | null
          portal_token?: string | null
          sms_opt_in?: boolean | null
          source?: string | null
          state?: string | null
          tags?: string[] | null
          total_revenue?: number | null
          type?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          billing_address?: Json | null
          billing_same_as_service?: boolean | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          email_secondary?: string | null
          first_name?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean | null
          last_name?: string | null
          notes?: string | null
          organization_id?: string
          outstanding_balance?: number | null
          phone?: string | null
          phone_secondary?: string | null
          portal_access?: boolean | null
          portal_token?: string | null
          sms_opt_in?: boolean | null
          source?: string | null
          state?: string | null
          tags?: string[] | null
          total_revenue?: number | null
          type?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          areas_worked: string | null
          created_at: string | null
          crew_count: number | null
          crew_hours: number | null
          id: string
          inspectors: string | null
          issues: string | null
          log_date: string
          organization_id: string | null
          photos_attached: boolean | null
          precipitation: boolean | null
          project_id: string
          safety_incidents: string | null
          submitted_by: string
          temperature_high: number | null
          temperature_low: number | null
          updated_at: string | null
          visitors: string | null
          weather: Database["public"]["Enums"]["weather_condition"] | null
          weather_delay: boolean | null
          weather_delay_hours: number | null
          wind_speed: number | null
          work_performed: string
        }
        Insert: {
          areas_worked?: string | null
          created_at?: string | null
          crew_count?: number | null
          crew_hours?: number | null
          id?: string
          inspectors?: string | null
          issues?: string | null
          log_date: string
          organization_id?: string | null
          photos_attached?: boolean | null
          precipitation?: boolean | null
          project_id: string
          safety_incidents?: string | null
          submitted_by: string
          temperature_high?: number | null
          temperature_low?: number | null
          updated_at?: string | null
          visitors?: string | null
          weather?: Database["public"]["Enums"]["weather_condition"] | null
          weather_delay?: boolean | null
          weather_delay_hours?: number | null
          wind_speed?: number | null
          work_performed: string
        }
        Update: {
          areas_worked?: string | null
          created_at?: string | null
          crew_count?: number | null
          crew_hours?: number | null
          id?: string
          inspectors?: string | null
          issues?: string | null
          log_date?: string
          organization_id?: string | null
          photos_attached?: boolean | null
          precipitation?: boolean | null
          project_id?: string
          safety_incidents?: string | null
          submitted_by?: string
          temperature_high?: number | null
          temperature_low?: number | null
          updated_at?: string | null
          visitors?: string | null
          weather?: Database["public"]["Enums"]["weather_condition"] | null
          weather_delay?: boolean | null
          weather_delay_hours?: number | null
          wind_speed?: number | null
          work_performed?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          condition: Database["public"]["Enums"]["equipment_condition"] | null
          created_at: string | null
          current_location: string | null
          current_value: number | null
          daily_rate: number | null
          hourly_rate: number | null
          id: string
          insurance_expiry: string | null
          insurance_policy: string | null
          is_active: boolean | null
          last_service_date: string | null
          license_plate: string | null
          make: string | null
          meter_reading: number | null
          meter_unit: string | null
          model: string | null
          name: string
          next_service_date: string | null
          notes: string | null
          organization_id: string
          photo_url: string | null
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          service_interval_days: number | null
          status: Database["public"]["Enums"]["equipment_status"] | null
          tags: string[] | null
          type: string | null
          updated_at: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          condition?: Database["public"]["Enums"]["equipment_condition"] | null
          created_at?: string | null
          current_location?: string | null
          current_value?: number | null
          daily_rate?: number | null
          hourly_rate?: number | null
          id?: string
          insurance_expiry?: string | null
          insurance_policy?: string | null
          is_active?: boolean | null
          last_service_date?: string | null
          license_plate?: string | null
          make?: string | null
          meter_reading?: number | null
          meter_unit?: string | null
          model?: string | null
          name: string
          next_service_date?: string | null
          notes?: string | null
          organization_id: string
          photo_url?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          service_interval_days?: number | null
          status?: Database["public"]["Enums"]["equipment_status"] | null
          tags?: string[] | null
          type?: string | null
          updated_at?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          condition?: Database["public"]["Enums"]["equipment_condition"] | null
          created_at?: string | null
          current_location?: string | null
          current_value?: number | null
          daily_rate?: number | null
          hourly_rate?: number | null
          id?: string
          insurance_expiry?: string | null
          insurance_policy?: string | null
          is_active?: boolean | null
          last_service_date?: string | null
          license_plate?: string | null
          make?: string | null
          meter_reading?: number | null
          meter_unit?: string | null
          model?: string | null
          name?: string
          next_service_date?: string | null
          notes?: string | null
          organization_id?: string
          photo_url?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          service_interval_days?: number | null
          status?: Database["public"]["Enums"]["equipment_status"] | null
          tags?: string[] | null
          type?: string | null
          updated_at?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_assignments: {
        Row: {
          actual_return_date: string | null
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          daily_rate: number | null
          end_date: string | null
          equipment_id: string
          id: string
          job_id: string | null
          notes: string | null
          organization_id: string | null
          project_id: string | null
          start_date: string
          total_cost: number | null
          updated_at: string | null
        }
        Insert: {
          actual_return_date?: string | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          daily_rate?: number | null
          end_date?: string | null
          equipment_id: string
          id?: string
          job_id?: string | null
          notes?: string | null
          organization_id?: string | null
          project_id?: string | null
          start_date: string
          total_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_return_date?: string | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          daily_rate?: number | null
          end_date?: string | null
          equipment_id?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          organization_id?: string | null
          project_id?: string | null
          start_date?: string
          total_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_assignments_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_maintenance: {
        Row: {
          completed_date: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          equipment_id: string
          id: string
          meter_reading: number | null
          next_service_date: string | null
          notes: string | null
          organization_id: string | null
          performed_by: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["maintenance_status"] | null
          title: string
          type: Database["public"]["Enums"]["maintenance_type"] | null
          updated_at: string | null
          vendor_name: string | null
        }
        Insert: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          equipment_id: string
          id?: string
          meter_reading?: number | null
          next_service_date?: string | null
          notes?: string | null
          organization_id?: string | null
          performed_by?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          title: string
          type?: Database["public"]["Enums"]["maintenance_type"] | null
          updated_at?: string | null
          vendor_name?: string | null
        }
        Update: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          equipment_id?: string
          id?: string
          meter_reading?: number | null
          next_service_date?: string | null
          notes?: string | null
          organization_id?: string | null
          performed_by?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["maintenance_type"] | null
          updated_at?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintenance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintenance_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_line_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          estimate_id: string
          id: string
          is_optional: boolean | null
          is_taxable: boolean | null
          markup_percent: number | null
          material_id: string | null
          name: string
          order_index: number | null
          organization_id: string | null
          quantity: number | null
          section_id: string | null
          takeoff_item_id: string | null
          total: number | null
          unit: string | null
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          estimate_id: string
          id?: string
          is_optional?: boolean | null
          is_taxable?: boolean | null
          markup_percent?: number | null
          material_id?: string | null
          name: string
          order_index?: number | null
          organization_id?: string | null
          quantity?: number | null
          section_id?: string | null
          takeoff_item_id?: string | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          estimate_id?: string
          id?: string
          is_optional?: boolean | null
          is_taxable?: boolean | null
          markup_percent?: number | null
          material_id?: string | null
          name?: string
          order_index?: number | null
          organization_id?: string | null
          quantity?: number | null
          section_id?: string | null
          takeoff_item_id?: string | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_line_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "estimate_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_takeoff_item_id_fkey"
            columns: ["takeoff_item_id"]
            isOneToOne: false
            referencedRelation: "takeoff_items"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_sections: {
        Row: {
          created_at: string | null
          estimate_id: string
          id: string
          name: string
          order_index: number | null
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estimate_id: string
          id?: string
          name: string
          order_index?: number | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estimate_id?: string
          id?: string
          name?: string
          order_index?: number | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_sections_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_sections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          approved_at: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          decline_reason: string | null
          declined_at: string | null
          deleted_at: string | null
          description: string | null
          discount_amount: number | null
          discount_type: string | null
          discount_value: number | null
          estimate_number: string | null
          expiry_date: string | null
          id: string
          internal_notes: string | null
          issue_date: string | null
          job_id: string | null
          notes: string | null
          organization_id: string
          project_id: string | null
          signature_url: string | null
          signed_at: string | null
          signed_by_ip: string | null
          signed_by_name: string | null
          status: Database["public"]["Enums"]["estimate_status"] | null
          subtotal: number | null
          takeoff_id: string | null
          tax_amount: number | null
          tax_rate: number | null
          terms: string | null
          title: string
          total: number | null
          updated_at: string | null
          view_count: number | null
          viewed_at: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          estimate_number?: string | null
          expiry_date?: string | null
          id?: string
          internal_notes?: string | null
          issue_date?: string | null
          job_id?: string | null
          notes?: string | null
          organization_id: string
          project_id?: string | null
          signature_url?: string | null
          signed_at?: string | null
          signed_by_ip?: string | null
          signed_by_name?: string | null
          status?: Database["public"]["Enums"]["estimate_status"] | null
          subtotal?: number | null
          takeoff_id?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          title: string
          total?: number | null
          updated_at?: string | null
          view_count?: number | null
          viewed_at?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          estimate_number?: string | null
          expiry_date?: string | null
          id?: string
          internal_notes?: string | null
          issue_date?: string | null
          job_id?: string | null
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          signature_url?: string | null
          signed_at?: string | null
          signed_by_ip?: string | null
          signed_by_name?: string | null
          status?: Database["public"]["Enums"]["estimate_status"] | null
          subtotal?: number | null
          takeoff_id?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          title?: string
          total?: number | null
          updated_at?: string | null
          view_count?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_takeoff_id_fkey"
            columns: ["takeoff_id"]
            isOneToOne: false
            referencedRelation: "takeoffs"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          budget_category_id: string | null
          category: Database["public"]["Enums"]["expense_category"] | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          description: string | null
          expense_date: string | null
          id: string
          is_billable: boolean | null
          is_reimbursable: boolean | null
          job_id: string | null
          organization_id: string
          project_id: string | null
          receipt_file_id: string | null
          status: string | null
          submitted_by: string | null
          tax_amount: number | null
          title: string
          total_amount: number
          updated_at: string | null
          vendor_invoice_number: string | null
          vendor_name: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          budget_category_id?: string | null
          category?: Database["public"]["Enums"]["expense_category"] | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          is_billable?: boolean | null
          is_reimbursable?: boolean | null
          job_id?: string | null
          organization_id: string
          project_id?: string | null
          receipt_file_id?: string | null
          status?: string | null
          submitted_by?: string | null
          tax_amount?: number | null
          title: string
          total_amount: number
          updated_at?: string | null
          vendor_invoice_number?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          budget_category_id?: string | null
          category?: Database["public"]["Enums"]["expense_category"] | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          is_billable?: boolean | null
          is_reimbursable?: boolean | null
          job_id?: string | null
          organization_id?: string
          project_id?: string | null
          receipt_file_id?: string | null
          status?: string | null
          submitted_by?: string | null
          tax_amount?: number | null
          title?: string
          total_amount?: number
          updated_at?: string | null
          vendor_invoice_number?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_budget_category_id_fkey"
            columns: ["budget_category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_receipt_file_id_fkey"
            columns: ["receipt_file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          description: string | null
          estimate_id: string | null
          file_type: Database["public"]["Enums"]["file_type"] | null
          id: string
          invoice_id: string | null
          is_public: boolean | null
          job_id: string | null
          mime_type: string | null
          name: string
          organization_id: string
          original_name: string
          project_id: string | null
          public_url: string | null
          size_bytes: number | null
          storage_path: string
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          estimate_id?: string | null
          file_type?: Database["public"]["Enums"]["file_type"] | null
          id?: string
          invoice_id?: string | null
          is_public?: boolean | null
          job_id?: string | null
          mime_type?: string | null
          name: string
          organization_id: string
          original_name: string
          project_id?: string | null
          public_url?: string | null
          size_bytes?: number | null
          storage_path: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          estimate_id?: string | null
          file_type?: Database["public"]["Enums"]["file_type"] | null
          id?: string
          invoice_id?: string | null
          is_public?: boolean | null
          job_id?: string | null
          mime_type?: string | null
          name?: string
          organization_id?: string
          original_name?: string
          project_id?: string | null
          public_url?: string | null
          size_bytes?: number | null
          storage_path?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "files_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gantt_dependencies: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          dependency_type:
            | Database["public"]["Enums"]["gantt_dependency_type"]
            | null
          id: string
          lag_days: number | null
          organization_id: string | null
          predecessor_id: string
          project_id: string
          successor_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          dependency_type?:
            | Database["public"]["Enums"]["gantt_dependency_type"]
            | null
          id?: string
          lag_days?: number | null
          organization_id?: string | null
          predecessor_id: string
          project_id: string
          successor_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          dependency_type?:
            | Database["public"]["Enums"]["gantt_dependency_type"]
            | null
          id?: string
          lag_days?: number | null
          organization_id?: string | null
          predecessor_id?: string
          project_id?: string
          successor_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gantt_dependencies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gantt_dependencies_predecessor_id_fkey"
            columns: ["predecessor_id"]
            isOneToOne: false
            referencedRelation: "gantt_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gantt_dependencies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gantt_dependencies_successor_id_fkey"
            columns: ["successor_id"]
            isOneToOne: false
            referencedRelation: "gantt_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      gantt_tasks: {
        Row: {
          assigned_to: string | null
          color: string | null
          created_at: string | null
          deleted_at: string | null
          duration_days: number | null
          end_date: string
          id: string
          is_milestone: boolean | null
          milestone_id: string | null
          name: string
          notes: string | null
          order_index: number | null
          organization_id: string | null
          parent_task_id: string | null
          phase_id: string | null
          progress: number | null
          project_id: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          duration_days?: number | null
          end_date: string
          id?: string
          is_milestone?: boolean | null
          milestone_id?: string | null
          name: string
          notes?: string | null
          order_index?: number | null
          organization_id?: string | null
          parent_task_id?: string | null
          phase_id?: string | null
          progress?: number | null
          project_id: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          duration_days?: number | null
          end_date?: string
          id?: string
          is_milestone?: boolean | null
          milestone_id?: string | null
          name?: string
          notes?: string | null
          order_index?: number | null
          organization_id?: string | null
          parent_task_id?: string | null
          phase_id?: string | null
          progress?: number | null
          project_id?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gantt_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gantt_tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gantt_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gantt_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "gantt_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gantt_tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gantt_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_items: {
        Row: {
          created_at: string | null
          id: string
          inspection_id: string
          is_required: boolean | null
          label: string
          notes: string | null
          order_index: number | null
          organization_id: string | null
          photo_ids: string[] | null
          responded_at: string | null
          section_name: string | null
          signature_url: string | null
          status: Database["public"]["Enums"]["inspection_item_status"] | null
          template_item_id: string | null
          type: Database["public"]["Enums"]["checklist_item_type"] | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inspection_id: string
          is_required?: boolean | null
          label: string
          notes?: string | null
          order_index?: number | null
          organization_id?: string | null
          photo_ids?: string[] | null
          responded_at?: string | null
          section_name?: string | null
          signature_url?: string | null
          status?: Database["public"]["Enums"]["inspection_item_status"] | null
          template_item_id?: string | null
          type?: Database["public"]["Enums"]["checklist_item_type"] | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inspection_id?: string
          is_required?: boolean | null
          label?: string
          notes?: string | null
          order_index?: number | null
          organization_id?: string | null
          photo_ids?: string[] | null
          responded_at?: string | null
          section_name?: string | null
          signature_url?: string | null
          status?: Database["public"]["Enums"]["inspection_item_status"] | null
          template_item_id?: string | null
          type?: Database["public"]["Enums"]["checklist_item_type"] | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_items_template_item_id_fkey"
            columns: ["template_item_id"]
            isOneToOne: false
            referencedRelation: "template_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          organization_id: string | null
          trade: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          organization_id?: string | null
          trade?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          organization_id?: string | null
          trade?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          equipment_id: string | null
          fail_count: number | null
          id: string
          inspection_number: string | null
          job_id: string | null
          location: string | null
          na_count: number | null
          notes: string | null
          organization_id: string
          overall_result:
            | Database["public"]["Enums"]["inspection_result"]
            | null
          pass_count: number | null
          project_id: string | null
          scheduled_date: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["inspection_status"] | null
          template_id: string | null
          title: string
          total_items: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          equipment_id?: string | null
          fail_count?: number | null
          id?: string
          inspection_number?: string | null
          job_id?: string | null
          location?: string | null
          na_count?: number | null
          notes?: string | null
          organization_id: string
          overall_result?:
            | Database["public"]["Enums"]["inspection_result"]
            | null
          pass_count?: number | null
          project_id?: string | null
          scheduled_date?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["inspection_status"] | null
          template_id?: string | null
          title: string
          total_items?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          equipment_id?: string | null
          fail_count?: number | null
          id?: string
          inspection_number?: string | null
          job_id?: string | null
          location?: string | null
          na_count?: number | null
          notes?: string | null
          organization_id?: string
          overall_result?:
            | Database["public"]["Enums"]["inspection_result"]
            | null
          pass_count?: number | null
          project_id?: string | null
          scheduled_date?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["inspection_status"] | null
          template_id?: string | null
          title?: string
          total_items?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "inspection_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          invoice_id: string
          is_taxable: boolean | null
          name: string
          order_index: number | null
          organization_id: string | null
          quantity: number | null
          total: number | null
          unit: string | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id: string
          is_taxable?: boolean | null
          name: string
          order_index?: number | null
          organization_id?: string | null
          quantity?: number | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string
          is_taxable?: boolean | null
          name?: string
          order_index?: number | null
          organization_id?: string | null
          quantity?: number | null
          total?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          deleted_at: string | null
          discount_amount: number | null
          due_date: string | null
          estimate_id: string | null
          id: string
          internal_notes: string | null
          invoice_number: string | null
          issue_date: string | null
          job_id: string | null
          notes: string | null
          organization_id: string
          paid_at: string | null
          project_id: string | null
          reminder_sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number | null
          tax_amount: number | null
          terms: string | null
          title: string | null
          total: number | null
          type: string | null
          updated_at: string | null
          view_count: number | null
          viewed_at: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          discount_amount?: number | null
          due_date?: string | null
          estimate_id?: string | null
          id?: string
          internal_notes?: string | null
          invoice_number?: string | null
          issue_date?: string | null
          job_id?: string | null
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          project_id?: string | null
          reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          terms?: string | null
          title?: string | null
          total?: number | null
          type?: string | null
          updated_at?: string | null
          view_count?: number | null
          viewed_at?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          discount_amount?: number | null
          due_date?: string | null
          estimate_id?: string | null
          id?: string
          internal_notes?: string | null
          invoice_number?: string | null
          issue_date?: string | null
          job_id?: string | null
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          project_id?: string | null
          reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          terms?: string | null
          title?: string | null
          total?: number | null
          type?: string | null
          updated_at?: string | null
          view_count?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      job_reminders: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          error_message: string | null
          id: string
          job_id: string
          message_body: string
          organization_id: string
          phone_number: string
          profile_id: string
          remind_at: string
          reminder_type: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          error_message?: string | null
          id?: string
          job_id: string
          message_body: string
          organization_id: string
          phone_number: string
          profile_id: string
          remind_at: string
          reminder_type: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          error_message?: string | null
          id?: string
          job_id?: string
          message_body?: string
          organization_id?: string
          phone_number?: string
          profile_id?: string
          remind_at?: string
          reminder_type?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_reminders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reminders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          address_line1: string | null
          assigned_to: string | null
          city: string | null
          completion_notes: string | null
          coordinates: Json | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          deleted_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          instructions: string | null
          job_number: string | null
          organization_id: string
          priority: string | null
          project_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          state: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          address_line1?: string | null
          assigned_to?: string | null
          city?: string | null
          completion_notes?: string | null
          coordinates?: Json | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructions?: string | null
          job_number?: string | null
          organization_id: string
          priority?: string | null
          project_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          address_line1?: string | null
          assigned_to?: string | null
          city?: string | null
          completion_notes?: string | null
          coordinates?: Json | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructions?: string | null
          job_number?: string | null
          organization_id?: string
          priority?: string | null
          project_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          contact_address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          deleted_at: string | null
          description: string | null
          estimated_value: number | null
          follow_up_date: string | null
          id: string
          notes: string | null
          organization_id: string
          source: string | null
          source_detail: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          estimated_value?: number | null
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          source?: string | null
          source_detail?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          estimated_value?: number | null
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          source?: string | null
          source_detail?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      material_catalog: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          markup_percent: number | null
          name: string
          organization_id: string
          sku: string | null
          supplier: string | null
          supplier_sku: string | null
          trade: string | null
          unit: string | null
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          markup_percent?: number | null
          name: string
          organization_id: string
          sku?: string | null
          supplier?: string | null
          supplier_sku?: string | null
          trade?: string | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          markup_percent?: number | null
          name?: string
          organization_id?: string
          sku?: string | null
          supplier?: string | null
          supplier_sku?: string | null
          trade?: string | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["message_channel"]
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          delivered_at: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          media_urls: string[] | null
          organization_id: string
          read_at: string | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
          twilio_sid: string | null
        }
        Insert: {
          body: string
          channel: Database["public"]["Enums"]["message_channel"]
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          delivered_at?: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          media_urls?: string[] | null
          organization_id: string
          read_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          twilio_sid?: string | null
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["message_channel"]
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          media_urls?: string[] | null
          organization_id?: string
          read_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          channels: Database["public"]["Enums"]["message_channel"][] | null
          created_at: string | null
          data: Json | null
          deleted_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          organization_id: string
          read_at: string | null
          sent_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          channels?: Database["public"]["Enums"]["message_channel"][] | null
          created_at?: string | null
          data?: Json | null
          deleted_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          organization_id: string
          read_at?: string | null
          sent_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          channels?: Database["public"]["Enums"]["message_channel"][] | null
          created_at?: string | null
          data?: Json | null
          deleted_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          organization_id?: string
          read_at?: string | null
          sent_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_sms_settings: {
        Row: {
          created_at: string | null
          default_reminder_1: string | null
          default_reminder_2: string | null
          google_maps_api_key: string | null
          id: string
          is_enabled: boolean | null
          notify_customer_booked: boolean | null
          notify_customer_completed: boolean | null
          notify_customer_en_route: boolean | null
          organization_id: string
          send_assignment_sms: boolean | null
          send_completion_sms: boolean | null
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          twilio_phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_reminder_1?: string | null
          default_reminder_2?: string | null
          google_maps_api_key?: string | null
          id?: string
          is_enabled?: boolean | null
          notify_customer_booked?: boolean | null
          notify_customer_completed?: boolean | null
          notify_customer_en_route?: boolean | null
          organization_id: string
          send_assignment_sms?: boolean | null
          send_completion_sms?: boolean | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_reminder_1?: string | null
          default_reminder_2?: string | null
          google_maps_api_key?: string | null
          id?: string
          is_enabled?: boolean | null
          notify_customer_booked?: boolean | null
          notify_customer_completed?: boolean | null
          notify_customer_en_route?: boolean | null
          organization_id?: string
          send_assignment_sms?: boolean | null
          send_completion_sms?: boolean | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_sms_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          customer_portal_permissions: Json | null
          deleted_at: string | null
          email: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          insurance_number: string | null
          license_number: string | null
          logo_url: string | null
          name: string
          payments_enabled: boolean | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          settings: Json | null
          slug: string
          state: string | null
          stripe_account_id: string | null
          stripe_customer_id: string | null
          stripe_publishable_key: string | null
          stripe_secret_key: string | null
          stripe_subscription_id: string | null
          stripe_webhook_secret: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tax_id: string | null
          timezone: string | null
          trial_ends_at: string | null
          updated_at: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          customer_portal_permissions?: Json | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          insurance_number?: string | null
          license_number?: string | null
          logo_url?: string | null
          name: string
          payments_enabled?: boolean | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug: string
          state?: string | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          stripe_subscription_id?: string | null
          stripe_webhook_secret?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tax_id?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          customer_portal_permissions?: Json | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          insurance_number?: string | null
          license_number?: string | null
          logo_url?: string | null
          name?: string
          payments_enabled?: boolean | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug?: string
          state?: string | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          stripe_subscription_id?: string | null
          stripe_webhook_secret?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tax_id?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          currency: string | null
          customer_id: string | null
          deleted_at: string | null
          id: string
          invoice_id: string | null
          method: Database["public"]["Enums"]["payment_method"] | null
          notes: string | null
          organization_id: string
          reference: string | null
          refunded_amount: number | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          id?: string
          invoice_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"] | null
          notes?: string | null
          organization_id: string
          reference?: string | null
          refunded_amount?: number | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          id?: string
          invoice_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"] | null
          notes?: string | null
          organization_id?: string
          reference?: string | null
          refunded_amount?: number | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          caption: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_after: boolean | null
          is_before: boolean | null
          is_public: boolean | null
          job_id: string | null
          location: Json | null
          organization_id: string
          phase_id: string | null
          project_id: string | null
          public_url: string
          storage_path: string
          tags: string[] | null
          taken_at: string | null
          thumbnail_url: string | null
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_after?: boolean | null
          is_before?: boolean | null
          is_public?: boolean | null
          job_id?: string | null
          location?: Json | null
          organization_id: string
          phase_id?: string | null
          project_id?: string | null
          public_url: string
          storage_path: string
          tags?: string[] | null
          taken_at?: string | null
          thumbnail_url?: string | null
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_after?: boolean | null
          is_before?: boolean | null
          is_public?: boolean | null
          job_id?: string | null
          location?: Json | null
          organization_id?: string
          phase_id?: string | null
          project_id?: string | null
          public_url?: string
          storage_path?: string
          tags?: string[] | null
          taken_at?: string | null
          thumbnail_url?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      po_line_items: {
        Row: {
          catalog_material_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          notes: string | null
          order_index: number | null
          organization_id: string | null
          project_material_id: string | null
          purchase_order_id: string
          quantity: number
          quantity_received: number | null
          sku: string | null
          total: number
          unit: string | null
          unit_cost: number
          updated_at: string | null
        }
        Insert: {
          catalog_material_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          order_index?: number | null
          organization_id?: string | null
          project_material_id?: string | null
          purchase_order_id: string
          quantity: number
          quantity_received?: number | null
          sku?: string | null
          total: number
          unit?: string | null
          unit_cost: number
          updated_at?: string | null
        }
        Update: {
          catalog_material_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          order_index?: number | null
          organization_id?: string | null
          project_material_id?: string | null
          purchase_order_id?: string
          quantity?: number
          quantity_received?: number | null
          sku?: string | null
          total?: number
          unit?: string | null
          unit_cost?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "po_line_items_catalog_material_id_fkey"
            columns: ["catalog_material_id"]
            isOneToOne: false
            referencedRelation: "material_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_line_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_line_items_project_material_id_fkey"
            columns: ["project_material_id"]
            isOneToOne: false
            referencedRelation: "project_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_line_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      po_receipt_items: {
        Row: {
          condition: Database["public"]["Enums"]["po_receipt_condition"] | null
          created_at: string | null
          id: string
          notes: string | null
          organization_id: string | null
          po_line_item_id: string
          quantity_received: number
          receipt_id: string
          updated_at: string | null
        }
        Insert: {
          condition?: Database["public"]["Enums"]["po_receipt_condition"] | null
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          po_line_item_id: string
          quantity_received: number
          receipt_id: string
          updated_at?: string | null
        }
        Update: {
          condition?: Database["public"]["Enums"]["po_receipt_condition"] | null
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          po_line_item_id?: string
          quantity_received?: number
          receipt_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "po_receipt_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_receipt_items_po_line_item_id_fkey"
            columns: ["po_line_item_id"]
            isOneToOne: false
            referencedRelation: "po_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "po_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      po_receipts: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          organization_id: string | null
          photo_ids: string[] | null
          purchase_order_id: string
          received_at: string | null
          received_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          photo_ids?: string[] | null
          purchase_order_id: string
          received_at?: string | null
          received_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          photo_ids?: string[] | null
          purchase_order_id?: string
          received_at?: string | null
          received_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "po_receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_receipts_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_receipts_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_activity_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          organization_id: string | null
          portal_user_id: string
          updated_at: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id?: string | null
          portal_user_id: string
          updated_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id?: string | null
          portal_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_activity_log_portal_user_id_fkey"
            columns: ["portal_user_id"]
            isOneToOne: false
            referencedRelation: "portal_users"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_messages: {
        Row: {
          attachments: string[] | null
          body: string
          created_at: string | null
          direction: string
          id: string
          is_read: boolean | null
          organization_id: string
          portal_user_id: string | null
          project_id: string | null
          read_at: string | null
          staff_user_id: string | null
        }
        Insert: {
          attachments?: string[] | null
          body: string
          created_at?: string | null
          direction: string
          id?: string
          is_read?: boolean | null
          organization_id: string
          portal_user_id?: string | null
          project_id?: string | null
          read_at?: string | null
          staff_user_id?: string | null
        }
        Update: {
          attachments?: string[] | null
          body?: string
          created_at?: string | null
          direction?: string
          id?: string
          is_read?: boolean | null
          organization_id?: string
          portal_user_id?: string | null
          project_id?: string | null
          read_at?: string | null
          staff_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_messages_portal_user_id_fkey"
            columns: ["portal_user_id"]
            isOneToOne: false
            referencedRelation: "portal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_messages_staff_user_id_fkey"
            columns: ["staff_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_users: {
        Row: {
          created_at: string | null
          customer_id: string
          email: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          magic_link_expires_at: string | null
          magic_link_token: string | null
          organization_id: string
          password_hash: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          email: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          magic_link_expires_at?: string | null
          magic_link_token?: string | null
          organization_id: string
          password_hash?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          email?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          magic_link_expires_at?: string | null
          magic_link_token?: string | null
          organization_id?: string
          password_hash?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_users_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          employee_id: string | null
          first_name: string
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          last_location: Json | null
          last_name: string
          notify_email: boolean | null
          notify_push: boolean | null
          notify_sms: boolean | null
          onboarding_completed_at: string | null
          organization_id: string | null
          phone: string | null
          push_token: string | null
          reminder_pref_1: string | null
          reminder_pref_2: string | null
          role: Database["public"]["Enums"]["user_role"]
          title: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          employee_id?: string | null
          first_name: string
          hourly_rate?: number | null
          id: string
          is_active?: boolean | null
          last_location?: Json | null
          last_name: string
          notify_email?: boolean | null
          notify_push?: boolean | null
          notify_sms?: boolean | null
          onboarding_completed_at?: string | null
          organization_id?: string | null
          phone?: string | null
          push_token?: string | null
          reminder_pref_1?: string | null
          reminder_pref_2?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          employee_id?: string | null
          first_name?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          last_location?: Json | null
          last_name?: string
          notify_email?: boolean | null
          notify_push?: boolean | null
          notify_sms?: boolean | null
          onboarding_completed_at?: string | null
          organization_id?: string | null
          phone?: string | null
          push_token?: string | null
          reminder_pref_1?: string | null
          reminder_pref_2?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          title?: string | null
          updated_at?: string | null
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
      project_materials: {
        Row: {
          budget_category_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          material_id: string | null
          name: string
          notes: string | null
          ordered_at: string | null
          organization_id: string | null
          po_number: string | null
          project_id: string
          purchase_order_id: string | null
          quantity_estimated: number | null
          quantity_ordered: number | null
          quantity_received: number | null
          quantity_used: number | null
          received_at: string | null
          status: string | null
          supplier: string | null
          total_cost: number | null
          unit: string | null
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          budget_category_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          material_id?: string | null
          name: string
          notes?: string | null
          ordered_at?: string | null
          organization_id?: string | null
          po_number?: string | null
          project_id: string
          purchase_order_id?: string | null
          quantity_estimated?: number | null
          quantity_ordered?: number | null
          quantity_received?: number | null
          quantity_used?: number | null
          received_at?: string | null
          status?: string | null
          supplier?: string | null
          total_cost?: number | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          budget_category_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          material_id?: string | null
          name?: string
          notes?: string | null
          ordered_at?: string | null
          organization_id?: string | null
          po_number?: string | null
          project_id?: string
          purchase_order_id?: string | null
          quantity_estimated?: number | null
          quantity_ordered?: number | null
          quantity_received?: number | null
          quantity_used?: number | null
          received_at?: string | null
          status?: string | null
          supplier?: string | null
          total_cost?: number | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_materials_budget_category_id_fkey"
            columns: ["budget_category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "material_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_materials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_materials_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          notify_client: boolean | null
          organization_id: string | null
          phase_id: string | null
          project_id: string
          status: Database["public"]["Enums"]["milestone_status"] | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          notify_client?: boolean | null
          organization_id?: string | null
          phase_id?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["milestone_status"] | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          notify_client?: boolean | null
          organization_id?: string | null
          phase_id?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["milestone_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          color: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          order_index: number | null
          organization_id: string | null
          project_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["phase_status"] | null
          updated_at: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          order_index?: number | null
          organization_id?: string | null
          project_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["phase_status"] | null
          updated_at?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          order_index?: number | null
          organization_id?: string | null
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["phase_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_subcontractors: {
        Row: {
          contract_amount: number | null
          created_at: string | null
          end_date: string | null
          id: string
          organization_id: string | null
          project_id: string
          scope: string | null
          start_date: string | null
          status: string | null
          subcontractor_id: string
        }
        Insert: {
          contract_amount?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          organization_id?: string | null
          project_id: string
          scope?: string | null
          start_date?: string | null
          status?: string | null
          subcontractor_id: string
        }
        Update: {
          contract_amount?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          organization_id?: string | null
          project_id?: string
          scope?: string | null
          start_date?: string | null
          status?: string | null
          subcontractor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_subcontractors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_subcontractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_subcontractors_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team: {
        Row: {
          assigned_at: string | null
          hourly_rate: number | null
          id: string
          organization_id: string | null
          project_id: string
          removed_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          hourly_rate?: number | null
          id?: string
          organization_id?: string | null
          project_id: string
          removed_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          hourly_rate?: number | null
          id?: string
          organization_id?: string | null
          project_id?: string
          removed_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_team_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_cost: number | null
          actual_end_date: string | null
          actual_start_date: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          client_can_message: boolean | null
          client_portal_enabled: boolean | null
          contract_value: number | null
          coordinates: Json | null
          country: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          deleted_at: string | null
          description: string | null
          estimated_cost: number | null
          estimated_end_date: string | null
          estimated_start_date: string | null
          foreman_id: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"] | null
          inspection_required: boolean | null
          internal_notes: string | null
          lead_id: string | null
          name: string
          organization_id: string
          permit_expiry_date: string | null
          permit_issued_date: string | null
          permit_number: string | null
          profit_margin: number | null
          project_manager_id: string | null
          project_number: string | null
          roof_slope: string | null
          roof_squares: number | null
          roof_type: string | null
          state: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          tags: string[] | null
          type: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          actual_cost?: number | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          client_can_message?: boolean | null
          client_portal_enabled?: boolean | null
          contract_value?: number | null
          coordinates?: Json | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          estimated_end_date?: string | null
          estimated_start_date?: string | null
          foreman_id?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          inspection_required?: boolean | null
          internal_notes?: string | null
          lead_id?: string | null
          name: string
          organization_id: string
          permit_expiry_date?: string | null
          permit_issued_date?: string | null
          permit_number?: string | null
          profit_margin?: number | null
          project_manager_id?: string | null
          project_number?: string | null
          roof_slope?: string | null
          roof_squares?: number | null
          roof_type?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          tags?: string[] | null
          type?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          actual_cost?: number | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          client_can_message?: boolean | null
          client_portal_enabled?: boolean | null
          contract_value?: number | null
          coordinates?: Json | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          estimated_end_date?: string | null
          estimated_start_date?: string | null
          foreman_id?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          inspection_required?: boolean | null
          internal_notes?: string | null
          lead_id?: string | null
          name?: string
          organization_id?: string
          permit_expiry_date?: string | null
          permit_issued_date?: string | null
          permit_number?: string | null
          profit_margin?: number | null
          project_manager_id?: string | null
          project_number?: string | null
          roof_slope?: string | null
          roof_squares?: number | null
          roof_type?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          tags?: string[] | null
          type?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_foreman_id_fkey"
            columns: ["foreman_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      punch_list_items: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          location: string | null
          organization_id: string | null
          phase_id: string | null
          photo_id: string | null
          priority: string | null
          project_id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          location?: string | null
          organization_id?: string | null
          phase_id?: string | null
          photo_id?: string | null
          priority?: string | null
          project_id: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          location?: string | null
          organization_id?: string | null
          phase_id?: string | null
          photo_id?: string | null
          priority?: string | null
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "punch_list_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_list_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_list_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_list_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_list_items_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_list_items_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_list_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          delivered_at: string | null
          expected_delivery: string | null
          id: string
          internal_notes: string | null
          issue_date: string | null
          notes: string | null
          organization_id: string
          payment_terms: string | null
          po_number: string
          project_id: string | null
          requires_approval: boolean | null
          shipping_address: string | null
          shipping_cost: number | null
          status: Database["public"]["Enums"]["po_status"] | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          title: string | null
          total: number | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          delivered_at?: string | null
          expected_delivery?: string | null
          id?: string
          internal_notes?: string | null
          issue_date?: string | null
          notes?: string | null
          organization_id: string
          payment_terms?: string | null
          po_number: string
          project_id?: string | null
          requires_approval?: boolean | null
          shipping_address?: string | null
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["po_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          title?: string | null
          total?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          delivered_at?: string | null
          expected_delivery?: string | null
          id?: string
          internal_notes?: string | null
          issue_date?: string | null
          notes?: string | null
          organization_id?: string
          payment_terms?: string | null
          po_number?: string
          project_id?: string | null
          requires_approval?: boolean | null
          shipping_address?: string | null
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["po_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          title?: string | null
          total?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      report_snapshots: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          organization_id: string
          period_end: string | null
          period_start: string | null
          report_type: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          organization_id: string
          period_end?: string | null
          period_start?: string | null
          report_type: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          organization_id?: string
          period_end?: string | null
          period_start?: string | null
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rfis: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          assigned_to: string | null
          created_at: string | null
          discipline: string | null
          due_date: string | null
          id: string
          organization_id: string | null
          priority: string | null
          project_id: string
          question: string
          rfi_number: string | null
          status: Database["public"]["Enums"]["rfi_status"] | null
          submitted_by: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          assigned_to?: string | null
          created_at?: string | null
          discipline?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          priority?: string | null
          project_id: string
          question: string
          rfi_number?: string | null
          status?: Database["public"]["Enums"]["rfi_status"] | null
          submitted_by?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          assigned_to?: string | null
          created_at?: string | null
          discipline?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          priority?: string | null
          project_id?: string
          question?: string
          rfi_number?: string | null
          status?: Database["public"]["Enums"]["rfi_status"] | null
          submitted_by?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfis_answered_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          filters: Json | null
          id: string
          last_run_at: string | null
          name: string
          organization_id: string | null
          report_type: string | null
          template_slug: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          filters?: Json | null
          id?: string
          last_run_at?: string | null
          name: string
          organization_id?: string | null
          report_type?: string | null
          template_slug?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          filters?: Json | null
          id?: string
          last_run_at?: string | null
          name?: string
          organization_id?: string | null
          report_type?: string | null
          template_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      subcontractors: {
        Row: {
          company_name: string
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          insurance_expiry: string | null
          is_active: boolean | null
          license_number: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          rating: number | null
          trade: string | null
          updated_at: string | null
        }
        Insert: {
          company_name: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          insurance_expiry?: string | null
          is_active?: boolean | null
          license_number?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          rating?: number | null
          trade?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          insurance_expiry?: string | null
          is_active?: boolean | null
          license_number?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          rating?: number | null
          trade?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcontractors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      submittals: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          organization_id: string | null
          project_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          spec_section: string | null
          status: Database["public"]["Enums"]["submittal_status"] | null
          submittal_number: string | null
          submitted_at: string | null
          submitted_by: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          project_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          spec_section?: string | null
          status?: Database["public"]["Enums"]["submittal_status"] | null
          submittal_number?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          project_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          spec_section?: string | null
          status?: Database["public"]["Enums"]["submittal_status"] | null
          submittal_number?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submittals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string | null
          id: string
          message: string
          org_name: string
          organization_id: string | null
          priority: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_email: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          org_name: string
          organization_id?: string | null
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_email: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          org_name?: string
          organization_id?: string | null
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_email?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      takeoff_items: {
        Row: {
          ai_quantity: number | null
          category: string | null
          confidence_score: number | null
          created_at: string | null
          description: string | null
          formula_used: string | null
          id: string
          is_overridden: boolean | null
          is_reviewed: boolean | null
          material_id: string | null
          name: string
          organization_id: string | null
          override_quantity: number | null
          override_reason: string | null
          quantity: number | null
          sheet_id: string | null
          source_coordinates: Json | null
          takeoff_id: string
          total_cost: number | null
          unit: string | null
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          ai_quantity?: number | null
          category?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          formula_used?: string | null
          id?: string
          is_overridden?: boolean | null
          is_reviewed?: boolean | null
          material_id?: string | null
          name: string
          organization_id?: string | null
          override_quantity?: number | null
          override_reason?: string | null
          quantity?: number | null
          sheet_id?: string | null
          source_coordinates?: Json | null
          takeoff_id: string
          total_cost?: number | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_quantity?: number | null
          category?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          formula_used?: string | null
          id?: string
          is_overridden?: boolean | null
          is_reviewed?: boolean | null
          material_id?: string | null
          name?: string
          organization_id?: string | null
          override_quantity?: number | null
          override_reason?: string | null
          quantity?: number | null
          sheet_id?: string | null
          source_coordinates?: Json | null
          takeoff_id?: string
          total_cost?: number | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "takeoff_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takeoff_items_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "blueprint_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takeoff_items_takeoff_id_fkey"
            columns: ["takeoff_id"]
            isOneToOne: false
            referencedRelation: "takeoffs"
            referencedColumns: ["id"]
          },
        ]
      }
      takeoffs: {
        Row: {
          ai_confidence: number | null
          ai_model: string | null
          blueprint_id: string | null
          created_at: string | null
          created_by: string | null
          estimate_id: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          processing_completed_at: string | null
          processing_error: string | null
          processing_started_at: string | null
          project_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["takeoff_status"] | null
          trade: string | null
          updated_at: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_model?: string | null
          blueprint_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estimate_id?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          project_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["takeoff_status"] | null
          trade?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_model?: string | null
          blueprint_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estimate_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          project_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["takeoff_status"] | null
          trade?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "takeoffs_blueprint_id_fkey"
            columns: ["blueprint_id"]
            isOneToOne: false
            referencedRelation: "blueprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takeoffs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takeoffs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takeoffs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takeoffs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_read: boolean | null
          job_id: string | null
          organization_id: string
          project_id: string | null
          read_at: string | null
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          organization_id: string
          project_id?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          organization_id?: string
          project_id?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_required: boolean | null
          label: string
          options: Json | null
          order_index: number | null
          section_id: string | null
          template_id: string
          type: Database["public"]["Enums"]["checklist_item_type"] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          label: string
          options?: Json | null
          order_index?: number | null
          section_id?: string | null
          template_id: string
          type?: Database["public"]["Enums"]["checklist_item_type"] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          label?: string
          options?: Json | null
          order_index?: number | null
          section_id?: string | null
          template_id?: string
          type?: Database["public"]["Enums"]["checklist_item_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "template_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "template_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "inspection_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_sections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number | null
          template_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
          template_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_sections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "inspection_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          break_minutes: number | null
          created_at: string | null
          created_by: string | null
          date: string
          deleted_at: string | null
          description: string | null
          end_time: string | null
          hourly_rate: number | null
          hours: number
          id: string
          job_id: string
          organization_id: string
          profile_id: string
          start_time: string | null
          total_pay: number | null
          updated_at: string | null
        }
        Insert: {
          break_minutes?: number | null
          created_at?: string | null
          created_by?: string | null
          date: string
          deleted_at?: string | null
          description?: string | null
          end_time?: string | null
          hourly_rate?: number | null
          hours: number
          id?: string
          job_id: string
          organization_id: string
          profile_id: string
          start_time?: string | null
          total_pay?: number | null
          updated_at?: string | null
        }
        Update: {
          break_minutes?: number | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          deleted_at?: string | null
          description?: string | null
          end_time?: string | null
          hourly_rate?: number | null
          hours?: number
          id?: string
          job_id?: string
          organization_id?: string
          profile_id?: string
          start_time?: string | null
          total_pay?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address_line1: string | null
          city: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          organization_id: string
          payment_terms: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          organization_id: string
          payment_terms?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          organization_id?: string
          payment_terms?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_org_id: { Args: never; Returns: string }
      gettransactionid: { Args: never; Returns: unknown }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      budget_category_type:
        | "materials"
        | "labor"
        | "equipment"
        | "subcontractor"
        | "permits"
        | "fuel"
        | "overhead"
        | "contingency"
        | "other"
      change_order_status:
        | "draft"
        | "submitted"
        | "approved"
        | "declined"
        | "void"
      checklist_item_type:
        | "checkbox"
        | "pass_fail"
        | "text"
        | "number"
        | "photo"
        | "signature"
        | "select"
      equipment_condition: "excellent" | "good" | "fair" | "poor"
      equipment_status:
        | "available"
        | "assigned"
        | "maintenance"
        | "repair"
        | "retired"
      estimate_status:
        | "draft"
        | "sent"
        | "viewed"
        | "approved"
        | "declined"
        | "expired"
        | "converted"
      expense_category:
        | "materials"
        | "labor"
        | "equipment"
        | "fuel"
        | "permits"
        | "subcontractor"
        | "tools"
        | "dump_fees"
        | "insurance"
        | "overhead"
        | "other"
      file_type:
        | "image"
        | "pdf"
        | "blueprint"
        | "contract"
        | "permit"
        | "inspection"
        | "warranty"
        | "invoice"
        | "estimate"
        | "material_list"
        | "safety"
        | "other"
      gantt_dependency_type: "FS" | "FF" | "SS" | "SF"
      industry_type:
        | "roofing"
        | "general_contractor"
        | "electrical"
        | "plumbing"
        | "hvac"
        | "landscaping"
        | "painting"
        | "flooring"
        | "concrete"
        | "masonry"
        | "framing"
        | "insulation"
        | "windows_doors"
        | "solar"
        | "other"
      inspection_item_status: "pending" | "pass" | "fail" | "na"
      inspection_result: "pass" | "fail" | "partial"
      inspection_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "failed"
        | "canceled"
      invoice_status:
        | "draft"
        | "sent"
        | "viewed"
        | "partial"
        | "paid"
        | "overdue"
        | "voided"
        | "refunded"
      job_status:
        | "unscheduled"
        | "scheduled"
        | "en_route"
        | "on_site"
        | "in_progress"
        | "completed"
        | "needs_follow_up"
        | "canceled"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "negotiating"
        | "won"
        | "lost"
        | "unqualified"
      maintenance_status: "scheduled" | "in_progress" | "completed" | "skipped"
      maintenance_type:
        | "preventive"
        | "corrective"
        | "inspection"
        | "calibration"
      message_channel: "sms" | "email" | "in_app" | "push"
      message_direction: "inbound" | "outbound"
      milestone_status: "pending" | "in_progress" | "completed" | "missed"
      notification_type:
        | "job_assigned"
        | "job_status_update"
        | "estimate_approved"
        | "estimate_declined"
        | "invoice_paid"
        | "invoice_overdue"
        | "message_received"
        | "project_update"
        | "timeline_milestone"
        | "expense_submitted"
        | "rfi_submitted"
        | "change_order_approved"
        | "weather_alert"
        | "safety_incident"
        | "inspection_scheduled"
        | "payment_received"
        | "client_message"
        | "task_assigned"
        | "task_overdue"
        | "document_uploaded"
      payment_method:
        | "card"
        | "ach"
        | "check"
        | "cash"
        | "zelle"
        | "venmo"
        | "other"
      payment_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "refunded"
      phase_status: "not_started" | "in_progress" | "completed" | "on_hold"
      po_receipt_condition: "good" | "damaged" | "wrong_item" | "short"
      po_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "sent"
        | "acknowledged"
        | "partial"
        | "fulfilled"
        | "closed"
        | "canceled"
      portal_message_direction: "client_to_staff" | "staff_to_client"
      project_status:
        | "lead"
        | "estimating"
        | "proposal_sent"
        | "approved"
        | "in_progress"
        | "on_hold"
        | "punch_list"
        | "completed"
        | "invoiced"
        | "paid"
        | "canceled"
        | "warranty"
      rfi_status: "open" | "submitted" | "under_review" | "answered" | "closed"
      submittal_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "resubmit"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "paused"
      subscription_tier: "solo" | "team" | "growth" | "enterprise"
      takeoff_status:
        | "pending"
        | "processing"
        | "review"
        | "approved"
        | "exported"
      user_role:
        | "owner"
        | "admin"
        | "office_manager"
        | "estimator"
        | "project_manager"
        | "foreman"
        | "technician"
        | "dispatcher"
        | "subcontractor"
        | "viewer"
      weather_condition:
        | "clear"
        | "partly_cloudy"
        | "cloudy"
        | "rain"
        | "heavy_rain"
        | "snow"
        | "wind"
        | "storm"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      budget_category_type: [
        "materials",
        "labor",
        "equipment",
        "subcontractor",
        "permits",
        "fuel",
        "overhead",
        "contingency",
        "other",
      ],
      change_order_status: [
        "draft",
        "submitted",
        "approved",
        "declined",
        "void",
      ],
      checklist_item_type: [
        "checkbox",
        "pass_fail",
        "text",
        "number",
        "photo",
        "signature",
        "select",
      ],
      equipment_condition: ["excellent", "good", "fair", "poor"],
      equipment_status: [
        "available",
        "assigned",
        "maintenance",
        "repair",
        "retired",
      ],
      estimate_status: [
        "draft",
        "sent",
        "viewed",
        "approved",
        "declined",
        "expired",
        "converted",
      ],
      expense_category: [
        "materials",
        "labor",
        "equipment",
        "fuel",
        "permits",
        "subcontractor",
        "tools",
        "dump_fees",
        "insurance",
        "overhead",
        "other",
      ],
      file_type: [
        "image",
        "pdf",
        "blueprint",
        "contract",
        "permit",
        "inspection",
        "warranty",
        "invoice",
        "estimate",
        "material_list",
        "safety",
        "other",
      ],
      gantt_dependency_type: ["FS", "FF", "SS", "SF"],
      industry_type: [
        "roofing",
        "general_contractor",
        "electrical",
        "plumbing",
        "hvac",
        "landscaping",
        "painting",
        "flooring",
        "concrete",
        "masonry",
        "framing",
        "insulation",
        "windows_doors",
        "solar",
        "other",
      ],
      inspection_item_status: ["pending", "pass", "fail", "na"],
      inspection_result: ["pass", "fail", "partial"],
      inspection_status: [
        "scheduled",
        "in_progress",
        "completed",
        "failed",
        "canceled",
      ],
      invoice_status: [
        "draft",
        "sent",
        "viewed",
        "partial",
        "paid",
        "overdue",
        "voided",
        "refunded",
      ],
      job_status: [
        "unscheduled",
        "scheduled",
        "en_route",
        "on_site",
        "in_progress",
        "completed",
        "needs_follow_up",
        "canceled",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiating",
        "won",
        "lost",
        "unqualified",
      ],
      maintenance_status: ["scheduled", "in_progress", "completed", "skipped"],
      maintenance_type: [
        "preventive",
        "corrective",
        "inspection",
        "calibration",
      ],
      message_channel: ["sms", "email", "in_app", "push"],
      message_direction: ["inbound", "outbound"],
      milestone_status: ["pending", "in_progress", "completed", "missed"],
      notification_type: [
        "job_assigned",
        "job_status_update",
        "estimate_approved",
        "estimate_declined",
        "invoice_paid",
        "invoice_overdue",
        "message_received",
        "project_update",
        "timeline_milestone",
        "expense_submitted",
        "rfi_submitted",
        "change_order_approved",
        "weather_alert",
        "safety_incident",
        "inspection_scheduled",
        "payment_received",
        "client_message",
        "task_assigned",
        "task_overdue",
        "document_uploaded",
      ],
      payment_method: [
        "card",
        "ach",
        "check",
        "cash",
        "zelle",
        "venmo",
        "other",
      ],
      payment_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "refunded",
      ],
      phase_status: ["not_started", "in_progress", "completed", "on_hold"],
      po_receipt_condition: ["good", "damaged", "wrong_item", "short"],
      po_status: [
        "draft",
        "pending_approval",
        "approved",
        "sent",
        "acknowledged",
        "partial",
        "fulfilled",
        "closed",
        "canceled",
      ],
      portal_message_direction: ["client_to_staff", "staff_to_client"],
      project_status: [
        "lead",
        "estimating",
        "proposal_sent",
        "approved",
        "in_progress",
        "on_hold",
        "punch_list",
        "completed",
        "invoiced",
        "paid",
        "canceled",
        "warranty",
      ],
      rfi_status: ["open", "submitted", "under_review", "answered", "closed"],
      submittal_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "resubmit",
      ],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "paused",
      ],
      subscription_tier: ["solo", "team", "growth", "enterprise"],
      takeoff_status: [
        "pending",
        "processing",
        "review",
        "approved",
        "exported",
      ],
      user_role: [
        "owner",
        "admin",
        "office_manager",
        "estimator",
        "project_manager",
        "foreman",
        "technician",
        "dispatcher",
        "subcontractor",
        "viewer",
      ],
      weather_condition: [
        "clear",
        "partly_cloudy",
        "cloudy",
        "rain",
        "heavy_rain",
        "snow",
        "wind",
        "storm",
      ],
    },
  },
} as const
