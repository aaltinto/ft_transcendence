FROM node:18-slim

WORKDIR /app

COPY package.json .

RUN npm install

RUN mkdir -p /app/data

COPY index.js .
COPY middleware/auth.js ./middleware/
COPY middleware/generateToken.js ./middleware/
COPY data/db.js ./data/
COPY routes/register.js ./routes/
COPY routes/login.js ./routes/

CMD ["node", "index.js"]