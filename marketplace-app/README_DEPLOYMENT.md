# P2P Marketplace - Complete Deployment Package

Your complete P2P marketplace application is ready for Visual Studio Code and Render deployment.

## 📦 What's Included

This archive contains everything needed to run your app on Render:

```
marketplace-app/
├── client/                 # Frontend React application
├── server/                 # Backend Express server
├── shared/                 # Shared types and schemas
├── migrations/             # Database migration files
├── script/                 # Build and seed scripts
├── package.json           # Dependencies
├── drizzle.config.ts      # Database configuration
├── vite.config.ts         # Frontend build config
├── tsconfig.json          # TypeScript config
├── .env.example           # Environment variables template
├── RENDER_DEPLOYMENT.md   # Render deployment guide
├── DEVELOPMENT.md         # Local development guide
└── README_DEPLOYMENT.md   # This file
```

## 🚀 Quick Start

### Step 1: Extract the Archive

On Windows/Mac/Linux:
- **Windows**: Right-click → "Extract All"
- **Mac**: Double-click the `.tar.gz` file
- **Linux**: `tar -xzf marketplace-app.tar.gz`

Or use 7-Zip, WinRAR, or your preferred archiver.

### Step 2: Open in Visual Studio Code

1. Open Visual Studio Code
2. File → Open Folder
3. Select the extracted `marketplace-app` folder
4. Wait for VS Code to recognize the project

### Step 3: Install Dependencies (Local Development)

If you want to test locally:

```bash
npm install
cp .env.example .env
```

Then edit `.env` with your local PostgreSQL connection string.

Start: `npm run dev`

### Step 4: Deploy to Render

Follow the **RENDER_DEPLOYMENT.md** file for step-by-step instructions:

1. Create a PostgreSQL database on Render
2. Create a Web Service
3. Set environment variables
4. Deploy

**Key Point**: Database tables are created **automatically** on first deployment. No manual setup needed!

## 🗄️ Database

### Automatic Table Creation

The app includes automatic database initialization (`server/init-db.ts`) that:

- Creates all PostgreSQL enums (user_role, order_status, etc.)
- Creates all required tables if they don't exist
- Runs on every server startup
- **No manual migrations needed on Render**

When your server starts on Render, it automatically initializes the database. The first deployment may take 5-10 minutes.

### Tables Included

The database includes tables for:

- **Users & Auth**: user accounts, email verification, password reset, 2FA
- **Marketplace**: offers, orders, ratings, disputes
- **Wallets**: balances, transactions, withdrawals
- **KYC**: user verification, identity documents
- **Vendors**: vendor profiles, subscriptions
- **Loaders**: asset lending/loading orders, disputes, feedback
- **Social**: posts, comments, likes, mutes
- **Notifications**: user notifications
- **Admin**: audit logs, maintenance settings, theme configuration
- **Blockchain**: deposit addresses, blockchain deposits, withdrawals

## 📝 Environment Variables

Create a `.env` file with these variables:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
NODE_ENV=production
JWT_SECRET=your-secure-random-string
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

See `.env.example` for all available options.

## 🔐 Security Notes

- **Never commit `.env`** to Git - use `.env.example` as a template
- Generate a strong JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- For email, use app-specific passwords, not your main password
- Keep your DATABASE_URL secure on Render (use environment variables)

## 🛠️ Development vs Production

### Local Development

```bash
npm run dev          # Start with hot reload
npm run check        # Type check
npm run db:push      # Update database schema
```

### Production (Render)

```bash
npm run build        # Build the app
npm start            # Start the server
```

The `package.json` scripts are pre-configured for Render.

## 📊 Features Included

✅ User authentication with 2FA and email verification
✅ KYC/identity verification system
✅ P2P marketplace with orders and disputes
✅ Vendor profiles and ratings
✅ Wallet system with transactions
✅ Blockchain deposit integration
✅ Withdrawal requests
✅ Loader/asset lending system
✅ Real-time notifications
✅ Admin dashboard
✅ Dispute resolution
✅ Multi-language support (EN, FR, RU, SW, ZH)
✅ Email notifications
✅ Rate limiting and security

## 🔗 Important Files

| File | Purpose |
|------|---------|
| `server/index.ts` | Main server entry point |
| `server/routes.ts` | All API endpoints |
| `server/storage.ts` | Database operations |
| `shared/schema.ts` | Database schema definitions |
| `client/src/App.tsx` | Frontend app component |
| `drizzle.config.ts` | Database configuration |
| `RENDER_DEPLOYMENT.md` | Render deployment steps |
| `DEVELOPMENT.md` | Local development guide |

## 🐛 Troubleshooting

### Can't install dependencies?
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database error after deployment?
- Check DATABASE_URL in Render environment
- Wait 5-10 minutes for first deployment initialization
- Check deployment logs in Render dashboard

### PORT issues?
- Always set `PORT=10000` in Render environment
- Don't hardcode ports in code

### 2FA or email not working?
- Configure SMTP variables if needed
- For development, email is optional

## 📚 Additional Resources

- **React docs**: https://react.dev
- **Express.js**: https://expressjs.com
- **Drizzle ORM**: https://orm.drizzle.team
- **Render docs**: https://render.com/docs
- **PostgreSQL**: https://www.postgresql.org/docs

## ✅ Pre-Deployment Checklist

- [ ] Extract archive and open in VS Code
- [ ] Review `RENDER_DEPLOYMENT.md`
- [ ] Create PostgreSQL database on Render
- [ ] Create Web Service on Render
- [ ] Add all environment variables
- [ ] Deploy and check logs
- [ ] Test login and basic features
- [ ] Set up monitoring/alerts

## 📞 Support

If you need help:

1. Check the deployment logs in Render dashboard
2. Review `RENDER_DEPLOYMENT.md` troubleshooting section
3. Verify all environment variables are set
4. Check that DATABASE_URL is the external connection string

## 🎉 You're Ready!

Your P2P marketplace app is production-ready and fully configured for Render deployment. All database tables will be created automatically on first deployment.

Next steps:
1. Extract this archive
2. Follow `RENDER_DEPLOYMENT.md`
3. Deploy to Render
4. Your app will be live!

Good luck! 🚀
