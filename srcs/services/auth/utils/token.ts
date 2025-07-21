import jwt from 'jsonwebtoken';
import { userInfo } from '../routes/2fa.js';

export default function generateJWT(user: userInfo) {
	const token = jwt.sign({
		id: user.id,
		username: user.username,
		email: user.email
		},
		process.env.JWT_SECRET!,
		{expiresIn: "1h"}
	);
	return token;
}