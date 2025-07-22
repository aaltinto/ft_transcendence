import Fastify from 'fastify';
import db from './data/db.js';
import registerRoute from './routes/register.js';
import twoFactorAuth from './routes/2fa.js';
import { consumeQueue } from './routes/message.js';

import dotenv from 'dotenv';

dotenv.config();

const app = Fastify();

consumeQueue('user_delete', (msg: {username: string}) => {
    // Check if user exists, if not, create in user DB
    db.prepare("DELETE FROM users WHERE username = ?")
        .run(msg.username);

        // Log the deletion for audit purposes
        console.log(
          `User account deleted: ${msg.username}`
        );
});

registerRoute(app, db);
twoFactorAuth(app, db);

app.listen( {port : 3001, host: '0.0.0.0'}, () => {
    console.log("Server running at localhost:3000");
});