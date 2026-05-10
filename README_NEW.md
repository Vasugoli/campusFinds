# CampusFinds Server

RESTful API backend for the CampusFinds Lost & Found application built with Deno, Hono, and MongoDB.

## Quick Start

### Prerequisites

- Deno 1.40+
- MongoDB (local or Atlas)
- Node.js runtime (for npm dependencies)

### Installation

1. **Setup environment variables:**

```bash
cp ../.env.example ../.env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/campusfinds
JWT_SECRET=your-secret-key-min-32-chars
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@campusfinds.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

2. **Install and run:**

```bash
# Development
deno task dev

# Production
deno task build
```

## Project Structure

```
server/src/
├── config.ts              # App setup, middleware, env validation
├── database.ts            # MongoDB connection
├── index.ts               # Entry point with routes
├── controllers/           # Business logic
├── routes/                # API route definitions
├── middleware/            # Auth, rate limiting, request ID
├── models/                # MongoDB schemas (Mongoose)
└── utils/
    ├── envConfig.ts       # Environment validation
    ├── logger.ts          # Structured logging with request IDs
    ├── sanitizer.ts       # Input sanitization (XSS/NoSQL injection)
    ├── validationSchemas.ts # Zod schemas
    ├── jobQueue.ts        # Async job queue for emails
    ├── emailService.ts    # SendGrid integration
    ├── cloudinaryService.ts # Image upload
    └── more...
```

## API Routes

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Login (returns JWT)
- `GET /api/auth/me` - Get current user

### Items
- `GET /api/items` - List items (paginated, searchable)
- `GET /api/items/:id` - Get item details
- `POST /api/items` - Create item (auth required)
- `PUT /api/items/:id` - Update item (auth required)
- `DELETE /api/items/:id` - Delete item (auth required)

### Claims
- `POST /api/claims` - Create claim (auth required)
- `GET /api/claims` - List claims (auth required)
- `PUT /api/claims/:id` - Respond to claim (auth required)

### Reports & Admin
- `POST /api/reports` - Report item
- `GET /api/admin/dashboard` - Admin dashboard

## Features

✅ JWT authentication with bcrypt hashing
✅ Input sanitization (XSS/NoSQL injection prevention)
✅ Dynamic CORS configuration via environment
✅ Comprehensive Zod validation schemas
✅ Structured logging with request IDs
✅ Async job queue for non-blocking emails
✅ Rate limiting on all routes
✅ MongoDB integration with Mongoose
✅ Activity audit logging

## Configuration

**Required Environment Variables:**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `CLOUDINARY_*` - Image upload credentials
- `SENDGRID_*` - Email service credentials
- `CLIENT_URL` - Frontend URL
- `ALLOWED_ORIGINS` - CORS origins (comma-separated)

See `.env.example` for all options.

## Deployment

### Docker

```bash
docker build -t campusfinds-server .
docker run -p 5000:5000 -e MONGODB_URI=... campusfinds-server
```

### Environment Setup for Production

1. Set strong `JWT_SECRET` (min 32 chars, random)
2. Use MongoDB Atlas connection string
3. Configure SendGrid API key
4. Set `NODE_ENV=production`
5. Update `ALLOWED_ORIGINS` with production domains

## License

MIT
