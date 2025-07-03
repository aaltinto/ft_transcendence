import generateToken from '../middleware/generateToken.js';
import bcrypt from 'bcrypt';
import xss from 'xss';

export default function registerRoute(auth, db) {
  // API: Register
  auth.post('/register', async (request, reply) => {
    const username = xss(request.body.username);
    const password = xss(request.body.password);

    if (!username || !password) {
      return reply.status(400).send({ error: 'Username and password are required' });
    }

    try {
      // Check if the user already exists
      const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (existingUser) {
        return reply.status(400).send({ error: 'Username already exists' });
      }

      // Insert the new user into the database
      const hashedPassword = await bcrypt.hash(password, 10);
      db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);

      const token = generateToken(username);

      reply.status(201).send({ message: 'User registered successfully', token });
    } catch (err) {
      console.error(err);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });
}