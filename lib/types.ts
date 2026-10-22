export type PaymentStatus = 'pending' | 'paid' | 'refunded'
export type OrderStatus = 'to_prepare' | 'prepared' | 'dispatched' | 'delivered' | 'cancelled'
export type DeliveryType = 'to_be_defined' | 'pickup' | 'delivery' | 'delivery_point' | 'intercity_shipping'
export type StoreRole = 'admin' | 'employee'
export type StoreStatus = 'active' | 'paused' | 'cancelled'

export interface Store {
  id: string
  name: string
  status: StoreStatus
  paused_reason: string | null
  subscription_expires_at: string | null
}

export interface Membership {
  store_id: string
  role: StoreRole
  active: boolean
  stores: Store
}
