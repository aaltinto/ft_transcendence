import Fastify from 'fastify';
import db from './data/db.js';
import dotenv from 'dotenv';
import findUser from './routes/find_user.js';
import userCreate from './routes/user_create.js';
import verifyTokenRoute from './routes/verifyToken.js';
import profileRoute from './routes/profile.js';
import statusRoute from './routes/status.js';

dotenv.config();

const user = Fastify();

// Register CORS plugin
await user.register(import('@fastify/cors'), {
  origin: ['https://localhost:8443', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true
});

// Register routes
findUser(user, db);
userCreate(user, db);
verifyTokenRoute(user, db);
profileRoute(user, db);
statusRoute(user, db);


// Run the server!
user.listen({
    port: 3002,
    host: '0.0.0.0'
}, function (err, address) {
  if (err) {
    user.log.error(err)
    process.exit(1)
  }
  console.log(`Server is now listening on ${address}`)
})
