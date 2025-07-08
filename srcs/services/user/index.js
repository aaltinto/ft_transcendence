import Fastify from 'fastify';
import db from './data/db.js';
import dotenv from 'dotenv';
import findUser from './routes/find_user.js';
import userCreate from './routes/user_create.js';

dotenv.config();

const user = Fastify();

// Register routes
findUser(user, db);
userCreate(user, db);


// Run the server!
user.listen({
    port: 3002,
    host: '0.0.0.0'
}, function (err, address) {
  if (err) {
    auth.log.error(err)
    process.exit(1)
  }
  console.log(`Server is now listening on ${address}`)
})
