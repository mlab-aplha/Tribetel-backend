export interface PaymentData {
  bookingId: number;
  amount: number;
  paymentMethod: string;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  error?: string;
}

export interface RefundData {
  paymentId: number;
  amount: number;
  reason: string;
}

export class PaymentService {
   
  static async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
       
      const validation = this.validatePaymentData(paymentData);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const transactionId = this.generateTransactionId();
      
      console.log('Mock Payment Processing:', {
        bookingId: paymentData.bookingId,
        amount: paymentData.amount,
        method: paymentData.paymentMethod,
        transactionId: transactionId
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

       
      const isSuccessful = Math.random() > 0.1;
      
      if (isSuccessful) {
        return {
          success: true,
          transactionId: transactionId,
          paymentUrl: `https://payment-gateway.com/pay/${transactionId}`
        };
      } else {
        return {
          success: false,
          error: 'Payment failed: Insufficient funds'
        };
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

   
  static async verifyPayment(transactionId: string): Promise<PaymentResult> {
    try {
      
      console.log(' Verifying payment:', transactionId);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

       
      return {
        success: true,
        transactionId: transactionId
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      return { success: false, error: 'Payment verification failed' };
    }
  }

   
  static async processRefund(refundData: RefundData): Promise<PaymentResult> {
    try {
      
      if (refundData.amount <= 0) {
        return { success: false, error: 'Invalid refund amount' };
      }

       
      console.log('Processing refund:', refundData);
      
      await new Promise(resolve => setTimeout(resolve, 1500));

      const transactionId = this.generateTransactionId();
      
      return {
        success: true,
        transactionId: `refund_${transactionId}`
      };
    } catch (error) {
      console.error('Refund processing error:', error);
      return { success: false, error: 'Refund processing failed' };
    }
  }

  
  static calculateRefundAmount(
    totalAmount: number, 
    checkInDate: string, 
    cancellationDate: string
  ): number {
    const checkIn = new Date(checkInDate);
    const cancellation = new Date(cancellationDate);
    const daysUntilCheckIn = Math.ceil(
      (checkIn.getTime() - cancellation.getTime()) / (1000 * 60 * 60 * 24)
    );

    
    if (daysUntilCheckIn >= 7) {
      return totalAmount;  
    } else if (daysUntilCheckIn >= 3) {
      return totalAmount * 0.5;  
    } else {
      return 0;  
    }
  }

   
  static getPaymentMethods(): Array<{ id: string; name: string; supported: boolean }> {
    return [
      { id: 'card', name: 'Credit/Debit Card', supported: true },
      { id: 'bank_transfer', name: 'Bank Transfer', supported: true },
      { id: 'mobile_money', name: 'Mobile Money', supported: true },
      { id: 'paypal', name: 'PayPal', supported: false },
      { id: 'crypto', name: 'Cryptocurrency', supported: false }
    ];
  }

   
  private static validatePaymentData(paymentData: PaymentData): { isValid: boolean; error?: string } {
    if (!paymentData.bookingId) {
      return { isValid: false, error: 'Booking ID is required' };
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      return { isValid: false, error: 'Valid amount is required' };
    }

    if (!paymentData.paymentMethod) {
      return { isValid: false, error: 'Payment method is required' };
    }

    const validMethods = this.getPaymentMethods()
      .filter(method => method.supported)
      .map(method => method.id);

    if (!validMethods.includes(paymentData.paymentMethod)) {
      return { isValid: false, error: 'Unsupported payment method' };
    }

    return { isValid: true };
  }

   
  private static generateTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `txn_${timestamp}_${random}`.toUpperCase();
  }
 
  static formatCurrency(amount: number, currency: string = 'NGN'): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

   
  static async getPaymentStats(): Promise<any> {
     
    return {
      totalRevenue: 125000,
      successfulPayments: 45,
      failedPayments: 5,
      averageTransaction: 2777.78,
      refundsProcessed: 3
    };
  }
}

export default PaymentService;
