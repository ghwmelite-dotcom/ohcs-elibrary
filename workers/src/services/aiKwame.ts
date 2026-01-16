/**
 * AI Knowledge Assistant "Kwame" Service
 * RAG-powered Q&A for Ghana's Civil Service
 */

import { extractTextFromDocument } from './documentAI';

interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  CACHE: KVNamespace;
  AI: any;
}

export interface KwameMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  helpful?: boolean | null;
  processingTimeMs?: number;
  chunksUsed?: number;
  createdAt: string;
}

export interface Citation {
  documentId: string;
  documentTitle: string;
  chunkContent: string;
  chunkIndex: number;
  pageNumber?: number;
  section?: string;
  relevanceScore: number;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle?: string;
  documentCategory?: string;
  chunkIndex: number;
  content: string;
  embedding?: number[];
  metadata?: {
    page?: number;
    section?: string;
  };
  score?: number;
}

export interface SessionContext {
  userName?: string;
  userRole?: string;
  userDepartment?: string;
  sessionTopic?: string;
}

// Kwame's personality and system prompt
const KWAME_SYSTEM_PROMPT = `You are Kwame - a friendly, knowledgeable, and warm AI assistant for Ghana's Office of the Head of Civil Service (OHCS). Your name means "born on Saturday" in Akan, symbolizing wisdom and reliability.

WHO YOU ARE:
- You are an expert on Ghana's civil service policies, procedures, HR matters, and regulations
- You are helpful, approachable, and speak with warmth - like a knowledgeable colleague who genuinely wants to help
- You blend professionalism with friendliness - you're not stiff or robotic
- You take pride in helping civil servants find accurate information

YOUR APPROACH:
- Answer questions based on the provided document context
- ALWAYS cite your sources when providing information from documents
- If information is not in the provided context, clearly say so and offer to help find alternative resources
- Use clear, accessible language - avoid unnecessary jargon
- Be concise but thorough

RESPONSE FORMAT:
- Start with a direct answer to the question
- Provide supporting details from the documents
- If citing multiple sources, organize information clearly
- Offer related topics they might want to explore

IMPORTANT RULES:
- NEVER make up information - only use what's in the provided context
- Be honest when you don't know something
- Always maintain a helpful, encouraging tone
- Remember you're here to empower civil servants with knowledge
- When no relevant documents are found, suggest they check with their HR department or the OHCS directly`;

// Fallback response when AI is unavailable
const FALLBACK_RESPONSES = [
  "I apologize, but I'm having trouble processing your question right now. Please try again in a moment.",
  "I'm experiencing some technical difficulties. Could you please rephrase your question or try again shortly?",
  "Sorry, I couldn't process that request. Please try asking your question again.",
];

/**
 * Generate embeddings for text using Cloudflare AI
 */
export async function generateEmbedding(
  env: Env,
  text: string
): Promise<number[]> {
  if (!env.AI) {
    throw new Error('AI binding not available');
  }

  try {
    // Clean and truncate text for embedding
    const cleanText = text
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000); // BGE model has token limits

    const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [cleanText],
    });

    if (!response?.data?.[0]) {
      throw new Error('No embedding returned from AI');
    }

    return response.data[0]; // 768-dimensional vector
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw error;
  }
}

/**
 * Chunk document text into smaller pieces for embedding
 */
