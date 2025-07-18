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
    interface FriendRequest {
        username: string,
        friendUsername: string
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

    fastify.get(
        '/friends',
        async (
            request: FastifyRequest,
            reply: FastifyReply
        ) => {
            const username = request.query as profileBody;
            try {
                const user = db.prepare(`SELECT id from users WHERE username = ?`).get(username) as {id: number};
                if (!user)
                    return reply.status(404).send("User not found");
                const friends = db.prepare(`
                    SELECT u.username, u.status, u.avatar_url, f.status as friendship_status
                    FROM friends f
                    JOIN users u ON (f.friend_id = u.id)
                    WHERE f.user_id = ? AND f.status = 'accepted'
                    UNION
                    SELECT u.username, u.status, u.avatar_url, f.status as friendship_status
                    FROM friends f
                    JOIN users u ON (f.user_id = u.id)
                    WHERE f.friend_id = ? AND f.status = 'accepted'
                `).all(user.id, user.id);

                return reply.status(200).send(friends);
            } catch (err) {
                console.error("Internal server error:", err);
                return reply.status(500).send("Internal Server Error");
            }
        }
    );

    fastify.get(
        '/friends/pending',
        async (request: FastifyRequest<{Querystring: {username: string}}>, reply: FastifyReply) => {
            const { username } = request.query;
            
            try {
                // Get user ID
                const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as {id: number};
                if (!user) {
                    return reply.status(404).send("User not found");
                }
                
                // Get pending requests (received)
                const pendingRequests = db.prepare(`
                    SELECT u.username, u.avatar_url, f.created_at
                    FROM friends f
                    JOIN users u ON (f.user_id = u.id)
                    WHERE f.friend_id = ? AND f.status = 'pending'
                `).all(user.id);
                
                return reply.status(200).send(pendingRequests);
            } catch (err) {
                console.error("Error fetching pending requests:", err);
                return reply.status(500).send("Internal Server Error");
            }
        });
    
    // Send a friend request
    fastify.post(
        '/friends/request',
        async (request: FastifyRequest<{Body: FriendRequest}>, reply: FastifyReply) => {
            const { username, friendUsername } = request.body;
            
            try {
                // Get user IDs
                const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as {id: number};
                const friend = db.prepare('SELECT id FROM users WHERE username = ?').get(friendUsername) as {id: number};
                
                if (!user || !friend) {
                    return reply.status(404).send("User not found");
                }
                
                // Check if request already exists
                const existingRequest = db.prepare(
                    'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)'
                ).get(user.id, friend.id, friend.id, user.id);
                
                if (existingRequest) {
                    return reply.status(400).send("Friend request already exists");
                }
                
                // Create friend request
                db.prepare(
                    'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)'
                ).run(user.id, friend.id, 'pending');
                
                return reply.status(201).send("Friend request sent");
            } catch (err) {
                console.error("Error sending friend request:", err);
                return reply.status(500).send("Internal Server Error");
            }
        });
    
    // Accept a friend request
    fastify.put(
        '/friends/accept',
        async (request: FastifyRequest<{Body: FriendRequest}>, reply: FastifyReply) => {
            const { username, friendUsername } = request.body;
            
            try {
                // Get user IDs
                const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as {id: number};
                const friend = db.prepare('SELECT id FROM users WHERE username = ?').get(friendUsername) as {id: number};
                
                if (!user || !friend) {
                    return reply.status(404).send("User not found");
                }
                
                // Find the pending request
                const existingRequest = db.prepare(
                    'SELECT * FROM friends WHERE user_id = ? AND friend_id = ? AND status = ?'
                ).get(friend.id, user.id, 'pending');
                
                if (!existingRequest) {
                    return reply.status(404).send("No pending friend request found");
                }
                
                // Update request status to accepted
                db.prepare(
                    'UPDATE friends SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
                ).run('accepted', existingRequest.id);
                
                return reply.status(200).send("Friend request accepted");
            } catch (err) {
                console.error("Error accepting friend request:", err);
                return reply.status(500).send("Internal Server Error");
            }
        });
    
    // Block a user
    fastify.put(
        '/friends/block',
        async (request: FastifyRequest<{Body: FriendRequest}>, reply: FastifyReply) => {
            const { username, friendUsername } = request.body;
            
            try {
                // Get user IDs
                const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as {id: number};
                const friend = db.prepare('SELECT id FROM users WHERE username = ?').get(friendUsername) as {id: number};
                
                if (!user || !friend) {
                    return reply.status(404).send("User not found");
                }
                
                // Check if there's an existing relationship
                const existingRelationship = db.prepare(
                    'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)'
                ).get(user.id, friend.id, friend.id, user.id);
                
                if (existingRelationship) {
                    // Update existing relationship to blocked
                    db.prepare(
                        'UPDATE friends SET status = ?, user_id = ?, friend_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
                    ).run('blocked', user.id, friend.id, existingRelationship.id);
                } else {
                    // Create new blocked relationship
                    db.prepare(
                        'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)'
                    ).run(user.id, friend.id, 'blocked');
                }
                
                return reply.status(200).send("User blocked");
            } catch (err) {
                console.error("Error blocking user:", err);
                return reply.status(500).send("Internal Server Error");
            }
        });
    
    // Remove/unblock a friend
    fastify.delete(
        '/friends',
        async (request: FastifyRequest<{Body: FriendRequest}>, reply: FastifyReply) => {
            const { username, friendUsername } = request.body;
            
            try {
                // Get user IDs
                const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as {id: number};
                const friend = db.prepare('SELECT id FROM users WHERE username = ?').get(friendUsername) as {id: number};
                
                if (!user || !friend) {
                    return reply.status(404).send("User not found");
                }
                
                // Delete the relationship in both directions
                db.prepare(
                    'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)'
                ).run(user.id, friend.id, friend.id, user.id);
                
                return reply.status(200).send("Friend relationship removed");
            } catch (err) {
                console.error("Error removing friend relationship:", err);
                return reply.status(500).send("Internal Server Error");
            }
        });
}