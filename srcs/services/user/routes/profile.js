import jwt from 'jsonwebtoken';

export default function profileRoute(user, db) {
  // API: Get user profile
  user.get('/profile', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Token required' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      
      const userData = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(decoded.id);
      
      if (!userData) {
        return reply.status(404).send({ error: 'User not found' });
      }

      reply.send({ user: userData });
    } catch (err) {
      console.error(err);
      if (err.name === 'JsonWebTokenError') {
        return reply.status(401).send({ error: 'Invalid token' });
      }
      reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
