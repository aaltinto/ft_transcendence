export default function loginRoute(auth, db) {
  // API: Login
  auth.post('/login', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.status(400).send({ error: 'Username and password are required' });
    }

    try {
      // Find the user in the database
      const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
      if (!user) {
        return reply.status(401).send({ error: 'Invalid username or password' });
      }

      reply.send({ message: 'Login successful' });
    } catch (err) {
      console.error(err);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });
}