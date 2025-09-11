import { neon } from '@neondatabase/serverless';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Debug: Log all environment variables (mask sensitive ones)
    console.log('=== ENVIRONMENT DEBUG ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
    
    // Check specific variables we need
    console.log('NEON_DATABASE_URL exists:', !!process.env.NEON_DATABASE_URL);
    console.log('NEON_DATABASE_URL preview:', process.env.NEON_DATABASE_URL ? process.env.NEON_DATABASE_URL.substring(0, 30) + '...' : 'undefined');
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('OPENAI_API_KEY preview:', process.env.OPENAI_API_KEY ? '***' + process.env.OPENAI_API_KEY.slice(-4) : 'undefined');
    console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL);
    console.log('OPENAI_TEMPERATURE:', process.env.OPENAI_TEMPERATURE);
    
    // Log all env vars that might be relevant
    Object.keys(process.env).filter(key => 
      key.includes('NEON') || key.includes('OPENAI') || key.includes('DATABASE')
    ).forEach(key => {
      console.log(`${key}:`, key.includes('KEY') || key.includes('URL') ? '***masked***' : process.env[key]);
    });
    console.log('=== END ENVIRONMENT DEBUG ===');

    // Get environment variables
    const neonUrl = process.env.NEON_DATABASE_URL;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const openaiTemperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.3');

    if (!neonUrl || !openaiApiKey) {
      return res.status(500).json({
        error: 'Missing environment variables',
        details: {
          hasNeonUrl: !!neonUrl,
          hasOpenAiKey: !!openaiApiKey
        }
      });
    }

    // Initialize services
    const sql = neon(neonUrl);
    const llm = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: openaiModel,
      temperature: openaiTemperature,
    });

    const { message, conversationId, userId, accountId } = req.body;

    if (!message || !userId || !accountId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: {
          hasMessage: !!message,
          hasUserId: !!userId,
          hasAccountId: !!accountId
        }
      });
    }

    // Get or create conversation
    let currentConversationId = conversationId;
    
    if (!currentConversationId) {
      const conversationTitle = message.substring(0, 50).replace(/\n/g, ' ').trim() + 
        (message.length > 50 ? '...' : '');
      
      const newConversationResult = await sql`
        INSERT INTO conversations (user_id, account_id, title, metadata, created_at, updated_at)
        VALUES (${userId}, ${accountId}, ${conversationTitle}, ${JSON.stringify({})}, NOW(), NOW())
        RETURNING id
      `;
      
      currentConversationId = newConversationResult[0].id;
    }

    // Add user message to database
    await sql`
      INSERT INTO messages (conversation_id, role, content, metadata, created_at)
      VALUES (${currentConversationId}, 'user', ${message}, ${JSON.stringify({})}, NOW())
    `;

    // Get recent messages for context (last 10 messages)
    const recentMessages = await sql`
      SELECT * FROM messages 
      WHERE conversation_id = ${currentConversationId}
      ORDER BY created_at ASC
      LIMIT 10
    `;

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
- Keep responses concise but complete`;

    // Convert messages to LangChain format
    const langChainMessages = [
      new SystemMessage(systemPrompt),
      ...recentMessages
        .filter(m => m.role !== 'system')
        .map(msg => {
          if (msg.role === 'user') {
            return new HumanMessage(msg.content);
          } else {
            return new AIMessage(msg.content);
          }
        })
    ];

    // Generate AI response
    const aiResponse = await llm.invoke(langChainMessages);
    const aiContent = aiResponse.content;

    // Save AI response to database
    await sql`
      INSERT INTO messages (conversation_id, role, content, metadata, created_at)
      VALUES (${currentConversationId}, 'assistant', ${aiContent}, ${JSON.stringify({
        model: openaiModel,
        temperature: openaiTemperature,
        generated_at: new Date().toISOString()
      })}, NOW())
    `;

    // Update conversation timestamp
    await sql`
      UPDATE conversations 
      SET updated_at = NOW() 
      WHERE id = ${currentConversationId}
    `;

    // Get updated messages
    const updatedMessages = await sql`
      SELECT * FROM messages 
      WHERE conversation_id = ${currentConversationId}
      ORDER BY created_at ASC
    `;

    return res.status(200).json({
      success: true,
      conversationId: currentConversationId,
      messages: updatedMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        metadata: msg.metadata
      }))
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}