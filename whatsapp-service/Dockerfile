FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY src ./src
# Persist sessions under /data to allow container restarts
VOLUME ["/data"]
ENV PORT=4000
CMD ["node", "src/server.js"]
