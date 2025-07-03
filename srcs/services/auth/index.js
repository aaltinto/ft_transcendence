import Fastify from 'fastify';
import db from './data/db.js';
import dotenv from 'dotenv';
import helmet from '@fastify/helmet';
import registerRoute from './routes/register.js';
import loginRoute from './routes/login.js';

dotenv.config();

const auth = Fastify();

auth.register(helmet,{
    contentSecurityPolicy: false, // Disable CSP if not needed
    frameguard: { action: 'deny' }, // Prevent iframe embedding
});

// regsister the routes
registerRoute(auth, db);
loginRoute(auth, db);


// Run the server!
auth.listen({
    port: 3000,
    host: '0.0.0.0'
}, function (err, address) {
  if (err) {
    auth.log.error(err)
    process.exit(1)
  }
  console.log(`Server is now listening on ${address}`)
})