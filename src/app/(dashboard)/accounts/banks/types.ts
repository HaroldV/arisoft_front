export interface BankAccount {
  id: string;
  name: string;
  bank_name: string;
  account_number?: string;
  account_type: 'CORRIENTE' | 'AHORRO' | 'EFECTIVO' | 'ZELLE' | 'BINANCE' | 'DIGITAL' | string;
  currency: 'USD' | 'VES';
  current_balance: number;
  p2p_phone?: string;
  p2p_tax_id?: string;
  p2p_bank_code?: string;
  color_theme?: string;
}

export interface BankMovementItem {
  id: string;
  type: string;
  amount: number;
  amount_usd?: number;
  amount_ves?: number;
  exchange_rate?: number;
  reference?: string;
  description?: string;
  created_at: string;
  account: {
    id: string;
    name: string;
    bank_name: string;
    currency: 'USD' | 'VES';
    account_type: string;
    color_theme?: string;
  };
  payment_metadata?: {
    payment_method: string;
    last_four_digits?: string;
    sender_identifier?: string;
    transaction_reference?: string;
  };
  sale?: {
    id: string;
    invoice_number?: string;
    control_number?: string;
    client_name?: string;
    client_tax_id?: string;
  };
  fiscal_note?: {
    id: string;
    document_number: string;
    type: string;
    total_usd: number;
    total_ves: number;
  };
  created_by?: {
    name: string;
  };
}
