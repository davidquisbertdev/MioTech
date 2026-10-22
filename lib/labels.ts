export const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Por cobrar',
  paid: 'Pagado',
  refunded: 'Reembolsado',
}
export const STATUS_LABEL: Record<string, string> = {
  to_prepare: 'Por alistar',
  prepared: 'Alistado',
  dispatched: 'Despachado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}
export const DELIVERY_LABEL: Record<string, string> = {
  to_be_defined: 'Por definir',
  pickup: 'Recoge en tienda',
  delivery: 'Envío a domicilio',
  delivery_point: 'Punto de entrega',
  intercity_shipping: 'Envío a otra ciudad',
}
export const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  employee: 'Empleado',
}
export const FIELD_LABEL: Record<string, string> = {
  payment_status: 'Pago',
  status: 'Estado',
  delivery_type: 'Entrega',
}
export const VALUE_LABEL: Record<string, Record<string, string>> = {
  payment_status: PAYMENT_LABEL,
  status: STATUS_LABEL,
  delivery_type: DELIVERY_LABEL,
}
