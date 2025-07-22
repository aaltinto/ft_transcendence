import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import xss from "xss";
import jwt from "jsonwebtoken";
import { generate2FACode, send2FACode } from "../utils/emailService.js";


async function emailVerificationSend(email: string, db: Database.Database, login:number): Promise<any> {

  const user = await db.prepare('SELECT two_fa_code, two_fa_expires, is_verified FROM users WHERE email=?').get(email) as { two_fa_code: string, two_fa_expires: number, is_verified: boolean };
		if (!user)
			return ({ error: 'User not found' });

		if (user.is_verified && !login) {
			return ({error: 'User already verified'})
		}



		const code: string = generate2FACode();
		const hashedCode: string = await bcrypt.hash(code, 10);
		const expiresAt: number = Date.now() + 10 * 60 * 1000; // 10 min

		// Store code and expiry in DB for this email
		await db.prepare('UPDATE users SET two_fa_code=?, two_fa_expires=? WHERE email=?').run(hashedCode, expiresAt, email);

		await send2FACode(email, code);
		return ({ success: true });
}

export default function registerRoute(
  fastify: FastifyInstance,
  db: Database.Database
): void {
  interface RegisterBody {
    username: string;
    password: string;
    email: string;
  }

  fastify.post(
    "/register",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { username, password, email } = request.body as RegisterBody;
      const user: string = xss(username);
      const pass: string = xss(password);
      const mail: string = xss(email);

      if (!user || !pass || !mail) {
        console.log("username and mail and password are required");
        return reply
          .status(400)
          .send({ error: "Username and mail and password are required" });
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

        db.prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)").run(
          user,
          hashedPassword,
          mail
        );

        try {

          await emailVerificationSend(mail, db, 0);
        } catch (err) {
          console.log("Error sending message", err);
          return reply.status(400).send({success: 'false', message: err});
        }
        return reply.status(201).send({ message: "User registered successfully", data: {user: user, mail: mail} });
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
          .get(user) as { username: string; password: string; email: string; is_verified: boolean } | undefined;
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

        if (!dbUser.is_verified) {
          return reply.status(401).send({success: 'false', message: 'User needs to be verified'});
        }

        try {

          const ret = await emailVerificationSend(dbUser.email, db, 1);
          console.log(dbUser.email, "verification send:", ret);
        } catch (err) {
          console.log("Error sending message", err);
          return reply.status(400).send({success: 'false', message: err});
        }

        reply.status(200).send({message: 'Verification message send', data: {user: dbUser.username, mail: dbUser.email}})
      } catch (err) {
        console.log("Internal Server Error", err);
        reply.status(500).send({ error: "Internal Server Error" });
      }
    }
  );
}
