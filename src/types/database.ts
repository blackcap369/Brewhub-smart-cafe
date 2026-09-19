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
      cafes: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          subscription_plan: string
          settings: Json
          logo_url: string | null
          address: string | null
          phone: string | null
          timezone: string
          currency: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id: string
          subscription_plan?: string
          settings?: Json
          logo_url?: string | null
          address?: string | null
          phone?: string | null
          timezone?: string
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string
          subscription_plan?: string
          settings?: Json
          logo_url?: string | null
          address?: string | null
          phone?: string | null
          timezone?: string
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          cafe_id: string
          name: string
          description: string | null
          price: number
          category: string
          image_url: string | null
          is_veg: boolean
          is_available: boolean
          is_popular: boolean
          is_spicy: boolean
          preparation_time: number
          calories: number | null
          allergens: string[]
          sort_order: number
          translations: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cafe_id: string
          name: string
          description?: string | null
          price: number
          category: string
          image_url?: string | null
          is_veg?: boolean
          is_available?: boolean
          is_popular?: boolean
          is_spicy?: boolean
          preparation_time?: number
          calories?: number | null
          allergens?: string[]
          sort_order?: number
          translations?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cafe_id?: string
          name?: string
          description?: string | null
          price?: number
          category?: string
          image_url?: string | null
          is_veg?: boolean
          is_available?: boolean
          is_popular?: boolean
          is_spicy?: boolean
          preparation_time?: number
          calories?: number | null
          allergens?: string[]
          sort_order?: number
          translations?: Json
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          cafe_id: string
          order_number: string
          table_no: number | null
          customer_id: string | null
          items: Json
          subtotal: number
          tax: number
          discount: number
          total: number
          status: 'received' | 'preparing' | 'ready' | 'served' | 'cancelled'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial'
          order_type: 'dine_in' | 'pre_order'
          scheduled_time: string | null
          notes: string | null
          special_instructions: string | null
          priority: 'normal' | 'high' | 'urgent'
          prepared_by: string | null
          served_by: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          pre_order_status: 'scheduled' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'cancelled' | null
          notification_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cafe_id: string
          order_number?: string
          table_no?: number | null
          customer_id?: string | null
          items: Json
          subtotal?: number
          tax?: number
          discount?: number
          total?: number
          status?: 'received' | 'preparing' | 'ready' | 'served' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial'
          order_type?: 'dine_in' | 'pre_order'
          scheduled_time?: string | null
          notes?: string | null
          special_instructions?: string | null
          priority?: 'normal' | 'high' | 'urgent'
          prepared_by?: string | null
          served_by?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          pre_order_status?: 'scheduled' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'cancelled' | null
          notification_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cafe_id?: string
          order_number?: string
          table_no?: number | null
          customer_id?: string | null
          items?: Json
          subtotal?: number
          tax?: number
          discount?: number
          total?: number
          status?: 'received' | 'preparing' | 'ready' | 'served' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial'
          order_type?: 'dine_in' | 'pre_order'
          scheduled_time?: string | null
          notes?: string | null
          special_instructions?: string | null
          priority?: 'normal' | 'high' | 'urgent'
          prepared_by?: string | null
          served_by?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          pre_order_status?: 'scheduled' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'cancelled' | null
          notification_sent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          quantity: number
          price: number
          notes: string | null
          status: 'pending' | 'preparing' | 'ready' | 'served'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          quantity: number
          price: number
          notes?: string | null
          status?: 'pending' | 'preparing' | 'ready' | 'served'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          quantity?: number
          price?: number
          notes?: string | null
          status?: 'pending' | 'preparing' | 'ready' | 'served'
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          phone: string | null
          name: string
          email: string | null
          dob: string | null
          role: 'owner' | 'staff' | 'customer'
          cafe_id: string
          auth_user_id: string | null
          avatar_url: string | null
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone?: string | null
          name: string
          email?: string | null
          dob?: string | null
          role: 'owner' | 'staff' | 'customer'
          cafe_id: string
          auth_user_id?: string | null
          avatar_url?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string | null
          name?: string
          email?: string | null
          dob?: string | null
          role?: 'owner' | 'staff' | 'customer'
          cafe_id?: string
          auth_user_id?: string | null
          avatar_url?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tables: {
        Row: {
          id: string
          cafe_id: string
          table_no: number
          seats: number
          status: 'available' | 'occupied' | 'reserved' | 'maintenance'
          qr_code: string | null
          label: string | null
          floor: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cafe_id: string
          table_no: number
          seats?: number
          status?: 'available' | 'occupied' | 'reserved' | 'maintenance'
          qr_code?: string | null
          label?: string | null
          floor?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cafe_id?: string
          table_no?: number
          seats?: number
          status?: 'available' | 'occupied' | 'reserved' | 'maintenance'
          qr_code?: string | null
          label?: string | null
          floor?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