export function chunkDocument(
  text: string,
  options: {
    chunkSize?: number;
    chunkOverlap?: number;
    preserveParagraphs?: boolean;
  } = {}
): Array<{ content: string; startChar: number; endChar: number; tokenCount: number }> {
  const {
    chunkSize = 500,
    chunkOverlap = 50,
    preserveParagraphs = true,
  } = options;

  const chunks: Array<{ content: string; startChar: number; endChar: number; tokenCount: number }> = [];

  // Clean text
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (preserveParagraphs) {
    // Split by paragraphs first, then combine/split to target size
    const paragraphs = cleanText.split(/\n\n+/);
    let currentChunk = '';
    let currentStart = 0;
    let charPos = 0;

    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) {
        charPos += para.length + 2;
        continue;
      }

      const paraWithSpace = trimmedPara + '\n\n';

      // Estimate tokens (rough: 1 token ≈ 4 chars)
      const currentTokens = Math.ceil(currentChunk.length / 4);
      const paraTokens = Math.ceil(paraWithSpace.length / 4);

      if (currentTokens + paraTokens <= chunkSize) {
        if (!currentChunk) {
          currentStart = charPos;
        }
        currentChunk += paraWithSpace;
      } else {
        // Save current chunk if it has content
        if (currentChunk.trim()) {
          chunks.push({
            content: currentChunk.trim(),
            startChar: currentStart,
            endChar: charPos,
            tokenCount: Math.ceil(currentChunk.length / 4),
          });
        }
        currentChunk = paraWithSpace;
        currentStart = charPos;
      }
      charPos += para.length + 2;
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        startChar: currentStart,
        endChar: charPos,
        tokenCount: Math.ceil(currentChunk.length / 4),
      });
    }
  } else {
    // Simple sliding window with word boundaries
    const words = cleanText.split(/\s+/);
    let currentChunk: string[] = [];
    let currentTokens = 0;
    let startIdx = 0;
    let charPos = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordTokens = Math.ceil(word.length / 4) + 1; // +1 for space

      if (currentTokens + wordTokens > chunkSize && currentChunk.length > 0) {
        const chunkText = currentChunk.join(' ');
        chunks.push({
          content: chunkText,
          startChar: charPos,
          endChar: charPos + chunkText.length,
          tokenCount: currentTokens,
        });

        // Overlap: keep last few words
        const overlapWords = Math.ceil(chunkOverlap / 4);
        currentChunk = currentChunk.slice(-overlapWords);
        currentTokens = currentChunk.reduce((sum, w) => sum + Math.ceil(w.length / 4) + 1, 0);
        charPos += chunkText.length + 1;
      }

      currentChunk.push(word);
      currentTokens += wordTokens;
    }

    // Last chunk
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join(' ');
      chunks.push({
        content: chunkText,
        startChar: charPos,
        endChar: charPos + chunkText.length,
        tokenCount: currentTokens,
      });
    }
  }

  return chunks;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Search for relevant document chunks using vector similarity
 */
export async function searchDocumentChunks(
  env: Env,
  queryEmbedding: number[],
  options: {
    topK?: number;
    minScore?: number;
    categoryFilter?: string;
    excludeDocumentIds?: string[];
  } = {}
): Promise<DocumentChunk[]> {
  const { topK = 5, minScore = 0.4, categoryFilter, excludeDocumentIds = [] } = options;

  try {
    // Build query with optional filters
    let query = `
      SELECT
        dc.id, dc.documentId, dc.chunkIndex, dc.content, dc.embedding, dc.metadata,
        d.title as documentTitle, d.category as documentCategory
      FROM document_chunks dc
      JOIN documents d ON dc.documentId = d.id
      WHERE d.status = 'published'
        AND dc.embedding IS NOT NULL
    `;

    const params: any[] = [];

    if (categoryFilter) {
      query += ` AND d.category = ?`;
      params.push(categoryFilter);
    }

    if (excludeDocumentIds.length > 0) {
      query += ` AND dc.documentId NOT IN (${excludeDocumentIds.map(() => '?').join(',')})`;
      params.push(...excludeDocumentIds);
    }

    const { results } = await env.DB.prepare(query).bind(...params).all();

    if (!results || results.length === 0) {
      return [];
    }

    // Calculate similarity scores
    const scoredChunks: DocumentChunk[] = [];

    for (const chunk of results) {
      try {
        const embedding = JSON.parse(chunk.embedding as string);
        const score = cosineSimilarity(queryEmbedding, embedding);

        if (score >= minScore) {
          scoredChunks.push({
            id: chunk.id as string,
            documentId: chunk.documentId as string,
            documentTitle: chunk.documentTitle as string,
            documentCategory: chunk.documentCategory as string,
            chunkIndex: chunk.chunkIndex as number,
            content: chunk.content as string,
            embedding,
            metadata: chunk.metadata ? JSON.parse(chunk.metadata as string) : {},
            score,
          });
        }
      } catch (e) {
        // Skip chunks with invalid embeddings
        console.error('Error processing chunk:', chunk.id, e);
      }
    }

    // Sort by score and return top K
    return scoredChunks
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topK);
  } catch (error) {
    console.error('Document chunk search error:', error);
    return [];
  }
}

