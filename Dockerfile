FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build
COPY config.yml ./dist/config.yml

CMD ["node", "dist/main"]
