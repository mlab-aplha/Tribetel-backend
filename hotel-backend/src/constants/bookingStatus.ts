export const bookingStatus = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
    CHECKED_IN: 'checked_in',
    CHECKED_OUT: 'checked_out',
    NO_SHOW: 'no_show',
} as const;

export type bookingStatus = typeof bookingStatus[keyof typeof bookingStatus];