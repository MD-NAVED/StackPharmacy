# Production container for StackPharmacy API (AWS App Runner / ECS / EC2)
FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies only for smaller image and clean layer caching
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy only runtime source files (excludes tests, local SQLite backup, recordings)
COPY index.js server.js db.js ./
COPY lib ./lib

# Drop root privileges
RUN chown -R node:node /app
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "const p=process.env.PORT||3001;fetch('http://127.0.0.1:'+p+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
