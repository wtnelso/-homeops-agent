import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { neon } from "https://esm.sh/@neondatabase/serverless@0.6.0"
import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.0.14"
import { HumanMessage, AIMessage, SystemMessage } from "https://esm.sh/@langchain/core@0.1.12/messages"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface ChatRequest {
  message: string
  conversationId?: string
  userId: string
  accountId: string
}

interface DatabaseMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, any>
  created_at: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const neonUrl = Deno.env.get('NEON_DATABASE_URL')
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    const openaiModel = Deno.env.get('OPENAI_MODEL') || 'gpt-4'
    const openaiTemperature = parseFloat(Deno.env.get('OPENAI_TEMPERATURE') || '0.7')

    if (!neonUrl || !openaiApiKey) {
      throw new Error('Missing required environment variables')
    }

    // Initialize Neon connection
    const sql = neon(neonUrl)

    // Initialize OpenAI
    const llm = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: openaiModel,
      temperature: openaiTemperature,
    })

    // Parse request
    const { message, conversationId, userId, accountId }: ChatRequest = await req.json()

    if (!message || !userId || !accountId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get or create conversation
    let currentConversationId = conversationId
    
    if (!currentConversationId) {
      // Create new conversation
      const conversationTitle = message.substring(0, 50).replace(/\n/g, ' ').trim() + 
        (message.length > 50 ? '...' : '')
      
      const newConversationResult = await sql`
        INSERT INTO conversations (user_id, account_id, title, metadata, created_at, updated_at)
        VALUES (${userId}, ${accountId}, ${conversationTitle}, ${JSON.stringify({})}, NOW(), NOW())
        RETURNING id
      `
      
      currentConversationId = newConversationResult[0].id
    }

    // Add user message to database
    await sql`
      INSERT INTO messages (conversation_id, role, content, metadata, created_at)
      VALUES (${currentConversationId}, 'user', ${message}, ${JSON.stringify({})}, NOW())
    `

    // Get recent messages for context (last 10 messages)
    const recentMessages: DatabaseMessage[] = await sql`
      SELECT * FROM messages 
      WHERE conversation_id = ${currentConversationId}
      ORDER BY created_at ASC
      LIMIT 10
    `

    // Build system prompt
    const systemPrompt = `You are a helpful AI assistant for HomeOps, a family logistics and home operations management platform. You help users with:

- Family scheduling and calendar management
- Email organization and insights
- Household task coordination
- Family communication
- Home management tasks

Guidelines:
- Be helpful, friendly, and family-focused
- Provide practical, actionable advice
- Ask clarifying questions when needed
- Keep responses concise but complete`

    // Convert messages to LangChain format
    const langChainMessages = [
      new SystemMessage(systemPrompt),
      ...recentMessages
        .filter(m => m.role !== 'system')
        .map(msg => {
          if (msg.role === 'user') {
            return new HumanMessage(msg.content)
          } else {
            return new AIMessage(msg.content)
          }
        })
    ]

    // Generate AI response
    const aiResponse = await llm.invoke(langChainMessages)
    const aiContent = aiResponse.content as string

    // Save AI response to database
    await sql`
      INSERT INTO messages (conversation_id, role, content, metadata, created_at)
      VALUES (${currentConversationId}, 'assistant', ${aiContent}, ${JSON.stringify({
        model: openaiModel,
        temperature: openaiTemperature,
        generated_at: new Date().toISOString()
      })}, NOW())
    `

    // Update conversation timestamp
    await sql`
      UPDATE conversations 
      SET updated_at = NOW() 
      WHERE id = ${currentConversationId}
    `

    // Get updated messages
    const updatedMessages: DatabaseMessage[] = await sql`
      SELECT * FROM messages 
      WHERE conversation_id = ${currentConversationId}
      ORDER BY created_at ASC
    `

    return new Response(
      JSON.stringify({
        success: true,
        conversationId: currentConversationId,
        messages: updatedMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          metadata: msg.metadata
        }))
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Chat function error:', error)
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