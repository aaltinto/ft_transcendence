import generateToken from "../middleware/generateToken.js";
import bcrypt from "bcrypt";
import xss from "xss";
import fetch from "node-fetch";

export default function loginRoute(auth, db) {
  // API: Login
  auth.post('/login', async (request, reply) => {
    const username = xss(request.body.username);
    const password = xss(request.body.password);

    if (!username || !password) {
      console.error('Username and password are required');
      return reply.status(400).send({ error: 'Username and password are required' });
    }

    try {
      // Find the user in the database
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (!user) {
        console.error('Invalid username or password');
        return reply.status(401).send({ error: 'Invalid username or password' });
      }

      const isValidPass = await bcrypt.compare(password, user.password);
      if (!isValidPass) {
        console.error('Invalid username or password');
        return reply.status(401).send({ error: 'Invalid username or password' });
      }

      const profileRes = await fetch(`http://user:3002/find/${username}`);
      if (!profileRes.ok) {
        console.error('Failed to retrieve user profile');
        return reply.status(500).send({ error: 'Failed to retrieve user profile' });
      }

      const profileData = await profileRes.json();
      if (!profileData || !profileData.user) {
        console.error('Invalid user profile data');
        return reply.status(500).send({ error: 'Invalid user profile data' });
      }
      const token = generateToken(profileData);

      reply.send({ message: 'Login successful', token });
    } catch (err) {
      console.error(err);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });
}