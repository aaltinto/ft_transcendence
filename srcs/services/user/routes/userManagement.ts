import { FastifyReply, FastifyInstance, FastifyRequest } from "fastify";
import Database from "better-sqlite3";
import { authenticateJWT } from "../middleware/authenticateJWT.js";

export default function userManagement(
  fastify: FastifyInstance,
  db: Database.Database
): void {
  interface profileBody {
    username: string;
  }
  interface profile {
    id: number;
    username: string;
    status: string;
    matches_played: number;
    matches_won: number;
    last_active: Date;
    created_at: Date;
  }

  fastify.get(
    "/profile",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const username = request.query as profileBody;
      console.log("Fetching profile for user:", username.username);
      try {
        const user = db
          .prepare(`SELECT * FROM users WHERE username = ?`)
          .get(username.username);
        console.log("DB result:", user);
        if (!user) {
          return reply.status(404).send("User not found");
        }
        const parsedUser = user as profile;
        return reply.status(200).send({
          id: parsedUser.id,
          username: parsedUser.username,
          status: parsedUser.status,
          matches_played: parsedUser.matches_played,
          matches_won: parsedUser.matches_won,
          last_active: parsedUser.last_active,
          created_at: parsedUser.created_at,
        });
      } catch (err) {
        console.log("internal server error on profile");
        return reply.status(500).send("Internal Server Error");
      }
    }
  );

  fastify.delete(
    "/profile/delete",
    { preHandler: [authenticateJWT] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;

        if (!user || !user.username) {
          return reply.status(400).send({
            error: "Invalid user data in token",
            message: "Unable to identify user from authentication token",
          });
        }

        const username = user.username;

        // Check if user exists before attempting deletion
        const existingUser = db
          .prepare("SELECT id, username FROM users WHERE username = ?")
          .get(username) as {id: number, username: string};

        if (!existingUser) {
          return reply.status(404).send({
            error: "User not found",
            message: `User with username '${username}' does not exist`,
          });
        }

        // Perform soft delete or hard delete based on business requirements
        // Using hard delete for this example
        const deleteResult = db
          .prepare("DELETE FROM users WHERE username = ?")
          .run(username);

        // Check if deletion was successful
        if (deleteResult.changes === 0) {
          return reply.status(500).send({
            error: "Deletion failed",
            message: "User could not be deleted due to an internal error",
          });
        }

        // Log the deletion for audit purposes
        console.log(
          `User account deleted: ${username} (ID: ${existingUser.id})`
        );

        return reply.status(200).send({
          success: true,
          message: "User account successfully deleted",
          deletedUser: {
            id: existingUser.id,
            username: existingUser.username,
          },
        });
      } catch (error) {
        console.error("Error deleting user account:", error);
        return reply.status(500).send({
          error: "Internal Server Error",
          message:
            "An unexpected error occurred while deleting the user account",
        });
      }
    }
  );
}
