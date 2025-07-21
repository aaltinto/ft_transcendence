import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import xss from "xss";
import { generate2FACode, send2FACode } from "../utils/emailService.js";
import jwt from "jsonwebtoken";
import { publishQueue } from "./message.js";
import generateJWT from "../utils/token.js"

export interface userInfo {
	two_fa_code: string;
	two_fa_expires: number;
	is_verified: boolean;
	username: string;
	email: string;
	id: string
}


export default function twoFactorAuth(
	fastify: FastifyInstance,
	db: Database.Database
): void {

	fastify.post('/2fa/request', async (request: FastifyRequest, reply: FastifyReply) => {
		const { email } = request.body as { email: string };

		const SanitizedEmail: string = xss(email);

		const user = await db.prepare('SELECT two_fa_code, two_fa_expires, is_verified FROM users WHERE email=?').get(email) as { two_fa_code: string, two_fa_expires: number, is_verified: boolean };
		if (!user)
			return reply.status(400).send({ error: 'User not found' });

		if (user.is_verified) {
			return reply.status(200).send("User already verified")
		}



		const code: string = generate2FACode();
		const hashedCode: string = await bcrypt.hash(code, 10);
		const expiresAt: number = Date.now() + 10 * 60 * 1000; // 10 min

		// Store code and expiry in DB for this email
		await db.prepare('UPDATE users SET two_fa_code=?, two_fa_expires=? WHERE email=?').run(hashedCode, expiresAt, SanitizedEmail);

		await send2FACode(SanitizedEmail, code);
		reply.send({ success: true });
	});



	fastify.post('/2fa/verify', async (request: FastifyRequest, reply: FastifyReply) => {
		const { email, code } = request.body as { email: string, code: string };

		const mail: string = xss(email);
		const cleanCode: string = xss(code);

		if (!mail || !cleanCode) {
			return reply.status(400).send({error: 'Code and email required'});
		}

		const user = await db.prepare('SELECT * FROM users WHERE email=?').get(email) as userInfo;
		if (!user)
			return reply.status(400).send({ error: 'User not found' });

		const isValid: boolean = await bcrypt.compare(code, user.two_fa_code);

		console.log("code", isValid);

		if (!user || !isValid || Date.now() > user.two_fa_expires) {
			return reply.status(400).send({ error: 'Invalid or expired code' });
		}

		if (!user.is_verified) {
			await db.prepare('UPDATE users SET two_fa_code=NULL, two_fa_expires=NULL, is_verified=TRUE WHERE email=?').run(email);
			try {
        	  await publishQueue('user_created', {username: user.username} );
        	  console.log("Message sent");
        	} catch (err) {
        	  console.log("Error while sending messages:", err);
			  return reply.status(200).send({success:'false', message:'User creation failed'});
        	}
			const token = generateJWT(user);
			return reply.status(200).send({success:'true', message:'User created successfuly', token: token});
		}
		// Mark as verified, clear code
		await db.prepare('UPDATE users SET two_fa_code=NULL, two_fa_expires=NULL WHERE email=?').run(email);
		const token = generateJWT(user);
		reply.send({ success: true, token: token });
	});

}