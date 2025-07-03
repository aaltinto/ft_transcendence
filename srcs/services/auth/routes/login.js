import generateToken from "../middleware/generateToken.js";
import bcrypt from "bcrypt";
import xss from "xss";

export default function loginRoute(auth, db) {
  // API: Login
  auth.post('/login', async (request, reply) => {
    const username = xss(request.body.username);
    const password = xss(request.body.password);

    if (!username || !password) {
      return reply.status(400).send({ error: 'Username and password are required' });
    }

    try {
      // Find the user in the database
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (!user) {
        return reply.status(401).send({ error: 'Invalid username or password' });
      }

      const isValidPass = await bcrypt.compare(password, user.password);
      if (!isValidPass) {
        return reply.status(401).send({ error: 'Invalid username or password' });
      }

      const token = generateToken(user);

      reply.send({ message: 'Login successful', token });
    } catch (err) {
      console.error(err);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });
}