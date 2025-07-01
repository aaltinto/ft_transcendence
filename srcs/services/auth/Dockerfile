FROM node:18-slim

WORKDIR /app

COPY package.json .

RUN npm install

RUN mkdir -p /app/data

COPY index.js .
COPY data/db.js ./data/

CMD ["node", "index.js"]