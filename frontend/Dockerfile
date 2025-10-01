FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

COPY shared ./shared
COPY frontend ./ 

# Set environment to production
ENV NODE_ENV=production

# Build the application
RUN pnpm build --mode production
# Install serve to serve the built files
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]