import jwt from 'jsonwebtoken';

export default function verifyTokenRoute(user, db) {
  user.post('/verify-token', async (request, reply) => {
    try {
      const { token } = request.body;

      if (!token) {
        return reply.status(400).send({ 
          success: false,
          error: 'Token is required' 
        });
      }

      // Verify the token
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      
      // Check if user exists in database
      const userExists = await db.get(
        'SELECT id, username FROM users WHERE id = ?',
        [decoded.id]
      );

      if (!userExists) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }

      return reply.send({
        success: true,
        user: {
          id: userExists.id,
          username: userExists.username
        }
      });

    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return reply.status(401).send({
          success: false,
          error: 'Token has expired'
        });
      } else if (err.name === 'JsonWebTokenError') {
        return reply.status(401).send({
          success: false,
          error: 'Invalid token'
        });
      } else {
        console.error('Token verification error:', err);
        return reply.status(500).send({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  });
}
