FROM node:20-alpine AS builder
WORKDIR /app

# copy repo
COPY . .

# build inside the marketplace-app folder
WORKDIR /app/marketplace-app

# install all dependencies (dev deps needed for build)
RUN npm ci --silent

# build client and server (produces dist/)
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# copy built output and package files
COPY --from=builder /app/marketplace-app/dist ./dist
COPY --from=builder /app/marketplace-app/package.json ./package.json
COPY --from=builder /app/marketplace-app/package-lock.json ./package-lock.json

# install only production deps
RUN npm ci --omit=dev --silent

EXPOSE 5000
ENV PORT=5000

CMD ["node", "dist/index.cjs"]
