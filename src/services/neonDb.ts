import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';

export interface NeonDbConfig {
  connectionString: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  account_id: string;
  title?: string;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface AgentMemory {
  id: string;
  user_id: string;
  account_id: string;
  memory_type: string;
  key: string;
  value: Record<string, any>;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export class NeonDbService {
  private sql: any;

  constructor(config: NeonDbConfig) {
    this.sql = neon(config.connectionString);
  }

  static create(): NeonDbService {
    const connectionString = import.meta.env.VITE_NEON_DATABASE_URL;
    if (!connectionString) {
      throw new Error('VITE_NEON_DATABASE_URL environment variable is required');
    }
    return new NeonDbService({ connectionString });
  }

  async createConversation(data: {
    user_id: string;
    account_id: string;
    title?: string;
    metadata?: Record<string, any>;
  }): Promise<Conversation> {
    const id = uuidv4();
    const now = new Date();
    const metadata = data.metadata || {};

    const result = await this.sql`
      INSERT INTO conversations (id, user_id, account_id, title, metadata, created_at, updated_at)
      VALUES (${id}, ${data.user_id}, ${data.account_id}, ${data.title || null}, ${JSON.stringify(metadata)}, ${now}, ${now})
      RETURNING *
    `;

    return this.mapConversationRow(result[0]);
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const result = await this.sql`
      SELECT * FROM conversations WHERE id = ${id}
    `;

    return result.length > 0 ? this.mapConversationRow(result[0]) : null;
  }

  async getConversationsByUser(userId: string, limit: number = 20): Promise<Conversation[]> {
    const result = await this.sql`
      SELECT * FROM conversations 
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
      LIMIT ${limit}
    `;

    return result.map((row: any) => this.mapConversationRow(row));
  }

  async updateConversation(id: string, updates: {
    title?: string;
    metadata?: Record<string, any>;
  }): Promise<Conversation | null> {
    const now = new Date();
    const setClause = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      setClause.push('title = $' + (setClause.length + 1));
      values.push(updates.title);
    }

    if (updates.metadata !== undefined) {
      setClause.push('metadata = $' + (setClause.length + 1));
      values.push(JSON.stringify(updates.metadata));
    }

    if (setClause.length === 0) {
      return this.getConversation(id);
    }

    setClause.push('updated_at = $' + (setClause.length + 1));
    values.push(now);
    values.push(id);

    const result = await this.sql`
      UPDATE conversations 
      SET ${this.sql.unsafe(setClause.join(', '))}
      WHERE id = $${setClause.length + 1}
      RETURNING *
    `;

    return result.length > 0 ? this.mapConversationRow(result[0]) : null;
  }

  async createMessage(data: {
    conversation_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: Record<string, any>;
  }): Promise<Message> {
    const id = uuidv4();
    const now = new Date();
    const metadata = data.metadata || {};

    const result = await this.sql`
      INSERT INTO messages (id, conversation_id, role, content, metadata, created_at)
      VALUES (${id}, ${data.conversation_id}, ${data.role}, ${data.content}, ${JSON.stringify(metadata)}, ${now})
      RETURNING *
    `;

    // Update conversation timestamp
    await this.sql`
      UPDATE conversations SET updated_at = ${now} WHERE id = ${data.conversation_id}
    `;

    return this.mapMessageRow(result[0]);
  }

  async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    const result = await this.sql`
      SELECT * FROM messages 
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
      LIMIT ${limit}
    `;

    return result.map((row: any) => this.mapMessageRow(row));
  }

  async setMemory(data: {
    user_id: string;
    account_id: string;
    memory_type: string;
    key: string;
    value: Record<string, any>;
    expires_at?: Date;
  }): Promise<AgentMemory> {
    const id = uuidv4();
    const now = new Date();

    // Upsert: delete existing then insert new
    await this.sql`
      DELETE FROM agent_memory 
      WHERE user_id = ${data.user_id} 
      AND memory_type = ${data.memory_type} 
      AND key = ${data.key}
    `;

    const result = await this.sql`
      INSERT INTO agent_memory (id, user_id, account_id, memory_type, key, value, expires_at, created_at, updated_at)
      VALUES (${id}, ${data.user_id}, ${data.account_id}, ${data.memory_type}, ${data.key}, ${JSON.stringify(data.value)}, ${data.expires_at || null}, ${now}, ${now})
      RETURNING *
    `;

    return this.mapMemoryRow(result[0]);
  }

  async getMemory(userId: string, memoryType: string, key: string): Promise<AgentMemory | null> {
    // Clean up expired memories first
    await this.cleanupExpiredMemories();

    const result = await this.sql`
      SELECT * FROM agent_memory 
      WHERE user_id = ${userId} 
      AND memory_type = ${memoryType} 
      AND key = ${key}
      AND (expires_at IS NULL OR expires_at > NOW())
    `;

    return result.length > 0 ? this.mapMemoryRow(result[0]) : null;
  }

  async getMemoriesByType(userId: string, memoryType: string): Promise<AgentMemory[]> {
    // Clean up expired memories first
    await this.cleanupExpiredMemories();

    const result = await this.sql`
      SELECT * FROM agent_memory 
      WHERE user_id = ${userId} 
      AND memory_type = ${memoryType}
      AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY updated_at DESC
    `;

    return result.map((row: any) => this.mapMemoryRow(row));
  }

  async deleteMemory(userId: string, memoryType: string, key: string): Promise<boolean> {
    const result = await this.sql`
      DELETE FROM agent_memory 
      WHERE user_id = ${userId} 
      AND memory_type = ${memoryType} 
      AND key = ${key}
    `;

    return result.rowCount > 0;
  }

  private async cleanupExpiredMemories(): Promise<void> {
    await this.sql`
      DELETE FROM agent_memory 
      WHERE expires_at IS NOT NULL 
      AND expires_at <= NOW()
    `;
  }

  private mapConversationRow(row: any): Conversation {
    return {
      id: row.id,
      user_id: row.user_id,
      account_id: row.account_id,
      title: row.title,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
    };
  }

  private mapMessageRow(row: any): Message {
    return {
      id: row.id,
      conversation_id: row.conversation_id,
      role: row.role,
      content: row.content,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      created_at: new Date(row.created_at)
    };
  }

  private mapMemoryRow(row: any): AgentMemory {
    return {
      id: row.id,
      user_id: row.user_id,
      account_id: row.account_id,
      memory_type: row.memory_type,
      key: row.key,
      value: typeof row.value === 'string' ? JSON.parse(row.value) : row.value,
      expires_at: row.expires_at ? new Date(row.expires_at) : undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
}