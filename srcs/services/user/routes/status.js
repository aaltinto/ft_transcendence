import { verifyToken } from "../middleware/auth";

export default function statusRoute(user, db) {
  user.get("/status", { prehandler: verifyToken }, async (request, reply) => {
    const { status } = request.body;
    const username = request.user.username;

    if (!status) {
      return reply.status(400).send({ error: "Status is required" });
    }
    const validStatuses = ["online", "offline", "away", "busy"];
    if (!validStatuses.includes(status)) {
      return reply.status(400).send({ error: "Invalid status" });
    }

    try {
      const now = new Date().toISOString();
      const result = db
        .prepare(
          "UPDATE users SET status = ?, last_active = ? WHERE username = ?"
        )
        .run(status, now, username);
      if (result.changes === 0) {
        console.error(`Failed to update status for user: ${username}`);
        return reply.status(404).send({ error: "User not found" });
      }

      console.log(`User ${username} status updated to ${status}`);
      return reply.send({ message: "Status updated successfully", status });
    } catch (err) {
      console.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  user.get("/status/:username", { prehandler: verifyToken }, async (request, reply) => {
    const username = request.params.username;

    if (!username) {
      return reply.status(400).send({ error: "Username is required" });
    }

    try {
      const userRecord = db.prepare("SELECT status FROM users WHERE username = ?").get(username);
      if (!userRecord) {
        return reply.status(404).send({ error: "User not found" });
      }

      return reply.send({ username, status: userRecord.status });
    } catch (err) {
      console.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
