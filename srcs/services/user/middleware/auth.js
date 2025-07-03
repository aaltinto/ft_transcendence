import jwt from 'jsonwebtoken';

export function verifyToken(request, reply, done) {
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return reply.status(401).send({ error: 'Access denied. No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      request.user = decoded;
      done();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return reply.status(401).send({ error: 'Token has expired. Please login again' });
        } else {
            reply.status(403).send({ error: 'Invalid token.' });
        }
    }
}