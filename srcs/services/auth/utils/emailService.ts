import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS
	},

});

export function generate2FACode(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function send2FACode(email: string, code: string) {
	await transporter.sendMail({
		from: process.env.EMAIL_USER,
		to: email,
		subject:`Email verification code: ${code}`,
		text: `Transcendence verification code is ${code}. Don't share with anyone. If you do not send this request you can safely ignore this mail. Thank you for choosing us`
	})
}