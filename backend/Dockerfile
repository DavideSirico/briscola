FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY backend/package.json backend/pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

COPY shared ./shared
COPY backend ./

EXPOSE 3001

CMD ["pnpm", "start"]