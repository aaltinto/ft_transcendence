import Fastify from 'fastify';
import db from './data/db.js';

const app = Fastify();

app.listen( {port : 3000, host: '0.0.0.0'}, () => {
    console.log("Server running at localhost:3000");
});