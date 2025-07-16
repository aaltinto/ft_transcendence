import Fastify from 'fastify';
import db from './data/db.js';
import registerRoute from './routes/register.js';

const app = Fastify();

registerRoute(app, db);

app.listen( {port : 3000, host: '0.0.0.0'}, () => {
    console.log("Server running at localhost:3000");
});