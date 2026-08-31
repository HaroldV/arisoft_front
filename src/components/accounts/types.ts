import { AccountStatus, AccountType, EntityType, PaymentMethod } from '@/constants/domain-constants';

export interface PaymentLog {
  id: string;
  payment_method: PaymentMethod;
  currency: string;
  amount: number;
  exchange_rate: number;
  amount_usd: number;
  reference_number?: string;
  created_by_user_name?: string;
  paid_at?: string;
}

export interface AccountItem {
  id: string;
  type: AccountType;
  entity_type: EntityType;
  entity_name: string;
  reference_date?: string;
  reference_document_id?: string;
  reference_document_number?: string;
  supplier_invoice_number?: string;
  voucher_attachment_url?: string;
  invoice_registered_by_user_name?: string;
  invoice_registered_at?: string;
  notes?: string;
  previous_balance: number;
  period_amount: number;
  total_paid: number;
  balance_due: number;
  status: AccountStatus;
  created_by_user_name?: string;
  payments: PaymentLog[];
}

export interface SummaryKPIs {
  total_previous_balance: number;
  total_period_amount: number;
  total_paid: number;
  total_balance_due: number;
}
