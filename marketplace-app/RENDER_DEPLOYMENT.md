# Deploying to Render

This guide explains how to deploy the P2P Marketplace application to Render.

## Prerequisites

- A Render account (https://render.com)
- Your repository pushed to GitHub
- The environment variables ready

## Step 1: Create a PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click "New +" and select "PostgreSQL"
3. Choose a name (e.g., `marketplace-db`)
4. Select a region close to your users
5. Choose a pricing plan (start with free tier)
6. Click "Create Database"
7. Copy the **External Database URL** - you'll need this for your Web Service

## Step 2: Create a Web Service on Render

1. Click "New +" and select "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `marketplace-api` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for production)

## Step 3: Set Environment Variables

1. In the Web Service settings, go to "Environment"
2. Add the following environment variables:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<paste the PostgreSQL URL from Step 1>
JWT_SECRET=<generate a strong random string>
SMTP_HOST=<your email SMTP host if using email>
SMTP_PORT=<your email SMTP port>
SMTP_USER=<your email>
SMTP_PASS=<your email password or app password>
SMTP_FROM=<from email address>
```

**Important**: For `JWT_SECRET`, generate a strong random string (at least 32 characters):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Deploy

1. Click "Deploy"
2. Render will automatically:
   - Build the application
   - Install dependencies
   - Initialize the database (tables will be created automatically)
   - Start the server

## How Database Tables Are Created Automatically

The app includes an automatic database initialization system in `server/init-db.ts` that:

1. Creates all required PostgreSQL enums (user_role, order_status, etc.)
2. Creates all tables if they don't exist
3. Runs on server startup - no manual migration needed

When your Web Service starts on Render, it automatically calls the initialization logic, so your database will be ready to use immediately.

## Step 5: Access Your Application

- Your frontend will be available at: `https://your-web-service-url.onrender.com`
- The backend API runs on the same domain

## Important Notes

- **First Deployment**: The first deployment may take 5-10 minutes as it initializes the database
- **Database Backups**: Enable automatic backups in the Render PostgreSQL dashboard
- **Scale Up When Needed**: Start with the free tier and scale up as your user base grows
- **Environment Variables**: Keep your `JWT_SECRET` and other sensitive values secure - never commit them to GitHub
- **Hot Reload**: Each time you push to GitHub, Render will automatically deploy your changes

## Troubleshooting

### Database Connection Error
- Check that the DATABASE_URL is correct (External URL, not Internal)
- Ensure the PostgreSQL service is running

### Tables Not Created
- Check the deployment logs in Render
- The init-db.ts script should run automatically on startup
- If tables still don't exist, the server may not have started properly

### Port Issues
- Always use `PORT=10000` as specified in the environment
- Render provides the PORT dynamically; don't hardcode it

## Monitoring

1. Go to your Web Service dashboard on Render
2. Check "Logs" for any errors
3. Monitor the "Metrics" tab for CPU and memory usage
4. Set up alerts if needed

## Scaling Considerations

For production use:
- Upgrade to a paid PostgreSQL plan for better performance and backups
- Use a paid Web Service plan for better uptime guarantee
- Consider enabling auto-scaling if traffic is variable
- Set up monitoring and alerting for database performance

## Support

If you encounter issues:
1. Check the Render deployment logs
2. Verify all environment variables are set correctly
3. Check the database connection string format
4. Review the DEPLOYMENT.md file for additional details
