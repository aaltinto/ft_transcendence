import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

export async function authenticateJWT(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (request as any).user = decoded;
  } catch (err) {
    return reply.status(401).send({ error: "Invalid token" });
  }
}