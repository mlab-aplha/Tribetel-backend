export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export class EmailService {
  static async sendBookingConfirmation(booking: any, user: any): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: user.email,
        subject: `Booking Confirmation - ${booking.id}`,
        template: 'booking_confirmation',
        data: {
          bookingId: booking.id,
          userName: `${user.first_name} ${user.last_name}`,
          roomNumber: booking.room_number,
          roomType: booking.room_type,
          checkIn: this.formatDate(booking.check_in),
          checkOut: this.formatDate(booking.check_out),
          totalAmount: this.formatCurrency(booking.total_amount),
          adults: booking.adults,
          children: booking.children || 0
        }
      };

      await this.sendEmail(emailOptions);
      console.log(`Booking confirmation email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Failed to send booking confirmation email:', error);
      return false;
    }
  }

  static async sendBookingCancellation(booking: any, user: any): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: user.email,
        subject: `Booking Cancelled - ${booking.id}`,
        template: 'booking_cancellation',
        data: {
          bookingId: booking.id,
          userName: `${user.first_name} ${user.last_name}`,
          roomNumber: booking.room_number,
          checkIn: this.formatDate(booking.check_in),
          refundAmount: this.formatCurrency(booking.total_amount * 0.8)
        }
      };

      await this.sendEmail(emailOptions);
      console.log(`Booking cancellation email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
      return false;
    }
  }

  static async sendPaymentConfirmation(payment: any, user: any): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: user.email,
        subject: `Payment Confirmation - ${payment.transaction_id}`,
        template: 'payment_confirmation',
        data: {
          transactionId: payment.transaction_id,
          userName: `${user.first_name} ${user.last_name}`,
          amount: this.formatCurrency(payment.amount),
          paymentDate: this.formatDate(payment.payment_date),
          paymentMethod: payment.payment_method
        }
      };

      await this.sendEmail(emailOptions);
      console.log(`Payment confirmation email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Failed to send payment confirmation email:', error);
      return false;
    }
  }

  static async sendWelcomeEmail(user: any): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: user.email,
        subject: 'Welcome to Our Hotel Booking Service',
        template: 'welcome_email',
        data: {
          userName: `${user.first_name} ${user.last_name}`,
          loginUrl: `${process.env.CLIENT_URL}/login`
        }
      };

      await this.sendEmail(emailOptions);
      console.log(`Welcome email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  static async sendPasswordResetEmail(user: any, resetToken: string): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: user.email,
        subject: 'Password Reset Request',
        template: 'password_reset',
        data: {
          userName: `${user.first_name} ${user.last_name}`,
          resetUrl: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
          expiryTime: '1 hour'
        }
      };

      await this.sendEmail(emailOptions);
      console.log(`Password reset email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  private static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const emailContent = this.getEmailTemplate(options.template, options.data);
      
      console.log('Mock Email Sent:', {
        to: options.to,
        subject: options.subject,
        template: options.template,
        content: emailContent
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error in sendEmail:', error);
      throw error;
    }
  }

  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }

  private static getEmailTemplate(templateName: string, data: any): string {
    const templates: Record<string, string> = {
      booking_confirmation: `
        Dear ${data.userName},
        
        Your booking has been confirmed!
        
        Booking ID: ${data.bookingId}
        Room: ${data.roomNumber} (${data.roomType})
        Check-in: ${data.checkIn}
        Check-out: ${data.checkOut}
        Guests: ${data.adults} adults, ${data.children} children
        Total: ${data.totalAmount}
        
        Thank you for choosing our hotel!
      `,
      
      booking_cancellation: `
        Dear ${data.userName},
        
        Your booking (#${data.bookingId}) has been cancelled.
        
        Room: ${data.roomNumber}
        Check-in: ${data.checkIn}
        Refund Amount: ${data.refundAmount}
        
        We hope to see you again!
      `,
      
      payment_confirmation: `
        Dear ${data.userName},
        
        Your payment has been confirmed!
        
        Transaction ID: ${data.transactionId}
        Amount: ${data.amount}
        Date: ${data.paymentDate}
        Method: ${data.paymentMethod}
        
        Thank you for your payment.
      `,
      
      welcome_email: `
        Welcome ${data.userName}!
        
        Thank you for registering with our hotel booking service.
        You can now log in and start booking rooms.
        
        Login: ${data.loginUrl}
        
        We're excited to have you!
      `,
      
      password_reset: `
        Dear ${data.userName},
        
        You requested a password reset.
        
        Reset Link: ${data.resetUrl}
        This link expires in ${data.expiryTime}.
        
        If you didn't request this, please ignore this email.
      `
    };

    const template = templates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    return template;
  }
}

export default EmailService;
