FROM node:20-slim

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./

RUN npm install --include=dev

COPY . .

RUN npm run build

RUN mkdir -p /app/data

# Start the application
CMD ["npm", "start"]