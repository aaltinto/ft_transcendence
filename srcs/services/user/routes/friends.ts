import { FriendsService } from '../data/db.js';
import { FastifyReply, FastifyInstance, FastifyRequest } from 'fastify';

interface UserIdParam {
  userId: string;
}

interface FriendRequestBody {
  friendId: number;
}

interface FriendActionParams {
  userId: string;
  friendId: string;
}

interface FriendshipStatus {
  status: string;
}

// Register all friend-related routes
export default async function friendRoutes(fastify: FastifyInstance) {
  
  // Get user's friends list
  fastify.get<{ Params: UserIdParam }>('/profile/:userId/friends', async (request: FastifyRequest<{ Params: UserIdParam }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      const userIdNum = parseInt(userId);
      
      if (isNaN(userIdNum)) {
        return reply.code(400).send({ error: 'Invalid user ID' });
      }

      const friends = FriendsService.getFriends(userIdNum);
      const friendsCount = FriendsService.getFriendsCount(userIdNum);
      
      return reply.send({
        success: true,
        data: {
          friends,
          count: friendsCount
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch friends' });
    }
  });

  // Get pending friend requests (received)
  fastify.get<{ Params: UserIdParam }>('/profile/:userId/friend-requests', async (request: FastifyRequest<{ Params: UserIdParam }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      const userIdNum = parseInt(userId);
      
      if (isNaN(userIdNum)) {
        return reply.code(400).send({ error: 'Invalid user ID' });
      }

      const pendingRequests = FriendsService.getPendingRequests(userIdNum);
      
      return reply.send({
        success: true,
        data: pendingRequests
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch friend requests' });
    }
  });

  // Get sent friend requests
  fastify.get<{ Params: UserIdParam }>('/profile/:userId/sent-requests', async (request: FastifyRequest<{ Params: UserIdParam }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      const userIdNum = parseInt(userId);
      
      if (isNaN(userIdNum)) {
        return reply.code(400).send({ error: 'Invalid user ID' });
      }

      const sentRequests = FriendsService.getSentRequests(userIdNum);
      
      return reply.send({
        success: true,
        data: sentRequests
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch sent requests' });
    }
  });

  // Send friend request
  fastify.post<{ Params: UserIdParam, Body: FriendRequestBody }>('/profile/:userId/friend-request', async (request: FastifyRequest<{ Params: UserIdParam, Body: FriendRequestBody }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      const { friendId } = request.body;
      const userIdNum = parseInt(userId);
      
      if (isNaN(userIdNum) || !friendId) {
        return reply.code(400).send({ error: 'Invalid user ID or friend ID' });
      }

      if (userIdNum === friendId) {
        return reply.code(400).send({ error: 'Cannot send friend request to yourself' });
      }

      // Check if relationship already exists
      const existingStatus: FriendshipStatus | null = FriendsService.getFriendshipStatus(userIdNum, friendId);
      if (existingStatus) {
        return reply.code(409).send({ 
          error: 'Friendship relationship already exists',
          status: existingStatus.status 
        });
      }

      const result = FriendsService.sendFriendRequest(userIdNum, friendId);
      
      if (result.changes > 0) {
        return reply.code(201).send({
          success: true,
          message: 'Friend request sent successfully'
        });
      } else {
        return reply.code(500).send({ error: 'Failed to send friend request' });
      }
    } catch (error: any) {
      fastify.log.error(error);
      if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return reply.code(404).send({ error: 'User not found' });
      }
      return reply.code(500).send({ error: 'Failed to send friend request' });
    }
  });

  // Accept friend request
  fastify.patch<{ Params: FriendActionParams }>('/profile/:userId/friends/:friendId/accept', async (request: FastifyRequest<{ Params: FriendActionParams }>, reply: FastifyReply) => {
    try {
      const { userId, friendId } = request.params;
      const userIdNum = parseInt(userId);
      const friendIdNum = parseInt(friendId);
      
      if (isNaN(userIdNum) || isNaN(friendIdNum)) {
        return reply.code(400).send({ error: 'Invalid user ID or friend ID' });
      }

      const result = FriendsService.acceptFriendRequest(userIdNum, friendIdNum);
      
      if (result.changes > 0) {
        return reply.send({
          success: true,
          message: 'Friend request accepted'
        });
      } else {
        return reply.code(404).send({ error: 'Friend request not found' });
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to accept friend request' });
    }
  });

  // Remove friend or reject friend request
  fastify.delete<{ Params: FriendActionParams }>('/profile/:userId/friends/:friendId', async (request: FastifyRequest<{ Params: FriendActionParams }>, reply: FastifyReply) => {
    try {
      const { userId, friendId } = request.params;
      const userIdNum = parseInt(userId);
      const friendIdNum = parseInt(friendId);
      
      if (isNaN(userIdNum) || isNaN(friendIdNum)) {
        return reply.code(400).send({ error: 'Invalid user ID or friend ID' });
      }

      const result = FriendsService.removeFriendship(userIdNum, friendIdNum);
      
      if (result.changes > 0) {
        return reply.send({
          success: true,
          message: 'Friendship removed successfully'
        });
      } else {
        return reply.code(404).send({ error: 'Friendship not found' });
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to remove friendship' });
    }
  });

  // Block user
  fastify.post<{ Params: FriendActionParams }>('/profile/:userId/block/:friendId', async (request: FastifyRequest<{ Params: FriendActionParams }>, reply: FastifyReply) => {
    try {
      const { userId, friendId } = request.params;
      const userIdNum = parseInt(userId);
      const friendIdNum = parseInt(friendId);
      
      if (isNaN(userIdNum) || isNaN(friendIdNum)) {
        return reply.code(400).send({ error: 'Invalid user ID or friend ID' });
      }

      if (userIdNum === friendIdNum) {
        return reply.code(400).send({ error: 'Cannot block yourself' });
      }

      const result = FriendsService.blockUser(userIdNum, friendIdNum);
      
      return reply.send({
        success: true,
        message: 'User blocked successfully'
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to block user' });
    }
  });

  // Check friendship status between two profile
  fastify.get<{ Params: FriendActionParams }>('/profile/:userId/friends/:friendId/status', async (request: FastifyRequest<{ Params: FriendActionParams }>, reply: FastifyReply) => {
    try {
      const { userId, friendId } = request.params;
      const userIdNum = parseInt(userId);
      const friendIdNum = parseInt(friendId);
      
      if (isNaN(userIdNum) || isNaN(friendIdNum)) {
        return reply.code(400).send({ error: 'Invalid user ID or friend ID' });
      }

      const status: FriendshipStatus | null = FriendsService.getFriendshipStatus(userIdNum, friendIdNum);
      
      return reply.send({
        success: true,
        data: status || { status: 'none' }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to check friendship status' });
    }
  });
}
// Example middleware for authentication (optional)
// export const authenticateUser = async (request: FastifyRequest, reply: FastifyReply) => {
//   try {
//     // Your authentication logic here
//     // For example, verify JWT token, check session, etc.
//     const userId = request.params?.userId;
//     const currentUserId = request.user?.id; // Assuming you have user in request from auth middleware
    
//     if (parseInt(userId as string) !== currentUserId) {
//       return reply.code(403).send({ error: 'Unauthorized' });
//     }
//   } catch (error) {
//     return reply.code(401).send({ error: 'Authentication required' });
//   }
// };