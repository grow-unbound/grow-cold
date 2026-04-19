export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          reason: string | null
          tenant_id: string
          user_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          tenant_id?: string
          user_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          tenant_id?: string
          user_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_otp_challenges: {
        Row: {
          attempt_count: number
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          locked_until: string | null
          otp_hash: string
          purpose: string
          resend_count: number
          user_id: string
        }
        Insert: {
          attempt_count?: number
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          locked_until?: string | null
          otp_hash: string
          purpose: string
          resend_count?: number
          user_id: string
        }
        Update: {
          attempt_count?: number
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          locked_until?: string | null
          otp_hash?: string
          purpose?: string
          resend_count?: number
          user_id?: string
        }
        Relationships: []
      }
      charge_types: {
        Row: {
          code: string
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "charge_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_receipts: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          receipt_date: string
          recorded_by: string | null
          reference_number: string | null
          tenant_id: string
          total_amount: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          receipt_date: string
          recorded_by?: string | null
          reference_number?: string | null
          tenant_id?: string
          total_amount: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          receipt_date?: string
          recorded_by?: string | null
          reference_number?: string | null
          tenant_id?: string
          total_amount?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_receipts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_receipts_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_receipts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_receipts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["customer_category"]
          created_at: string
          credit_limit: number
          customer_code: string
          customer_name: string
          gstin: string | null
          id: string
          is_active: boolean
          mobile: string | null
          notes: string | null
          phone: string
          tenant_id: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          address?: string | null
          category?: Database["public"]["Enums"]["customer_category"]
          created_at?: string
          credit_limit?: number
          customer_code: string
          customer_name: string
          gstin?: string | null
          id?: string
          is_active?: boolean
          mobile?: string | null
          notes?: string | null
          phone: string
          tenant_id?: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          address?: string | null
          category?: Database["public"]["Enums"]["customer_category"]
          created_at?: string
          credit_limit?: number
          customer_code?: string
          customer_name?: string
          gstin?: string | null
          id?: string
          is_active?: boolean
          mobile?: string | null
          notes?: string | null
          phone?: string
          tenant_id?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          blocked_reason: string | null
          created_at: string
          delivery_date: string
          driver_name: string | null
          id: string
          lot_id: string
          notes: string | null
          num_bags_out: number
          overridden_by: string | null
          override_at: string | null
          override_reason: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
          vehicle_number: string | null
        }
        Insert: {
          blocked_reason?: string | null
          created_at?: string
          delivery_date: string
          driver_name?: string | null
          id?: string
          lot_id: string
          notes?: string | null
          num_bags_out: number
          overridden_by?: string | null
          override_at?: string | null
          override_reason?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
          vehicle_number?: string | null
        }
        Update: {
          blocked_reason?: string | null
          created_at?: string
          delivery_date?: string
          driver_name?: string | null
          id?: string
          lot_id?: string
          notes?: string | null
          num_bags_out?: number
          overridden_by?: string | null
          override_at?: string | null
          override_reason?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          id: string
          name: string
          tenant_id: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tenant_id?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          lot_id: string
          new_status: Database["public"]["Enums"]["lot_status"]
          old_status: Database["public"]["Enums"]["lot_status"] | null
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          lot_id: string
          new_status: Database["public"]["Enums"]["lot_status"]
          old_status?: Database["public"]["Enums"]["lot_status"] | null
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          lot_id?: string
          new_status?: Database["public"]["Enums"]["lot_status"]
          old_status?: Database["public"]["Enums"]["lot_status"] | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lot_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_status_history_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      lots: {
        Row: {
          balance_bags: number
          created_at: string
          customer_id: string
          driver_name: string | null
          id: string
          location_ids: string[]
          lodgement_date: string
          lot_number: string
          notes: string | null
          original_bags: number
          product_id: string
          rental_mode: Database["public"]["Enums"]["rental_mode"]
          status: Database["public"]["Enums"]["lot_status"]
          tenant_id: string
          updated_at: string
          vehicle_number: string | null
          warehouse_id: string
        }
        Insert: {
          balance_bags: number
          created_at?: string
          customer_id: string
          driver_name?: string | null
          id?: string
          location_ids?: string[]
          lodgement_date: string
          lot_number: string
          notes?: string | null
          original_bags: number
          product_id: string
          rental_mode: Database["public"]["Enums"]["rental_mode"]
          status?: Database["public"]["Enums"]["lot_status"]
          tenant_id?: string
          updated_at?: string
          vehicle_number?: string | null
          warehouse_id: string
        }
        Update: {
          balance_bags?: number
          created_at?: string
          customer_id?: string
          driver_name?: string | null
          id?: string
          location_ids?: string[]
          lodgement_date?: string
          lot_number?: string
          notes?: string | null
          original_bags?: number
          product_id?: string
          rental_mode?: Database["public"]["Enums"]["rental_mode"]
          status?: Database["public"]["Enums"]["lot_status"]
          tenant_id?: string
          updated_at?: string
          vehicle_number?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      product_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_product_group_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_product_group_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_product_group_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_groups_parent_product_group_id_fkey"
            columns: ["parent_product_group_id"]
            isOneToOne: false
            referencedRelation: "product_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_charges: {
        Row: {
          charge_type_id: string
          charges_per_bag: number
          created_at: string
          product_id: string
          updated_at: string
        }
        Insert: {
          charge_type_id: string
          charges_per_bag: number
          created_at?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          charge_type_id?: string
          charges_per_bag?: number
          created_at?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_charges_charge_type_id_fkey"
            columns: ["charge_type_id"]
            isOneToOne: false
            referencedRelation: "charge_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_charges_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          bag_size: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          monthly_rent_per_bag: number | null
          monthly_rent_per_kg: number | null
          product_group_id: string
          product_name: string
          stale_days_limit: number | null
          storage_temperature: string | null
          tenant_id: string
          updated_at: string
          yearly_rent_per_bag: number | null
          yearly_rent_per_kg: number | null
        }
        Insert: {
          bag_size?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monthly_rent_per_kg?: number | null
          product_group_id: string
          product_name: string
          stale_days_limit?: number | null
          storage_temperature?: string | null
          tenant_id?: string
          updated_at?: string
          yearly_rent_per_kg?: number | null
        }
        Update: {
          bag_size?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monthly_rent_per_kg?: number | null
          product_group_id?: string
          product_name?: string
          stale_days_limit?: number | null
          storage_temperature?: string | null
          tenant_id?: string
          updated_at?: string
          yearly_rent_per_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_product_group_id_fkey"
            columns: ["product_group_id"]
            isOneToOne: false
            referencedRelation: "product_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_allocations: {
        Row: {
          allocated_by: string | null
          allocated_manually: boolean
          amount: number
          charge_id: string | null
          created_at: string
          id: string
          receipt_id: string
          rent_accrual_id: string | null
          updated_at: string
        }
        Insert: {
          allocated_by?: string | null
          allocated_manually?: boolean
          amount: number
          charge_id?: string | null
          created_at?: string
          id?: string
          receipt_id: string
          rent_accrual_id?: string | null
          updated_at?: string
        }
        Update: {
          allocated_by?: string | null
          allocated_manually?: boolean
          amount?: number
          charge_id?: string | null
          created_at?: string
          id?: string
          receipt_id?: string
          rent_accrual_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_allocations_allocated_by_fkey"
            columns: ["allocated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_allocations_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "transaction_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_allocations_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "customer_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_allocations_rent_accrual_id_fkey"
            columns: ["rent_accrual_id"]
            isOneToOne: false
            referencedRelation: "rent_accruals"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_accruals: {
        Row: {
          accrual_date: string
          accrual_from: string
          accrual_to: string
          created_at: string
          id: string
          is_paid: boolean
          lot_id: string
          notes: string | null
          paid_date: string | null
          rental_amount: number
          rental_mode: Database["public"]["Enums"]["rental_mode"]
          updated_at: string
        }
        Insert: {
          accrual_date: string
          accrual_from: string
          accrual_to: string
          created_at?: string
          id?: string
          is_paid?: boolean
          lot_id: string
          notes?: string | null
          paid_date?: string | null
          rental_amount: number
          rental_mode: Database["public"]["Enums"]["rental_mode"]
          updated_at?: string
        }
        Update: {
          accrual_date?: string
          accrual_from?: string
          accrual_to?: string
          created_at?: string
          id?: string
          is_paid?: boolean
          lot_id?: string
          notes?: string | null
          paid_date?: string | null
          rental_amount?: number
          rental_mode?: Database["public"]["Enums"]["rental_mode"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_accruals_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      transaction_charges: {
        Row: {
          charge_amount: number
          charge_type_id: string
          created_at: string
          delivery_id: string
          id: string
          is_paid: boolean
          lot_id: string
          notes: string | null
          paid_date: string | null
          rate_per_unit: number | null
          updated_at: string
        }
        Insert: {
          charge_amount: number
          charge_type_id: string
          created_at?: string
          delivery_id: string
          id?: string
          is_paid?: boolean
          lot_id: string
          notes?: string | null
          paid_date?: string | null
          rate_per_unit?: number | null
          updated_at?: string
        }
        Update: {
          charge_amount?: number
          charge_type_id?: string
          created_at?: string
          delivery_id?: string
          id?: string
          is_paid?: boolean
          lot_id?: string
          notes?: string | null
          paid_date?: string | null
          rate_per_unit?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_charges_charge_type_id_fkey"
            columns: ["charge_type_id"]
            isOneToOne: false
            referencedRelation: "charge_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_charges_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_charges_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          email_verified_at: string | null
          id: string
          is_active: boolean
          phone: string
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_verified_at?: string | null
          id: string
          is_active?: boolean
          phone: string
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_verified_at?: string | null
          id?: string
          is_active?: boolean
          phone?: string
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_warehouse_assignments: {
        Row: {
          assigned_at: string
          user_id: string
          warehouse_id: string
        }
        Insert: {
          assigned_at?: string
          user_id: string
          warehouse_id: string
        }
        Update: {
          assigned_at?: string
          user_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_warehouse_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_warehouse_assignments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_settings: {
        Row: {
          blanket_stale_days: number
          created_at: string
          follow_up_outstanding_days: number
          grace_period_months: number
          id: string
          tenant_id: string
          updated_at: string
          warehouse_id: string
          yearly_rent_cutoff_date: string
        }
        Insert: {
          blanket_stale_days?: number
          created_at?: string
          follow_up_outstanding_days?: number
          grace_period_months?: number
          id?: string
          tenant_id?: string
          updated_at?: string
          warehouse_id: string
          yearly_rent_cutoff_date?: string
        }
        Update: {
          blanket_stale_days?: number
          created_at?: string
          follow_up_outstanding_days?: number
          grace_period_months?: number
          id?: string
          tenant_id?: string
          updated_at?: string
          warehouse_id?: string
          yearly_rent_cutoff_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_settings_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: true
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          capacity_bags: number
          city: string | null
          created_at: string
          id: string
          manager_name: string | null
          manager_phone: string | null
          pincode: string | null
          state: string | null
          tenant_id: string
          updated_at: string
          warehouse_code: string
          warehouse_name: string
        }
        Insert: {
          address?: string | null
          capacity_bags?: number
          city?: string | null
          created_at?: string
          id?: string
          manager_name?: string | null
          manager_phone?: string | null
          pincode?: string | null
          state?: string | null
          tenant_id: string
          updated_at?: string
          warehouse_code: string
          warehouse_name: string
        }
        Update: {
          address?: string | null
          capacity_bags?: number
          city?: string | null
          created_at?: string
          id?: string
          manager_name?: string | null
          manager_phone?: string | null
          pincode?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string
          warehouse_code?: string
          warehouse_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accessible_warehouse_ids: { Args: never; Returns: string[] }
      current_tenant_id: { Args: never; Returns: string }
    }
    Enums: {
      customer_category: "TRADER" | "FARMER"
      delivery_status: "SCHEDULED" | "DELIVERED" | "BLOCKED"
      lot_status:
        | "ACTIVE"
        | "STALE"
        | "DELIVERED"
        | "CLEARED"
        | "WRITTEN_OFF"
        | "DISPUTED"
      payment_method: "CASH" | "BANK_TRANSFER" | "CHEQUE" | "UPI" | "OTHER"
      rental_mode: "YEARLY" | "MONTHLY" | "BROUGHT_FORWARD"
      user_role: "OWNER" | "MANAGER" | "STAFF"
    }
    CompositeTypes: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      customer_category: ["TRADER", "FARMER"],
      delivery_status: ["SCHEDULED", "DELIVERED", "BLOCKED"],
      lot_status: [
        "ACTIVE",
        "STALE",
        "DELIVERED",
        "CLEARED",
        "WRITTEN_OFF",
        "DISPUTED",
      ],
      payment_method: ["CASH", "BANK_TRANSFER", "CHEQUE", "UPI", "OTHER"],
      rental_mode: ["YEARLY", "MONTHLY", "BROUGHT_FORWARD"],
      user_role: ["OWNER", "MANAGER", "STAFF"],
    },
  },
} as const

