import { verifyToken } from '../middleware/auth.js';

export default function verifyTokenRoute(user, db) {
    user.get('/verify-token', { preHandler: verifyToken }, async (request, reply) => {
        // If middleware passes, token is valid
        reply.send({ 
            valid: true, 
            user: request.user 
        });
    });
}