/**
 * Check if content is valid text (not binary/corrupted)
 */
function isValidTextContent(content: string): boolean {
  if (!content || content.length < 10) return false;

  // Check for high ratio of non-printable characters
  const printable = content.replace(/[^\x20-\x7E\n\r\t]/g, '');
  const ratio = printable.length / content.length;
  if (ratio < 0.7) return false;

  // Check for PDF internal structure patterns (indicates corrupt extraction)
  const pdfMetadataPatterns = [
    /StructTreeRoot\s+\d+\s+\d+\s+R/,
    /ViewerPreferences\s+\d+\s+\d+\s+R/,
    /FontDescriptor\s+\d+\s+\d+\s+R/,
    /DescendantFonts\s+\d+\s+\d+\s+R/,
    /\d+\s+\d+\s+R\s+\d+\s+\d+\s+R\s+\d+\s+\d+\s+R/, // Multiple PDF references
    /TimesNewRomanPS-BoldMT|ArialMT|Calibri-Bold/i, // Font names in PDF
    /CreationDate\(D:\d+/,
    /CDEFGHIJSTUVWXYZcdefghijstuvwxyz/, // Encoding table
    /^PK[\x03\x04]/, // ZIP header (shouldn't be in text)
  ];

  const hasPdfMetadata = pdfMetadataPatterns.some(pattern => pattern.test(content));
  if (hasPdfMetadata) return false;

  // Check that content has actual words (at least 3 words with 3+ characters)
  const words = content.match(/\b[a-zA-Z]{3,}\b/g) || [];
  if (words.length < 3) return false;

  return true;
}

/**
 * Build context from retrieved chunks for the prompt
 */
function buildDocumentContext(chunks: DocumentChunk[]): string {
  // Filter out corrupted/binary chunks
  const validChunks = chunks.filter(chunk => isValidTextContent(chunk.content));

  if (validChunks.length === 0) {
    return 'No relevant documents were found in the library for this question.';
  }

  return validChunks.map((chunk, i) =>
    `[Source ${i + 1}: "${chunk.documentTitle}" (${chunk.documentCategory || 'General'})]\n${chunk.content}`
  ).join('\n\n---\n\n');
}

/**
 * Build citations from chunks
 */
function buildCitations(chunks: DocumentChunk[]): Citation[] {
  // Only include citations for valid text content
  return chunks
    .filter(chunk => isValidTextContent(chunk.content))
    .map(chunk => ({
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle || 'Unknown Document',
      chunkContent: chunk.content.slice(0, 200) + (chunk.content.length > 200 ? '...' : ''),
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.metadata?.page,
      section: chunk.metadata?.section,
      relevanceScore: Math.round((chunk.score || 0) * 100) / 100,
    }));
}

/**
 * Get Kwame's response to a user question using RAG
 */
export async function getKwameResponse(
  env: Env,
  sessionId: string,
  userQuestion: string,
  conversationHistory: KwameMessage[],
  context: SessionContext
): Promise<{ response: string; citations: Citation[]; processingTimeMs: number; chunksUsed: number }> {
  const startTime = Date.now();

  try {
    // 1. Generate embedding for the question
    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateEmbedding(env, userQuestion);
    } catch (embError) {
      console.error('Failed to generate query embedding:', embError);
      return {
        response: "I'm having trouble understanding your question right now. Could you try rephrasing it?",
        citations: [],
        processingTimeMs: Date.now() - startTime,
        chunksUsed: 0,
      };
    }

    // 2. Search for relevant document chunks
    const relevantChunks = await searchDocumentChunks(env, queryEmbedding, {
      topK: 5,
      minScore: 0.35,
    });

    // 3. Build document context
    const documentContext = buildDocumentContext(relevantChunks);

    // 4. Build conversation history context (last 6 messages)
    const historyContext = conversationHistory
      .slice(-6)
      .map(m => `${m.role === 'user' ? 'User' : 'Kwame'}: ${m.content}`)
      .join('\n');

    // 5. Personalization context
    let personalization = '';
    if (context.userName) {
      personalization = `The user's name is ${context.userName}`;
      if (context.userDepartment) {
        personalization += ` from ${context.userDepartment}`;
      }
      if (context.userRole) {
        personalization += ` (Role: ${context.userRole})`;
      }
      personalization += '.';
    }

    // 6. Build the full prompt
    const prompt = `${KWAME_SYSTEM_PROMPT}

${personalization ? `USER CONTEXT: ${personalization}\n` : ''}
DOCUMENT SOURCES:
${documentContext}

${historyContext ? `RECENT CONVERSATION:\n${historyContext}\n` : ''}
User: ${userQuestion}

Provide a helpful, accurate response based on the document sources above. If the information is not available in the sources, honestly say so and suggest they contact their HR department or OHCS directly.

Kwame:`;

    // 7. Generate response
    if (!env.AI) {
      return {
        response: FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)],
        citations: buildCitations(relevantChunks),
        processingTimeMs: Date.now() - startTime,
        chunksUsed: relevantChunks.length,
      };
    }

    let aiResponse;
    try {
      // Build the full prompt for the model
      const fullPrompt = `${KWAME_SYSTEM_PROMPT}

${personalization ? `USER CONTEXT: ${personalization}\n` : ''}
DOCUMENT SOURCES:
${documentContext}

${historyContext ? `RECENT CONVERSATION:\n${historyContext}\n` : ''}
User: ${userQuestion}

Provide a helpful, accurate response based on the document sources above. If the information is not available in the sources, honestly say so and suggest they contact their HR department or OHCS directly.

Kwame:`;

      aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        prompt: fullPrompt,
        max_tokens: 700,
        temperature: 0.7,
      });

      console.log('AI Response received:', JSON.stringify(aiResponse).slice(0, 200));
    } catch (aiError: any) {
      console.error('AI run error:', aiError?.message || aiError);
      return {
        response: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
        citations: buildCitations(relevantChunks),
        processingTimeMs: Date.now() - startTime,
        chunksUsed: relevantChunks.length,
      };
    }

    let responseText = aiResponse?.response?.trim();

    if (!responseText) {
      responseText = "I apologize, but I couldn't generate a response. Please try rephrasing your question.";
    }

    // 8. Build citations
    const citations = buildCitations(relevantChunks);

    return {
      response: responseText,
      citations,
      processingTimeMs: Date.now() - startTime,
      chunksUsed: relevantChunks.length,
    };
  } catch (error) {
    console.error('Kwame response error:', error);
    return {
      response: "I encountered an unexpected error. Please try your question again.",
      citations: [],
      processingTimeMs: Date.now() - startTime,
      chunksUsed: 0,
    };
  }
}

