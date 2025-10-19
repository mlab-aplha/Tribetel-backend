export type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'digital_wallet';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

 
export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  payment_date?: string;
  refund_amount?: number;
  refund_reason?: string;
  created_at: string;
  updated_at: string;
}

 
export interface CreatePaymentRequest {
  booking_id: number;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id?: string;
}

 
export interface UpdatePaymentRequest {
  status?: PaymentStatus;
  transaction_id?: string;
  payment_date?: string;
  refund_amount?: number;
  refund_reason?: string;
}


export interface PaymentResponse extends Payment {
  booking?: {
    check_in: string;
    check_out: string;
    total_amount: number;
    user?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

 
export interface PaymentGatewayRequest {
  amount: number;
  currency: string;
  description: string;
  metadata: {
    booking_id: number;
    user_id: number;
  };
}

export interface PaymentGatewayResponse {
  success: boolean;
  transaction_id?: string;
  payment_url?: string;
  error?: string;
}

 
export interface RefundRequest {
  payment_id: number;
  refund_amount: number;
  reason: string;
}

 
export interface PaymentStats {
  total_revenue: number;
  pending_payments: number;
  completed_payments: number;
  average_transaction: number;
  revenue_by_method: Record<PaymentMethod, number>;
}
