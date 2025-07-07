import generateToken from '../middleware/generateToken.js';
import bcrypt from 'bcrypt';
import xss from 'xss';
import fetch from 'node-fetch';

export default function registerRoute(auth, db) {
  // API: Register
  auth.post('/register', async (request, reply) => {
    const username = xss(request.body.username);
    const password = xss(request.body.password);

    if (!username || !password) {
      console.error('Username and password are required');
      return reply.status(400).send({ error: 'Username and password are required' });
    }

    try {
      // Check if the user already exists
      const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (existingUser) {
        console.error('Username already exists');
        return reply.status(400).send({ error: 'Username already exists' });
      }

      // Insert the new user into the database
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
      if (!result.changes) {
        console.error('Failed to create user');
        return reply.status(500).send({ error: 'Failed to create user' });
      }


      const profileRes = await fetch(`http://user:3002/create/${username}`);
      if (!profileRes.ok) {
        console.error('Failed to create user profile');
        db.prepare('DELETE FROM users WHERE username = ?').run(username);
        return reply.status(500).send({ error: 'Failed to create user profile' });
      }


      const profileData = await profileRes.json();
      if (!profileData || !profileData.user) {
        console.error('Invalid user profile data');
        db.prepare('DELETE FROM users WHERE username = ?').run(username);
        return reply.status(500).send({ error: 'Invalid user profile data' });
      }
      const token = generateToken(profileData.user);

      console.log(`User ${username} registered successfully`);
      reply.status(201).send({ message: 'User registered successfully', token });
    } catch (err) {
      console.error(err);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });
}