/**
 * Get suggested questions based on user context
 */
export async function getSuggestedQuestions(
  env: Env,
  context: SessionContext
): Promise<string[]> {
  try {
    // Fetch personalized suggestions based on role/department
    const { results } = await env.DB.prepare(`
      SELECT question FROM kwame_suggested_questions
      WHERE isActive = 1
        AND (targetRole IS NULL OR targetRole = ?)
        AND (targetDepartment IS NULL OR targetDepartment = ?)
      ORDER BY usageCount DESC, RANDOM()
      LIMIT 5
    `).bind(context.userRole || '', context.userDepartment || '').all();

    if (results && results.length > 0) {
      return results.map((r: any) => r.question);
    }

    // Default suggestions if none found
    return [
      "What are the current leave policies for civil servants?",
      "How do I apply for a transfer between MDAs?",
      "What is the process for promotion in the civil service?",
      "What training opportunities are available?",
      "How do I access my pension information?",
    ];
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [
      "What are the current leave policies for civil servants?",
      "How do I apply for a transfer between MDAs?",
      "What is the process for promotion in the civil service?",
    ];
  }
}

/**
 * Increment usage count for a suggested question
 */
export async function incrementQuestionUsage(
  env: Env,
  question: string
): Promise<void> {
  try {
    await env.DB.prepare(`
      UPDATE kwame_suggested_questions
      SET usageCount = usageCount + 1
      WHERE question = ?
    `).bind(question).run();
  } catch (error) {
    console.error('Error incrementing question usage:', error);
  }
}

