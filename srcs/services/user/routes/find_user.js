import { verifyToken } from '../middleware/auth.js';

export default function findUser(user, db) {

	user.get('/find/:username', { prehandler: verifyToken }, async (request, reply) => {
	
	const username = request.params.username;
	if (!username) {
		return reply.status(400).send({ error: 'Username is required' });
	}


	try {
		console.log(`Finding user: ${username}`);
		const userRecord = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
		if (!userRecord) {
			return reply.status(404).send({ error: 'User not found' });
		}

		reply.send({ 
                user: { 
                    id: userRecord.id, 
                    username: userRecord.username,
                    display_name: userRecord.display_name,
                    avatar_url: userRecord.avatar_url,
                    status: userRecord.status,
                    matches_played: userRecord.matches_played,
                    matches_won: userRecord.matches_won,
                    last_active: userRecord.last_active,
                    created_at: userRecord.created_at
                } 
            });
	} catch (err) {
		console.error(err);
		reply.status(500).send({ error: 'Internal server error' });
	}

	});
}
