export interface NotificationData {
  userId: number;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'system' | 'promotion';
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

export class NotificationService {
  private static notifications = new Map<number, any[]>();

   
  static async sendNotification(notificationData: NotificationData): Promise<NotificationResult> {
    try {
      const notificationId = this.generateNotificationId();
      
      const notification = {
        id: notificationId,
        userId: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        data: notificationData.data || {},
        priority: notificationData.priority || 'normal',
        timestamp: new Date().toISOString(),
        read: false
      };

       
      if (!this.notifications.has(notificationData.userId)) {
        this.notifications.set(notificationData.userId, []);
      }
      this.notifications.get(notificationData.userId)!.push(notification);

       
      await this.sendPushNotification(notification);

      console.log('Notification sent:', {
        userId: notificationData.userId,
        title: notificationData.title,
        type: notificationData.type
      });

      return {
        success: true,
        notificationId: notificationId
      };
    } catch (error) {
      console.error('Notification sending error:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }
 
  static async sendBookingNotification(booking: any, user: any): Promise<NotificationResult> {
    const notificationData: NotificationData = {
      userId: user.id,
      title: 'Booking Confirmed!',
      message: `Your booking for Room ${booking.room_number} is confirmed for ${this.formatDate(booking.check_in)}`,
      type: 'booking',
      data: {
        bookingId: booking.id,
        roomNumber: booking.room_number,
        checkIn: booking.check_in,
        action: 'view_booking'
      },
      priority: 'high'
    };

    return await this.sendNotification(notificationData);
  }

   
  static async sendPaymentNotification(payment: any, user: any): Promise<NotificationResult> {
    const notificationData: NotificationData = {
      userId: user.id,
      title: 'Payment Successful!',
      message: `Your payment of ${this.formatCurrency(payment.amount)} was processed successfully`,
      type: 'payment',
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        transactionId: payment.transaction_id,
        action: 'view_receipt'
      },
      priority: 'high'
    };

    return await this.sendNotification(notificationData);
  }

  static async sendBookingReminder(booking: any, user: any): Promise<NotificationResult> {
    const checkIn = new Date(booking.check_in);
    const today = new Date();
    const daysUntilCheckIn = Math.ceil((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let message = '';
    if (daysUntilCheckIn === 1) {
      message = 'Your check-in is tomorrow! Get ready for your stay.';
    } else if (daysUntilCheckIn === 0) {
      message = 'Check-in is today! We look forward to welcoming you.';
    } else {
      message = `Your check-in is in ${daysUntilCheckIn} days.`;
    }

    const notificationData: NotificationData = {
      userId: user.id,
      title: 'Booking Reminder',
      message: message,
      type: 'booking',
      data: {
        bookingId: booking.id,
        checkIn: booking.check_in,
        daysUntilCheckIn: daysUntilCheckIn,
        action: 'view_booking'
      },
      priority: 'normal'
    };

    return await this.sendNotification(notificationData);
  }

  
  static async sendSystemNotification(
    userId: number, 
    message: string, 
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<NotificationResult> {
    const notificationData: NotificationData = {
      userId: userId,
      title: 'System Notification',
      message: message,
      type: 'system',
      priority: priority
    };

    return await this.sendNotification(notificationData);
  }

   
  static async getUserNotifications(userId: number, limit: number = 50): Promise<any[]> {
    try {
       
      const userNotifications = this.notifications.get(userId) || [];
      
      return userNotifications
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Get user notifications error:', error);
      return [];
    }
  }

  
  static async markAsRead(userId: number, notificationId: string): Promise<boolean> {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      const notification = userNotifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.read = true;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return false;
    }
  }
 
  static async getUnreadCount(userId: number): Promise<number> {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      return userNotifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  static async clearAllNotifications(userId: number): Promise<boolean> {
    try {
      this.notifications.set(userId, []);
      return true;
    } catch (error) {
      console.error('Clear notifications error:', error);
      return false;
    }
  }

  private static async sendPushNotification(notification: any): Promise<void> {
     
    
    console.log('📱 Mock Push Notification:', {
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type
    });

     
    await new Promise(resolve => setTimeout(resolve, 500));
  }

   
  private static generateNotificationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `notif_${timestamp}_${random}`;
  }

   
  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

   
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }

   
  static async getNotificationStats(): Promise<any> {
    let totalNotifications = 0;
    let unreadCount = 0;

    this.notifications.forEach(userNotifications => {
      totalNotifications += userNotifications.length;
      unreadCount += userNotifications.filter(n => !n.read).length;
    });

    return {
      totalNotifications: totalNotifications,
      unreadCount: unreadCount,
      usersWithNotifications: this.notifications.size,
      deliveryRate: 0.95  
    };
  }
}

export default NotificationService;
