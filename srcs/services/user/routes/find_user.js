export default function findUser(user, db) {

	user.get('/find/:username', async (request, reply) => {
	
	const username = request.params.username;
	if (!username) {
		return reply.status(400).send({ error: 'Username is required' });
	}


	try {
		const userRecord = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
		if (!userRecord) {
			return reply.status(404).send({ error: 'User not found' });
		}

		reply.send({ user: userRecord });
	} catch (err) {
		console.error(err);
		reply.status(500).send({ error: 'Internal server error' });
	}

	});
}
