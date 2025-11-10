import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError as ExpressValidationError } from 'express-validator';
import { ValidationError } from '../types';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors: ValidationError[] = errors.array().map((err: ExpressValidationError) => ({
      field: err.type === 'field' ? err.path : 'unknown',
      message: err.msg
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
    return;
  }
  
  next();
};
```

### 8.4 Create `src/middlewares/upload.ts`
```typescript
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: fileFilter
});

export default upload;
```

### 8.5 Create `src/middlewares/rateLimiter.ts`
```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many payment requests, please try again later.'
  }
});
```

## Step 9: Utilities

### 9.1 Create `src/utils/asyncHandler.ts`
```typescript
import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

const asyncHandler = (fn: AsyncFunction) => (req: Request, res: Response, next: NextFunction): Promise<void> => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
```

### 9.2 Create `src/utils/tokenUtils.ts`
```typescript
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { User } from '../models';
import { JwtPayload, TokenResponse } from '../types';

export const generateToken = (id: string, expiresIn: string = process.env.JWT_EXPIRE || '7d'): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn
  });
};

export const generateRefreshToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
  } catch (error) {
    return null;
  }
};

export const sendTokenResponse = (user: User, statusCode: number, res: Response): void => {
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user
  });
};
```

### 9.3 Create `src/utils/emailService.ts`
```typescript
import nodemailer, { Transporter } from 'nodemailer';
import { EmailOptions, BookingEmailData } from '../types';

const transporter: Transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: `Hotel Booking <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Email could not be sent');
  }
};

export const emailTemplates = {
  welcome: (name: string): string => `
    <h1>Welcome to Hotel Booking, ${name}!</h1>
    <p>Thank you for registering. We're excited to help you find your perfect stay.</p>
    <p>Start exploring amazing hotels and book your next adventure!</p>
  `,

  verification: (name: string, verificationUrl: string): string => `
    <h1>Verify Your Email, ${name}</h1>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
    <p>This link expires in 24 hours.</p>
    <p>If you didn't create an account, please ignore this email.</p>
  `,

  resetPassword: (name: string, resetUrl: string): string => `
    <h1>Password Reset Request, ${name}</h1>
    <p>You requested to reset your password. Click the link below:</p>
    <a href="${resetUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `,

  bookingConfirmation: (name: string, booking: BookingEmailData): string => `
    <h1>Booking Confirmed!</h1>
    <p>Hi ${name},</p>
    <p>Your booking has been confirmed. Here are the details:</p>
    <ul>
      <li><strong>Booking ID:</strong> ${booking.id}</li>
      <li><strong>Hotel:</strong> ${booking.hotelName}</li>
      <li><strong>Check-in:</strong> ${booking.checkIn}</li>
      <li><strong>Check-out:</strong> ${booking.checkOut}</li>
      <li><strong>Total Price:</strong> $${booking.totalPrice}</li>
    </ul>
    <p>We look forward to hosting you!</p>
  `,

  bookingCancellation: (name: string, bookingId: string): string => `
    <h1>Booking Cancelled</h1>
    <p>Hi ${name},</p>
    <p>Your booking (ID: ${bookingId}) has been cancelled successfully.</p>
    <p>If you have any questions, please contact our support team.</p>
  `
};
```

### 9.4 Create `src/utils/helpers.ts`
```typescript
import crypto from 'crypto';
import { PaginationInfo } from '../types';

export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const calculateNights = (checkIn: string, checkOut: string): number => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const calculateTotalPrice = (pricePerNight: number, nights: number, numberOfRooms: number): number => {
  return pricePerNight * nights * numberOfRooms;
};

export const getPagination = (page: number = 1, limit: number = 10): { limit: number; offset: number } => {
  const offset = (page - 1) * limit;
  return { limit: parseInt(limit.toString()), offset };
};

export const formatPaginationResponse = <T>(
  data: T[], 
  page: number, 
  limit: number, 
  total: number
): { data: T[]; pagination: PaginationInfo } => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      currentPage: parseInt(page.toString()),
      totalPages,
      totalItems: total,
      itemsPerPage: parseInt(limit.toString()),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

export const sanitizeInput = (obj: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = obj[key].trim();
    } else {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
};

export const datesOverlap = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
  return start1 <= end2 && start2 <= end1;
};
```

## Step 10: Services

### 10.1 Create `src/services/cloudinaryService.ts`
```typescript
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';
import { CloudinaryUploadResult } from '../types';

const bufferToStream = (buffer: Buffer): Readable => {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
};