/**
 * Process a single document for embedding generation
 */
export async function processDocumentForEmbedding(
  env: Env,
  documentId: string
): Promise<{ success: boolean; chunksCreated: number; error?: string }> {
  try {
    // 1. Get document info
    const document = await env.DB.prepare(`
      SELECT id, title, fileUrl, fileType, category FROM documents WHERE id = ?
    `).bind(documentId).first();

    if (!document) {
      return { success: false, chunksCreated: 0, error: 'Document not found' };
    }

    // 2. Extract text from document
    let text: string;
    try {
      text = await extractTextFromDocument(
        env,
        document.fileUrl as string,
        document.fileType as string
      );
    } catch (extractError) {
      console.error('Text extraction error:', extractError);
      return { success: false, chunksCreated: 0, error: 'Failed to extract text from document' };
    }

    if (!text || text.length < 50) {
      return { success: false, chunksCreated: 0, error: 'Document has insufficient text content' };
    }

    // 3. Chunk the document
    const chunks = chunkDocument(text, {
      chunkSize: 500,
      chunkOverlap: 50,
      preserveParagraphs: true,
    });

    if (chunks.length === 0) {
      return { success: false, chunksCreated: 0, error: 'No chunks generated from document' };
    }

    // 4. Delete existing chunks for this document
    await env.DB.prepare(`
      DELETE FROM document_chunks WHERE documentId = ?
    `).bind(documentId).run();

    // 5. Generate embeddings and store chunks
    let chunksCreated = 0;
    const batchSize = 5; // Process in batches to avoid rate limits

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const chunkIndex = i + j;

        try {
          // Generate embedding
          const embedding = await generateEmbedding(env, chunk.content);

          // Store chunk with embedding
          await env.DB.prepare(`
            INSERT INTO document_chunks (
              id, documentId, chunkIndex, content, startChar, endChar,
              embedding, tokenCount, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `).bind(
            crypto.randomUUID(),
            documentId,
            chunkIndex,
            chunk.content,
            chunk.startChar,
            chunk.endChar,
            JSON.stringify(embedding),
            chunk.tokenCount
          ).run();

          chunksCreated++;
        } catch (chunkError) {
          console.error(`Failed to process chunk ${chunkIndex}:`, chunkError);
          // Continue with other chunks
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { success: true, chunksCreated };
  } catch (error) {
    console.error('Document embedding error:', error);
    return { success: false, chunksCreated: 0, error: String(error) };
  }
}

/**
 * Process embedding queue (for scheduled jobs)
 */
export async function processEmbeddingQueue(
  env: Env,
  maxDocuments: number = 10
): Promise<{ processed: number; succeeded: number; failed: number }> {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    // Get pending documents from queue
    const { results: pendingDocs } = await env.DB.prepare(`
      SELECT eq.id, eq.documentId, eq.attempts
      FROM embedding_queue eq
      JOIN documents d ON eq.documentId = d.id
      WHERE eq.status = 'pending'
        AND eq.attempts < 3
        AND d.status = 'published'
      ORDER BY eq.priority DESC, eq.createdAt ASC
      LIMIT ?
    `).bind(maxDocuments).all();

    if (!pendingDocs || pendingDocs.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    for (const doc of pendingDocs) {
      processed++;

      // Mark as processing
      await env.DB.prepare(`
        UPDATE embedding_queue
        SET status = 'processing', attempts = attempts + 1
        WHERE id = ?
      `).bind(doc.id).run();

      // Process document
      const result = await processDocumentForEmbedding(env, doc.documentId as string);

      if (result.success) {
        succeeded++;
        await env.DB.prepare(`
          UPDATE embedding_queue
          SET status = 'completed', processedAt = datetime('now')
          WHERE id = ?
        `).bind(doc.id).run();
      } else {
        failed++;
        const newStatus = (doc.attempts as number) >= 2 ? 'failed' : 'pending';
        await env.DB.prepare(`
          UPDATE embedding_queue
          SET status = ?, error = ?
          WHERE id = ?
        `).bind(newStatus, result.error || 'Unknown error', doc.id).run();
      }
    }
  } catch (error) {
    console.error('Embedding queue processing error:', error);
  }

  return { processed, succeeded, failed };
}

/**
 * Add document to embedding queue
 */
export async function queueDocumentForEmbedding(
  env: Env,
  documentId: string,
  priority: number = 0
): Promise<void> {
  try {
    // Check if document is already in queue
    const existing = await env.DB.prepare(`
      SELECT id FROM embedding_queue WHERE documentId = ?
    `).bind(documentId).first();

    if (existing) {
      // Update existing entry
      await env.DB.prepare(`
        UPDATE embedding_queue
        SET status = 'pending', priority = MAX(priority, ?), attempts = 0, error = NULL
        WHERE documentId = ?
      `).bind(priority, documentId).run();
    } else {
      // Insert new entry
      await env.DB.prepare(`
        INSERT INTO embedding_queue (id, documentId, status, priority, createdAt)
        VALUES (?, ?, 'pending', ?, datetime('now'))
      `).bind(crypto.randomUUID(), documentId, priority).run();
    }
  } catch (error) {
    console.error('Error queuing document for embedding:', error);
  }
}

/**
 * Get embedding statistics
 */
export async function getEmbeddingStats(env: Env): Promise<{
  totalDocuments: number;
  embeddedDocuments: number;
  totalChunks: number;
  pendingQueue: number;
  failedQueue: number;
}> {
  try {
    const [totalDocs, embeddedDocs, totalChunks, pendingQueue, failedQueue] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) as count FROM documents WHERE status = 'published'`).first(),
      env.DB.prepare(`SELECT COUNT(DISTINCT documentId) as count FROM document_chunks`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM document_chunks`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM embedding_queue WHERE status = 'pending'`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM embedding_queue WHERE status = 'failed'`).first(),
    ]);

    return {
      totalDocuments: (totalDocs as any)?.count || 0,
      embeddedDocuments: (embeddedDocs as any)?.count || 0,
      totalChunks: (totalChunks as any)?.count || 0,
      pendingQueue: (pendingQueue as any)?.count || 0,
      failedQueue: (failedQueue as any)?.count || 0,
    };
  } catch (error) {
    console.error('Error getting embedding stats:', error);
    return {
      totalDocuments: 0,
      embeddedDocuments: 0,
      totalChunks: 0,
      pendingQueue: 0,
      failedQueue: 0,
    };
  }
}
