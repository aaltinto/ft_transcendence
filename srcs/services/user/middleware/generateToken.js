import jwt from 'jsonwebtoken';

export default function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
  };

  // Set token expiration to 1 hour
  const options = { expiresIn: '1h' };

  // Generate the token using the secret key from environment variables
  const token = jwt.sign(payload, process.env.SECRET_KEY, options);

  return token;
}