export const uploadImage = (buffer: Buffer, folder: string = 'hotels'): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `hotel-booking/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            public_id: result.public_id
          });
        } else {
          reject(new Error('Upload failed'));
        }
      }
    );

    bufferToStream(buffer).pipe(uploadStream);
  });
};

export const uploadMultipleImages = async (
  files: Express.Multer.File[], 
  folder: string = 'hotels'
): Promise<CloudinaryUploadResult[]> => {
  const uploadPromises = files.map(file => uploadImage(file.buffer, folder));
  return await Promise.all(uploadPromises);
};

export const deleteImage = async (publicId: string): Promise<any> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

export const deleteMultipleImages = async (publicIds: string[]): Promise<any[]> => {
  const deletePromises = publicIds.map(id => deleteImage(id));
  return await Promise.all(deletePromises);
};
```

### 10.2 Create `src/services/stripeService.ts`
```typescript
import Stripe from 'stripe';
import { StripePaymentIntentMetadata } from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

export const createPaymentIntent = async (
  amount: number, 
  currency: string = 'usd', 
  metadata: StripePaymentIntentMetadata
): Promise<Stripe.PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true
      }
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    throw new Error('Failed to create payment intent');
  }
};

export const confirmPayment = async (paymentIntentId: string): Promise<Stripe.PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Stripe confirm payment error:', error);
    throw new Error('Failed to confirm payment');
  }
};

export const createRefund = async (chargeId: string, amount?: number): Promise<Stripe.Refund> => {
  try {
    const refundData: Stripe.RefundCreateParams = { charge: chargeId };
    
    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundData);
    return refund;
  } catch (error) {
    console.error('Stripe refund error:', error);
    throw new Error('Failed to create refund');
  }
};

export const verifyWebhookSignature = (
  payload: string | Buffer, 
  signature: string
): Stripe.Event | null => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
};
```

## Step 11: Validators

### 11.1 Create `src/validators/authValidator.ts`
```typescript
import { body } from 'express-validator';

export const registerValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),
  
  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters'),
  
  body('phone_number')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number')
];

export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const forgotPasswordValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

export const resetPasswordValidator = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character')
];
```

### 11.2 Create `src/validators/hotelValidator.ts`
```typescript
import { body, query } from 'express-validator';

export const createHotelValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Hotel name is required')
    .isLength({ min: 3 })
    .withMessage('Hotel name must be at least 3 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters'),
  
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
  
  body('postal_code')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),
  
  body('star_rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Star rating must be between 1 and 5'),
  
  body('phone_number')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

export const searchHotelsValidator = [
  query('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty'),
  
  query('country')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Country cannot be empty'),
  
  query('min_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  
  query('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  
  query('star_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Star rating must be between 1 and 5'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];
```

### 11.3 Create `src/validators/bookingValidator.ts`
```typescript
import { body } from 'express-validator';

export const createBookingValidator = [
  body('room_id')
    .notEmpty()
    .withMessage('Room ID is required')
    .isUUID()
    .withMessage('Invalid room ID'),
  
  body('check_in_date')
    .notEmpty()
    .withMessage('Check-in date is required')
    .isISO8601()
    .withMessage('Invalid check-in date format')
    .custom((value) => {
      const checkIn = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (checkIn < today) {
        throw new Error('Check-in date cannot be in the past');
      }
      return true;
    }),
  
  body('check_out_date')
    .notEmpty()
    .withMessage('Check-out date is required')
    .isISO8601()
    .withMessage('Invalid check-out date format')
    .custom((value, { req }) => {
      const checkIn = new Date(req.body.check_in_date);
      const checkOut = new Date(value);
      
      if (checkOut <= checkIn) {
        throw new Error('Check-out date must be after check-in date');
      }
      return true;
    }),
  
  body('number_of_guests')
    .isInt({ min: 1 })
    .withMessage('Number of guests must be at least 1'),
  
  body('number_of_rooms')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Number of rooms must be at least 1'),
  
  body('guest_name')
    .trim()
    .notEmpty()
    .withMessage('Guest name is required'),
  
  body('guest_email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('guest_phone')
    .trim()
    .notEmpty()
    .withMessage('Guest phone is required')
];
```

### 11.4 Create `src/validators/reviewValidator.ts`
```typescript
import { body } from 'express-validator';

export const createReviewValidator = [
  body('hotel_id')
    .notEmpty()
    .withMessage('Hotel ID is required')
    .isUUID()
    .withMessage('Invalid hotel ID'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Review title is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ min: 20 })
    .withMessage('Comment must be at least 20 characters'),
  
  body('cleanliness_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Cleanliness rating must be between 1 and 5'),
  
  body('service_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Service rating must be between 1 and 5'),
  
  body('location_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Location rating must be between 1 and 5'),
  
  body('value_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Value rating must be between 1 and 5')
];
```

Now I'll continue with the Controllers in the next part...