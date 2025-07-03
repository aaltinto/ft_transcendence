export default function userCreate(user, db) {

	user.get('/create/:username', async (request, reply) => {
	
		const username = request.params.username;
		if (!username) {
			console.error('Username is required');
			return reply.status(400).send({ error: 'Username is required' });
		}

		try {
			// Check if the user already exists
			const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
			if (existingUser) {
				console.error('Username already exists');
				return reply.status(400).send({ error: 'Username already exists' });
			}

			// Insert the new user into the database
			const result = db.prepare('INSERT INTO users (username) VALUES (?)').run(username);
			if (!result.changes) {
				console.error('Failed to create user');

				return reply.status(500).send({ error: 'Failed to create user' });
			}
			console.log(`User ${username} created successfully`);
			reply.status(201).send({ 
                user: { 
                    id: result.lastInsertRowid, 
                    username 
                } 
            });
		}
		catch (err) {
			console.error(err);
			// If an error occurs, we can clean up the user creation
			db.prepare('DELETE FROM users WHERE username = ?').run(username);
			console.error('Internal server error during user creation');
			reply.status(500).send({ error: 'Internal server error' });
		}
	});
}