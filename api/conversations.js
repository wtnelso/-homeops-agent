import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const neonUrl = process.env.NEON_DATABASE_URL;
    if (!neonUrl) {
      return res.status(500).json({
        error: 'Missing NEON_DATABASE_URL environment variable'
      });
    }

    const sql = neon(neonUrl);
    const method = req.method;
    
    if (method === 'POST') {
      const { action, userId, accountId, limit = 20 } = req.body;
      
      if (action === 'list') {
        if (!userId || !accountId) {
          return res.status(400).json({
            error: 'Missing userId or accountId parameters'
          });
        }

        // Get conversations with message count and last message
        const conversations = await sql`
          SELECT 
            c.*,
            COUNT(m.id) as message_count,
            (
              SELECT content 
              FROM messages m2 
              WHERE m2.conversation_id = c.id 
              ORDER BY m2.created_at DESC 
              LIMIT 1
            ) as last_message
          FROM conversations c
          LEFT JOIN messages m ON c.id = m.conversation_id
          WHERE c.user_id = ${userId} AND c.account_id = ${accountId}
          GROUP BY c.id
          ORDER BY c.updated_at DESC
          LIMIT ${limit}
        `;

        return res.status(200).json({
          success: true,
          conversations: conversations.map((conv) => ({
            id: conv.id,
            title: conv.title,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            message_count: parseInt(conv.message_count),
            last_message: conv.last_message
          }))
        });
      }
    } else if (method === 'DELETE') {
      const { conversationId, userId } = req.body;

      if (!conversationId || !userId) {
        return res.status(400).json({
          error: 'Missing conversationId or userId parameters'
        });
      }

      // Verify ownership and delete
      const result = await sql`
        DELETE FROM conversations 
        WHERE id = ${conversationId} AND user_id = ${userId}
        RETURNING id
      `;

      if (result.length === 0) {
        return res.status(404).json({
          error: 'Conversation not found or unauthorized'
        });
      }

      return res.status(200).json({
        success: true,
        deletedId: conversationId
      });

    } else if (method === 'PUT') {
      const { conversationId, userId, title } = req.body;

      if (!conversationId || !userId || !title) {
        return res.status(400).json({
          error: 'Missing required fields'
        });
      }

      const result = await sql`
        UPDATE conversations 
        SET title = ${title}, updated_at = NOW()
        WHERE id = ${conversationId} AND user_id = ${userId}
        RETURNING *
      `;

      if (result.length === 0) {
        return res.status(404).json({
          error: 'Conversation not found or unauthorized'
        });
      }

      return res.status(200).json({
        success: true,
        conversation: result[0]
      });

    } else {
      return res.status(405).json({
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Conversations API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}