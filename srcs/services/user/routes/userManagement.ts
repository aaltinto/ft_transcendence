import { FastifyReply, FastifyInstance, FastifyRequest } from 'fastify';
import Database from 'better-sqlite3'

export default function userManagement(
    fastify: FastifyInstance,
    db: Database.Database
): void {
    interface profileBody {
        username: string
    }
    interface profile {
        username: string,
        status: string,
        matches_played: number,
        matches_won: number,
        last_active: Date,
        created_at: Date
    }
    fastify.get(
        '/profile',
        async (
            request: FastifyRequest,
            reply: FastifyReply
        ) => {
            const username = request.query as profileBody
            console.log("Fetching profile for user:", username.username);
            try {
                const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username.username);
                console.log("DB result:", user);
                if (!user) {
                    return reply.status(404).send("User not found");
                }
                const parsedUser = user as profile;
                return reply.status(200).send({
                    username: parsedUser.username,
                    status: parsedUser.status,
                    matches_played: parsedUser.matches_played,
                    matches_won: parsedUser.matches_won,
                    last_active: parsedUser.last_active,
                    created_at: parsedUser.created_at
                });

            } catch (err) {
                console.log("internal server error on profile");
                return reply.status(500).send("Internal Server Error");
            }
        });
}