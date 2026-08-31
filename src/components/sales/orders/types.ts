import { OrderStatus } from '@/constants/domain-constants';

export interface SalesOrderItem {
  id?: string;
  product_id?: string;
  product_name: string;
  sku?: string;
  quantity: number | string;
  unit_price_usd: number | string;
  subtotal_usd?: number | string;
  tax_usd?: number | string;
  total_usd?: number | string;
}

export interface SalesOrder {
  id: string;
  document_number: string;
  client_name: string;
  client_tax_id?: string;
  status: 'APPROVED' | 'DISPATCHED' | 'CONVERTED' | 'DRAFT' | OrderStatus;
  issue_date?: string;
  valid_until?: string;
  payment_method?: string;
  total_usd: number | string;
  total_bs: number | string;
  exchange_rate: number | string;
  created_by_user_name?: string;
  items?: SalesOrderItem[];
}

export type DeliveryMode = 'PICKUP' | 'SHIPPING';

export const getPaymentMethodLabel = (pm?: string) => {
  switch (pm) {
    case 'CASH_USD':
      return 'Efectivo $';
    case 'PAGO_MOVIL':
      return 'Pago Móvil';
    case 'TRANSFER_BS':
      return 'Transferencia Bs.';
    case 'ZELLE':
      return 'Zelle';
    case 'CREDIT':
      return 'Crédito';
    default:
      return null;
  }
};
