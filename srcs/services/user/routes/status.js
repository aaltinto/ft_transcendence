export default function statusRoute(user, db) {
  user.get('/status', async (request, reply) => {
    try {
      // Simple health check endpoint
      return reply.send({
        success: true,
        message: 'User service is running',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Status check error:', err);
      return reply.status(500).send({
        success: false,
        error: 'Service unavailable'
      });
    }
  });
}
