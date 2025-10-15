# Hotel Backend API (Node.js/TypeScript)

Express-based REST API for hotel booking application built with TypeScript.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose) or PostgreSQL
- **Authentication**: JWT
- **Validation**: Express Validator
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **Payment**: Stripe
- **Testing**: Jest + Supertest
- **Logging**: Winston

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB or PostgreSQL
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

4. Run database migrations (if using SQL):
```bash
npm run migrate
```

5. Seed the database (optional):
```bash
npm run seed
```

### Development

```bash
npm run dev
```

Server will start on `http://localhost:5000`

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Linting & Formatting

```bash
# Check for linting errors
npm run lint

# Fix linting errors
npm run lint:fix

# Format code
npm run format
```

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Express middleware
├── services/        # Business logic
├── utils/           # Utility functions
├── validators/      # Input validation schemas
├── constants/       # Constants and enums
├── database/        # Database setup and seeders
├── tests/           # Test files
├── jobs/            # Background jobs
├── types/           # TypeScript type definitions
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create room (Admin)
- `PUT /api/rooms/:id` - Update room (Admin)
- `DELETE /api/rooms/:id` - Delete room (Admin)

### Search
- `GET /api/search/rooms` - Search available rooms with filters
- `GET /api/search/available` - Check availability for date range

### Bookings
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Reviews
- `GET /api/reviews/room/:roomId` - Get room reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/:bookingId` - Get payment details

## Environment Variables

See `.env.example` for all required environment variables.

## Error Handling

All errors follow a consistent format:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details (development only)"
}
```

## Authentication

API uses JWT tokens for authentication. Include token in Authorization header:
```
Authorization: Bearer <token>
```

## Rate Limiting

API requests are rate limited to prevent abuse. Default: 100 requests per 15 minutes.

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Run linting and tests
5. Submit a pull request

## License

ISC
