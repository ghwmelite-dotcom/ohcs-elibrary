/**
 * Document AI Analysis Service
 * Provides AI-powered document analysis, summarization, and Q&A
 */

interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  CACHE: KVNamespace;
  AI: any;
}

export interface DocumentAnalysis {
  summary: string;
  keyPoints: string[];
  topics: string[];
  complexity: 'basic' | 'intermediate' | 'advanced';
  readingTime: number;
  recommendations: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'informative';
  wordCount: number;
}

export interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

/**
 * Extract text content from a document file
 * For PDFs and text-based documents
 */
export async function extractTextFromDocument(
  env: Env,
  fileUrl: string,
  fileType: string
): Promise<string> {
  try {
    // Get file from R2
    const object = await env.DOCUMENTS.get(fileUrl);
    if (!object) {
      throw new Error('File not found in storage');
    }

    const arrayBuffer = await object.arrayBuffer();

    // For text-based files, extract directly
    if (fileType.includes('text') || fileType.includes('json') || fileType.includes('xml')) {
      const text = new TextDecoder().decode(arrayBuffer);
      return text.slice(0, 50000); // Limit to ~50KB of text
    }

    // For PDFs, we'll extract what we can
    // Note: Full PDF parsing would require pdf.js or similar
    // For now, we'll use a simplified approach and rely on metadata + AI
    if (fileType.includes('pdf')) {
      // Try to extract any readable text from PDF
      const bytes = new Uint8Array(arrayBuffer);
      let text = '';

      // Simple extraction of text streams from PDF
      // This is a basic approach - production would use a proper PDF parser
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const content = decoder.decode(bytes);

      // Extract text between common PDF text markers
      const textMatches = content.match(/\(([^)]+)\)/g);
      if (textMatches) {
        text = textMatches
          .map(m => m.slice(1, -1))
          .filter(t => t.length > 3 && /[a-zA-Z]/.test(t))
          .join(' ');
      }

      // Also try to find plain text streams
      const streamMatch = content.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g);
      if (streamMatch) {
        const additionalText = streamMatch
          .map(s => s.replace(/stream[\r\n]+/, '').replace(/[\r\n]+endstream/, ''))
          .filter(t => /[a-zA-Z]{3,}/.test(t))
          .join(' ');
        text += ' ' + additionalText;
      }

      // Clean up the text
      text = text
        .replace(/[^\x20-\x7E\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return text.slice(0, 50000) || `Document: PDF file containing civil service related content`;
    }

    // For Word docs and other formats, return placeholder
    // Production would use mammoth.js or similar for .docx
    return `Document content (${fileType})`;
  } catch (error) {
    console.error('Error extracting text:', error);
    return '';
  }
}

/**
 * Generate AI analysis for a document
 */
export async function generateDocumentAnalysis(
  env: Env,
  documentId: string,
  title: string,
  description: string,
  category: string,
  extractedText: string
): Promise<DocumentAnalysis> {
  try {
    if (!env.AI) {
      console.log('AI binding not available, using fallback analysis');
      return generateFallbackAnalysis(title, description, category);
    }

    // Prepare context for AI
    const context = `
Title: ${title}
Category: ${category}
Description: ${description}

Content Preview:
${extractedText.slice(0, 8000)}
`.trim();

    // Generate comprehensive summary
    const summaryPrompt = `You are an AI assistant for Ghana's Office of the Head of Civil Service (OHCS) e-Library. Analyze this document and provide a comprehensive summary.

${context}

Provide a clear, professional 3-4 sentence summary that:
1. Explains what this document is about
2. Highlights its relevance to civil servants
3. Mentions key topics covered

Summary:`;

    const summaryResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: summaryPrompt,
      max_tokens: 300,
      temperature: 0.3,
    });

    const summary = summaryResponse?.response?.trim() ||
      `This ${category} document provides guidance and information for Ghana's civil service. ${description}`;

    // Generate key points
    const keyPointsPrompt = `Based on this document, extract exactly 5 key points that civil servants should know:

${context}

List 5 key points (one per line, no numbering or bullets):`;

    const keyPointsResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: keyPointsPrompt,
      max_tokens: 400,
      temperature: 0.3,
    });

    let keyPoints = parseListResponse(keyPointsResponse?.response || '');
    if (keyPoints.length < 3) {
      keyPoints = generateFallbackKeyPoints(category, title);
    }

    // Generate topics
    const topicsPrompt = `Extract 4-6 topic tags for this document (single words or short phrases):

${context}

Topics (comma-separated):`;

    const topicsResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: topicsPrompt,
      max_tokens: 100,
      temperature: 0.3,
    });

    let topics = parseCommaSeparated(topicsResponse?.response || '');
    if (topics.length < 2) {
      topics = [category, 'Civil Service', 'Ghana Government', 'Policy'];
    }

    // Determine complexity
    const wordCount = extractedText.split(/\s+/).length;
    const complexity = determineComplexity(extractedText, wordCount);
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Determine sentiment
    const sentiment = determineSentiment(extractedText);

    // Generate recommendations (related document types)
    const recommendations = generateRecommendations(category, topics);

    return {
      summary,
      keyPoints: keyPoints.slice(0, 5),
      topics: topics.slice(0, 6),
      complexity,
      readingTime,
      recommendations,
      sentiment,
      wordCount,
    };
  } catch (error) {
    console.error('AI analysis failed:', error);
    return generateFallbackAnalysis(title, description, category);
  }
}

