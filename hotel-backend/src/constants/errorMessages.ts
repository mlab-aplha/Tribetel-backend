 

export const errorMessages = {
    Auth: {
        INVALID_CREDENTIALS: 'Invalid email or password',
        UNAUTHORIZED: 'Unauthorized access',
        FORBIDDEN: 'Access forbidden',
        TOKEN_REQUIRED: 'Access token required',
        TOKEN_INVALID: 'Invalid or expired token',
        TOKEN_EXPIRED: 'Token expired',
        USER_EXISTS: 'User already exists',
        USER_NOT_FOUND: 'User not found',
        INVALID_PASSWORD: 'Password must be at least 6 characters',
    },

    VALIDATION: {
        REQUIRED_FIELD: (field: string) => `${field} is required`,
        INVALID_EMAIL: 'Please provide a valid email address',
        INVALID_DATE: 'Invalid date format',
        INVALID_INPUT: 'Invalid input provided',
    },

    HOTEL: {
        NOT_FOUND: 'Hotel not found',
        ROOM_UNVAILABLE: 'Room is not available for the selected dares',
        INVALID_DATES: 'Check-out date must be after check-in date',
    },

    BOOKINGS: {
        NOT_FOUND: 'Booking not found',
        CANCELLATION_FAILED: 'Unnable to cancel booking',
        UPDATE_FAILED: 'Unable to update booking',
        ALREADY_CANCELLED: 'Booking is already cancelled',
    },

    PAYMENT: {
        FAILED: 'Payment proccessing failed',
        INVALID_AMOUNT: 'Invalid payment amount',
        INTENT_FAILED: 'Failed to create payment intent',
    },

    SERVER: {
        INTERNAL_ERROR: 'Internal server error',
        DATABASE_ERROR: 'Database operation failed',
    },
} as const;

export type ErrorMessage = typeof errorMessages;