import Fastify from 'fastify';
import db from './data/db.js';
import dotenv from 'dotenv';
import registerRoute from './routes/register.js';
import loginRoute from './routes/login.js';

dotenv.config();

const auth = Fastify();

// regsister the routes
registerRoute(auth, db);
loginRoute(auth, db);


// Run the server!
auth.listen({
    port: 3001,
    host: '0.0.0.0'
}, function (err, address) {
  if (err) {
    auth.log.error(err)
    process.exit(1)
  }
  console.log(`Server is now listening on ${address}`)
})