/**
 * Answer questions about a document using AI
 */
export async function answerDocumentQuestion(
  env: Env,
  documentId: string,
  title: string,
  extractedText: string,
  question: string,
  chatHistory: ChatMessage[]
): Promise<string> {
  try {
    if (!env.AI) {
      return `I'm currently unable to answer questions about this document. The AI service is temporarily unavailable. Please try again later or contact support if the issue persists.`;
    }

    // Build chat context
    const historyContext = chatHistory
      .slice(-3) // Last 3 Q&A pairs for context
      .map(h => `Q: ${h.question}\nA: ${h.answer}`)
      .join('\n\n');

    const prompt = `You are an AI assistant for Ghana's Office of the Head of Civil Service (OHCS) e-Library. Answer questions about documents accurately and helpfully.

Document: "${title}"

Document Content:
${extractedText.slice(0, 6000)}

${historyContext ? `Previous conversation:\n${historyContext}\n` : ''}

User Question: ${question}

Instructions:
- Answer based on the document content
- If the answer isn't in the document, say so clearly
- Keep answers concise but informative
- Be professional and helpful

Answer:`;

    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt,
      max_tokens: 500,
      temperature: 0.4,
    });

    return response?.response?.trim() ||
      `I apologize, but I couldn't generate an answer to your question. Please try rephrasing or ask a different question about this document.`;
  } catch (error) {
    console.error('Q&A failed:', error);
    return `I encountered an error while processing your question. Please try again later.`;
  }
}

/**
 * Get or create cached analysis for a document
 */
