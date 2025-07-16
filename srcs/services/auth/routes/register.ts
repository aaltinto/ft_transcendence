import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import xss from "xss";
import { publishQueue } from "./message.js";

export default function registerRoute(
  fastify: FastifyInstance,
  db: Database.Database
): void {
  interface RegisterBody {
    username: string;
    password: string;
  }

  fastify.post(
    "/register",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { username, password } = request.body as RegisterBody;
      const user: string = xss(username);
      const pass: string = xss(password);

      if (!user || !pass) {
        console.log("username and password are required");
        return reply
          .status(400)
          .send({ error: "Username and password are required" });
      }
      try {
        const existingUser = db
          .prepare("SELECT * FROM users WHERE username = ?")
          .get(user);
        if (existingUser) {
          console.log("User already exists");
          return reply.status(400).send({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(
          user,
          hashedPassword
        );

        try {
          await publishQueue('user_created', {username: user} );
          console.log("Message sent");
        } catch (err) {
          console.log("Error while sending messages:", err);
        }
        return reply.status(201).send({ message: "User registered successfully" });
      } catch (err) {
        console.log("Internal Server Error", err);
        reply.status(500).send({ error: "Internal Server Error" });
      }
    }
  );

  interface LoginBody {
    username: string;
    password: string;
  }

  fastify.post(
    "/login",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { username, password } = request.body as LoginBody;
      const user = xss(username);
      const pass = xss(password);

      if (!user || !pass) {
        console.log("Username and password are required");
        reply.status(400).send({ error: "Username and password are required" });
      }

      try {
        const dbUser = db
          .prepare("SELECT * FROM users WHERE username = ?")
          .get(user) as { username: string; password: string } | undefined;
        if (!dbUser) {
          console.log("Username or password invalid");
          return reply
            .status(401)
            .send({ error: "Username or password invalid" });
        }

        const isValidPassword = await bcrypt.compare(pass, dbUser.password);
        if (!isValidPassword) {
          console.log("Username or password invalid");
          return reply
            .status(401)
            .send({ error: "Username or password invalid" });
        }

        reply.status(200).send({message: 'login Successful', username: dbUser.username})
      } catch (err) {
        console.log("Internal Server Error", err);
        reply.status(500).send({ error: "Internal Server Error" });
      }
    }
  );
}
