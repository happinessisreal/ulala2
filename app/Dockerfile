FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
# Use npm install to avoid lockfile requirement in CI-less context
RUN npm install --omit=dev

COPY app.js ./

ENV PORT=8000
EXPOSE 8000

CMD ["node", "app.js"]