export async function getCachedAnalysis(
  env: Env,
  documentId: string
): Promise<DocumentAnalysis | null> {
  try {
    const cached = await env.DB.prepare(`
      SELECT * FROM document_ai_analysis WHERE documentId = ?
    `).bind(documentId).first();

    if (cached) {
      return {
        summary: cached.summary as string,
        keyPoints: JSON.parse((cached.keyPoints as string) || '[]'),
        topics: JSON.parse((cached.topics as string) || '[]'),
        complexity: (cached.complexity as 'basic' | 'intermediate' | 'advanced') || 'intermediate',
        readingTime: (cached.readingTime as number) || 5,
        recommendations: JSON.parse((cached.recommendations as string) || '[]'),
        sentiment: (cached.sentiment as 'positive' | 'neutral' | 'negative' | 'informative') || 'informative',
        wordCount: (cached.wordCount as number) || 0,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching cached analysis:', error);
    return null;
  }
}

/**
 * Cache analysis results
 */
export async function cacheAnalysis(
  env: Env,
  documentId: string,
  analysis: DocumentAnalysis,
  extractedText: string
): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT INTO document_ai_analysis (
        id, documentId, summary, keyPoints, topics, complexity,
        readingTime, recommendations, extractedText, sentiment,
        wordCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(documentId) DO UPDATE SET
        summary = ?, keyPoints = ?, topics = ?, complexity = ?,
        readingTime = ?, recommendations = ?, extractedText = ?,
        sentiment = ?, wordCount = ?, updatedAt = datetime('now')
    `).bind(
      crypto.randomUUID(),
      documentId,
      analysis.summary,
      JSON.stringify(analysis.keyPoints),
      JSON.stringify(analysis.topics),
      analysis.complexity,
      analysis.readingTime,
      JSON.stringify(analysis.recommendations),
      extractedText.slice(0, 50000),
      analysis.sentiment,
      analysis.wordCount,
      // Update values
      analysis.summary,
      JSON.stringify(analysis.keyPoints),
      JSON.stringify(analysis.topics),
      analysis.complexity,
      analysis.readingTime,
      JSON.stringify(analysis.recommendations),
      extractedText.slice(0, 50000),
      analysis.sentiment,
      analysis.wordCount
    ).run();
  } catch (error) {
    console.error('Error caching analysis:', error);
  }
}

/**
 * Get cached extracted text
 */
export async function getCachedText(
  env: Env,
  documentId: string
): Promise<string | null> {
  try {
    const cached = await env.DB.prepare(`
      SELECT extractedText FROM document_ai_analysis WHERE documentId = ?
    `).bind(documentId).first<{ extractedText: string }>();

    return cached?.extractedText || null;
  } catch {
    return null;
  }
}

/**
 * Save chat message
 */
export async function saveChatMessage(
  env: Env,
  documentId: string,
  userId: string,
  question: string,
  answer: string
): Promise<string> {
  const id = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO document_chat_history (id, documentId, userId, question, answer, createdAt)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).bind(id, documentId, userId, question, answer).run();

  return id;
}

/**
 * Get chat history for a document
 */
export async function getChatHistory(
  env: Env,
  documentId: string,
  userId: string,
  limit: number = 20
): Promise<ChatMessage[]> {
  const { results } = await env.DB.prepare(`
    SELECT id, question, answer, createdAt
    FROM document_chat_history
    WHERE documentId = ? AND userId = ?
    ORDER BY createdAt DESC
    LIMIT ?
  `).bind(documentId, userId, limit).all();

  return (results || []).map((r: any) => ({
    id: r.id,
    question: r.question,
    answer: r.answer,
    createdAt: r.createdAt,
  })).reverse(); // Return in chronological order
}

// Helper functions

function parseListResponse(response: string): string[] {
  return response
    .split('\n')
    .map(line => line.replace(/^[\d\.\-\*\•]+\s*/, '').trim())
    .filter(line => line.length > 10 && line.length < 300);
}

function parseCommaSeparated(response: string): string[] {
  return response
    .split(/[,\n]/)
    .map(item => item.replace(/^[\d\.\-\*\•]+\s*/, '').trim())
    .filter(item => item.length > 1 && item.length < 50);
}

function determineComplexity(text: string, wordCount: number): 'basic' | 'intermediate' | 'advanced' {
  // Check for complex vocabulary and sentence structure
  const complexWords = [
    'jurisprudence', 'promulgate', 'adjudicate', 'remuneration',
    'emolument', 'statutory', 'regulatory', 'constitutional',
    'administrative', 'implementation', 'procedural', 'governance'
  ];

  const textLower = text.toLowerCase();
  const complexWordCount = complexWords.filter(w => textLower.includes(w)).length;

  const avgSentenceLength = text.split(/[.!?]+/).length > 0
    ? wordCount / text.split(/[.!?]+/).length
    : 15;

  if (complexWordCount > 5 || avgSentenceLength > 25 || wordCount > 5000) {
    return 'advanced';
  } else if (complexWordCount > 2 || avgSentenceLength > 18 || wordCount > 2000) {
    return 'intermediate';
  }
  return 'basic';
}

function determineSentiment(text: string): 'positive' | 'neutral' | 'negative' | 'informative' {
  const textLower = text.toLowerCase();

  const positiveWords = ['success', 'achievement', 'improvement', 'growth', 'opportunity', 'benefit', 'award'];
  const negativeWords = ['failure', 'decline', 'problem', 'issue', 'concern', 'warning', 'penalty'];
  const informativeWords = ['guidelines', 'procedure', 'policy', 'regulation', 'requirement', 'standard'];

  const positiveCount = positiveWords.filter(w => textLower.includes(w)).length;
  const negativeCount = negativeWords.filter(w => textLower.includes(w)).length;
  const informativeCount = informativeWords.filter(w => textLower.includes(w)).length;

  if (informativeCount > positiveCount && informativeCount > negativeCount) {
    return 'informative';
  } else if (positiveCount > negativeCount + 2) {
    return 'positive';
  } else if (negativeCount > positiveCount + 2) {
    return 'negative';
  }
  return 'neutral';
}

function generateRecommendations(category: string, topics: string[]): string[] {
  const categoryRecommendations: Record<string, string[]> = {
    circulars: ['Related Circulars', 'Implementation Guidelines', 'Policy Updates'],
    policies: ['Policy Framework', 'Compliance Guidelines', 'Standard Operating Procedures'],
    training: ['Training Manuals', 'Certification Guides', 'Workshop Materials'],
    reports: ['Annual Reports', 'Performance Metrics', 'Research Publications'],
    forms: ['Form Instructions', 'Submission Guidelines', 'Template Updates'],
    legal: ['Legal Framework', 'Regulatory Compliance', 'Court Rulings'],
    research: ['Academic Papers', 'Case Studies', 'Best Practices'],
    general: ['General Guidelines', 'Reference Materials', 'Resource Documents'],
  };

  return categoryRecommendations[category] || categoryRecommendations.general;
}

function generateFallbackKeyPoints(category: string, title: string): string[] {
  const basePoints = [
    `This document provides official guidance from Ghana's civil service`,
    `Contains important information for public sector employees`,
    `Relevant to ${category} matters within MDAs`,
    `Should be reviewed for compliance and implementation`,
    `Part of the OHCS official documentation library`,
  ];
  return basePoints;
}

function generateFallbackAnalysis(title: string, description: string, category: string): DocumentAnalysis {
  return {
    summary: description || `This ${category} document titled "${title}" contains important information for Ghana's civil service. It provides guidance and resources relevant to public sector operations and governance.`,
    keyPoints: generateFallbackKeyPoints(category, title),
    topics: [category, 'Civil Service', 'Ghana Government', 'Public Administration'],
    complexity: 'intermediate',
    readingTime: 10,
    recommendations: generateRecommendations(category, []),
    sentiment: 'informative',
    wordCount: 0,
  };
}
