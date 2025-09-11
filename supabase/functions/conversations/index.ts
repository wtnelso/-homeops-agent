import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { neon } from "https://esm.sh/@neondatabase/serverless@0.6.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface ListConversationsRequest {
  userId: string
  accountId: string
  limit?: number
}

interface ConversationResponse {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
  last_message?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const neonUrl = Deno.env.get('NEON_DATABASE_URL')
    if (!neonUrl) {
      throw new Error('Missing NEON_DATABASE_URL environment variable')
    }

    const sql = neon(neonUrl)
    const method = req.method
    
    if (method === 'POST') {
      const body = await req.json()
      const { action } = body
      
      if (action === 'list') {
        // List conversations
        const { userId, accountId, limit = 20 } = body

      if (!userId || !accountId) {
        return new Response(
          JSON.stringify({ error: 'Missing userId or accountId parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
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
      `

      return new Response(
        JSON.stringify({
          success: true,
          conversations: conversations.map((conv: any) => ({
            id: conv.id,
            title: conv.title,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            message_count: parseInt(conv.message_count),
            last_message: conv.last_message
          }))
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (method === 'DELETE') {
      // Delete conversation
      const conversationId = url.searchParams.get('conversationId')
      const userId = url.searchParams.get('userId')

      if (!conversationId || !userId) {
        return new Response(
          JSON.stringify({ error: 'Missing conversationId or userId parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify ownership and delete
      const result = await sql`
        DELETE FROM conversations 
        WHERE id = ${conversationId} AND user_id = ${userId}
        RETURNING id
      `

      if (result.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Conversation not found or unauthorized' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, deletedId: conversationId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (method === 'PUT') {
      // Update conversation (rename)
      const { conversationId, userId, title } = await req.json()

      if (!conversationId || !userId || !title) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const result = await sql`
        UPDATE conversations 
        SET title = ${title}, updated_at = NOW()
        WHERE id = ${conversationId} AND user_id = ${userId}
        RETURNING *
      `

      if (result.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Conversation not found or unauthorized' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, conversation: result[0] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Conversations function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})