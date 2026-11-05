FROM node:22-trixie-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8800
ENV DATABASE_PATH=/data/closet-circle.db
ENV UPLOADS_PATH=/data/uploads
ENV IMAGE_URL_PREFIX=/backend-api/uploads
ENV SEED_DATABASE_ON_START=true

EXPOSE 8800

CMD ["npm", "start"]
