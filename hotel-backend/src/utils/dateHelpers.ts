import { format, parse, isValid, addDays, differenceInDays, isAfter, isBefore } from 'date-fns';

export class DateHelpers {
   
  static formatDate(date: Date, formatString: string = 'yyyy-MM-dd'): string {
    return format(date, formatString);
  }

   
  static parseDate(dateString: string, formatString: string = 'yyyy-MM-dd'): Date {
    return parse(dateString, formatString, new Date());
  }

   
  static isValidDate(date: any): boolean {
    return isValid(new Date(date));
  }
   
  static addDays(date: Date, days: number): Date {
    return addDays(date, days);
  }
 
  static daysDifference(startDate: Date, endDate: Date): number {
    return differenceInDays(endDate, startDate);
  }

   
  static isFutureDate(date: Date): boolean {
    return isAfter(date, new Date());
  }

   
  static isPastDate(date: Date): boolean {
    return isBefore(date, new Date());
  }
   
  static validateBookingDates(checkIn: Date, checkOut: Date): { isValid: boolean; error?: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isBefore(checkIn, today)) {
      return { isValid: false, error: 'Check-in date cannot be in the past' };
    }

    if (isBefore(checkOut, checkIn) || checkOut.getTime() === checkIn.getTime()) {
      return { isValid: false, error: 'Check-out date must be after check-in date' };
    }

    const minStay = 1;
    if (this.daysDifference(checkIn, checkOut) < minStay) {
      return { isValid: false, error: 'Minimum stay is 1 night' };
    }

    const maxStay = 30;
    if (this.daysDifference(checkIn, checkOut) > maxStay) {
      return { isValid: false, error: 'Maximum stay is 30 nights' };
    }

    return { isValid: true };
  }
 
  static getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

   
  static displayDate(date: Date): string {
    return format(date, 'MMM dd, yyyy');
  }

   
  static displayDateTime(date: Date): string {
    return format(date, 'MMM dd, yyyy HH:mm');
  }
}

export default DateHelpers;
