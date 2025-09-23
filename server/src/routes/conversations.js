/**
 * Conversations API Routes for Express Server
 *
 * Handles conversation management operations for the chat system.
 * Provides endpoints for listing, deleting, and renaming conversations.
 */

import express from 'express';
import { neon } from '@neondatabase/serverless';

const router = express.Router();

// List conversations endpoint
router.post('/', async (req, res) => {
  try {
    console.log('=== CONVERSATIONS LIST REQUEST ===');
    console.log('Body:', req.body);

    const neonUrl = process.env.NEON_DATABASE_URL;
    if (!neonUrl) {
      return res.status(500).json({
        success: false,
        error: 'Database configuration missing'
      });
    }

    const sql = neon(neonUrl);
    const { action, accountId, limit = 20 } = req.body;

    if (action !== 'list') {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Expected "list"'
      });
    }

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Missing accountId parameter'
      });
    }

    // Fetch conversations for the account
    const conversations = await sql`
      SELECT
        id,
        title,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count,
        (SELECT content FROM messages WHERE conversation_id = conversations.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM conversations
      WHERE account_id = ${accountId}
      ORDER BY updated_at DESC
      LIMIT ${limit}
    `;

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      message_count: parseInt(conv.message_count) || 0,
      last_message: conv.last_message ? conv.last_message.substring(0, 100) : null
    }));

    return res.status(200).json({
      success: true,
      conversations: formattedConversations
    });

  } catch (error) {
    console.error('Conversations list error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations',
      details: error.message
    });
  }
});

// Delete conversation endpoint
router.delete('/', async (req, res) => {
  try {
    console.log('=== CONVERSATION DELETE REQUEST ===');
    console.log('Body:', req.body);

    const neonUrl = process.env.NEON_DATABASE_URL;
    if (!neonUrl) {
      return res.status(500).json({
        success: false,
        error: 'Database configuration missing'
      });
    }

    const sql = neon(neonUrl);
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing conversationId parameter'
      });
    }

    // Delete conversation (messages will be deleted via CASCADE)
    const result = await sql`
      DELETE FROM conversations
      WHERE id = ${conversationId}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error('Conversation delete error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete conversation',
      details: error.message
    });
  }
});

// Rename conversation endpoint
router.put('/', async (req, res) => {
  try {
    console.log('=== CONVERSATION RENAME REQUEST ===');
    console.log('Body:', req.body);

    const neonUrl = process.env.NEON_DATABASE_URL;
    if (!neonUrl) {
      return res.status(500).json({
        success: false,
        error: 'Database configuration missing'
      });
    }

    const sql = neon(neonUrl);
    const { conversationId, title } = req.body;

    if (!conversationId || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing conversationId or title parameter'
      });
    }

    // Update conversation title
    const result = await sql`
      UPDATE conversations
      SET title = ${title}, updated_at = NOW()
      WHERE id = ${conversationId}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error('Conversation rename error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to rename conversation',
      details: error.message
    });
  }
});

export default router;