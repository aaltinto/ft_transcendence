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
            const username = request.body as profileBody
            try {
                db.prepare(`SELECT * FROM users WHERE username = ?`).get(username.username);

            } catch (err) {
                console.log("internal server error on profile");
                return reply.status(500).send("Internal Server Error");
            }
        });
}