# Development Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or remote)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create a `.env` file** based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   
   Fill in your local database URL:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/marketplace
   ```

3. **Start the application**:
   ```bash
   npm run dev
   ```

   This starts:
   - Backend server on `http://localhost:3000`
   - Frontend on `http://localhost:5000`

## Database

### Automatic Initialization

The database is automatically initialized on server startup:
- All enums are created if they don't exist
- All tables are created if they don't exist
- No manual migrations needed

### Database Migrations

If you modify the schema in `shared/schema.ts`:

1. Update the schema in `shared/schema.ts`
2. Run: `npm run db:push`
3. This will update the `migrations/` folder

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   └── App.tsx      # Main app file
│   └── index.html       # HTML template
│
├── server/              # Backend Express server
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── utils/          # Utility functions
│   ├── db.ts           # Database connection
│   └── init-db.ts      # Database initialization
│
├── shared/             # Shared code
│   └── schema.ts       # Drizzle ORM schema
│
├── migrations/         # Database migrations
└── package.json        # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run dev:client` - Start frontend only
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check
- `npm run db:push` - Push database migrations

## Database Schema

All tables are defined in `shared/schema.ts` and created automatically via `server/init-db.ts`.

Key tables:
- `users` - User accounts and authentication
- `vendor_profiles` - Vendor information
- `offers` - Trading offers
- `orders` - Orders and transactions
- `wallets` - User wallets and balances
- `disputes` - Dispute management
- `loader_orders` - Loader/asset lending system
- And more...

## Environment Variables

See `.env.example` for all available variables.

Essential variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret for JWT tokens

## Troubleshooting

### Port already in use
```bash
# Kill the process on port 5000 or 3000
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Database connection error
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check username/password

### Dependencies issues
```bash
rm -rf node_modules package-lock.json
npm install
```

## Testing the API

The backend API is available at `http://localhost:3000` in development.

Example endpoints:
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/marketplace/offers`
- `POST /api/orders`

See `server/routes.ts` for all available endpoints.
