FROM node:18-slim

WORKDIR /app

COPY package.json .

RUN npm install

RUN mkdir -p /app/data

COPY data/ ./data/
COPY index.js .
COPY routes/ ./routes/

CMD ["node", "index.js"]