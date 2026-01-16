/**
 * Document AI Analysis Service
 * Provides AI-powered document analysis, summarization, and Q&A
 */

// Using native APIs for decompression in Workers environment

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
 * Simple ZIP file parser for Workers environment
 * Extracts files from ZIP archives without external dependencies
 */
async function parseZipFile(data: Uint8Array): Promise<Map<string, Uint8Array>> {
  const files = new Map<string, Uint8Array>();

  // Verify ZIP signature
  if (data[0] !== 0x50 || data[1] !== 0x4B) {
    return files;
  }

  let offset = 0;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  while (offset < data.length - 30) {
    // Look for local file header signature (PK\x03\x04)
    if (data[offset] !== 0x50 || data[offset + 1] !== 0x4B ||
        data[offset + 2] !== 0x03 || data[offset + 3] !== 0x04) {
      // Check for central directory header (PK\x01\x02) - end of file entries
      if (data[offset] === 0x50 && data[offset + 1] === 0x4B &&
          data[offset + 2] === 0x01 && data[offset + 3] === 0x02) {
        break;
      }
      offset++;
      continue;
    }

    try {
      const compressionMethod = view.getUint16(offset + 8, true);
      const compressedSize = view.getUint32(offset + 18, true);
      const uncompressedSize = view.getUint32(offset + 22, true);
      const fileNameLength = view.getUint16(offset + 26, true);
      const extraFieldLength = view.getUint16(offset + 28, true);

      const fileNameStart = offset + 30;
      const fileNameEnd = fileNameStart + fileNameLength;
      const fileName = new TextDecoder().decode(data.slice(fileNameStart, fileNameEnd));

      const dataStart = fileNameEnd + extraFieldLength;
      const dataEnd = dataStart + compressedSize;

      if (dataEnd > data.length) {
        break;
      }

      const fileData = data.slice(dataStart, dataEnd);

      // Handle compression
      if (compressionMethod === 0) {
        // No compression (stored)
        files.set(fileName, fileData);
      } else if (compressionMethod === 8) {
        // DEFLATE compression - use DecompressionStream
        try {
          const decompressed = await decompressDeflate(fileData);
          files.set(fileName, decompressed);
        } catch (e) {
          // If decompression fails, store raw data
          console.log('Decompression failed for:', fileName);
        }
      }

      offset = dataEnd;
    } catch (e) {
      offset++;
    }
  }

  return files;
}

/**
 * Decompress DEFLATE data using native DecompressionStream
 */
async function decompressDeflate(data: Uint8Array): Promise<Uint8Array> {
  // DEFLATE in ZIP is raw deflate, we need to use deflate-raw
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(data);
  writer.close();

  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // Combine chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Extract text from DOCX files (Office Open XML format)
 */
async function extractTextFromDocx(zipData: Uint8Array): Promise<string> {
  try {
    const files = await parseZipFile(zipData);
    console.log('Parsed ZIP files:', Array.from(files.keys()).slice(0, 5));

    // DOCX stores main content in word/document.xml
    const documentXml = files.get('word/document.xml');
    if (!documentXml) {
      console.log('word/document.xml not found');
      return '';
    }

    const xmlContent = new TextDecoder().decode(documentXml);
    console.log('XML content length:', xmlContent.length);

    // Extract text from <w:t> tags (Word text elements)
    const textMatches = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    if (!textMatches) {
      console.log('No w:t tags found');
      return '';
    }

    const text = textMatches
      .map(match => match.replace(/<[^>]+>/g, ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('Extracted DOCX text length:', text.length);
    return text;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return '';
  }
}

/**
 * Extract text from PPTX files (PowerPoint Open XML format)
 */
async function extractTextFromPptx(zipData: Uint8Array): Promise<string> {
  try {
    const files = await parseZipFile(zipData);
    console.log('Parsed PPTX files:', Array.from(files.keys()).filter(k => k.includes('slide')).slice(0, 5));

    const textParts: string[] = [];

    // PPTX stores slide content in ppt/slides/slide*.xml
    for (const [path, data] of files) {
      if (path.startsWith('ppt/slides/slide') && path.endsWith('.xml')) {
        const xmlContent = new TextDecoder().decode(data);

        // Extract text from <a:t> tags (PowerPoint text elements)
        const textMatches = xmlContent.match(/<a:t>([^<]*)<\/a:t>/g);
        if (textMatches) {
          const slideText = textMatches
            .map(match => match.replace(/<[^>]+>/g, ''))
            .join(' ');
          textParts.push(slideText);
        }
      }
    }

    const text = textParts.join('\n\n').replace(/\s+/g, ' ').trim();
    console.log('Extracted PPTX text length:', text.length);
    return text;
  } catch (error) {
    console.error('PPTX extraction error:', error);
    return '';
  }
}

/**
 * Extract text from XLSX files (Excel Open XML format)
 */
async function extractTextFromXlsx(zipData: Uint8Array): Promise<string> {
  try {
    const files = await parseZipFile(zipData);
    console.log('Parsed XLSX files:', Array.from(files.keys()).slice(0, 5));

    const textParts: string[] = [];

    // XLSX stores shared strings in xl/sharedStrings.xml
    const sharedStringsXml = files.get('xl/sharedStrings.xml');
    if (sharedStringsXml) {
      const xmlContent = new TextDecoder().decode(sharedStringsXml);

      // Extract text from <t> tags
      const textMatches = xmlContent.match(/<t[^>]*>([^<]*)<\/t>/g);
      if (textMatches) {
        const text = textMatches
          .map(match => match.replace(/<[^>]+>/g, ''))
          .filter(t => t.trim().length > 0)
          .join(' ');
        textParts.push(text);
      }
    }

    // Also extract from sheet data if needed
    for (const [path, data] of files) {
      if (path.startsWith('xl/worksheets/sheet') && path.endsWith('.xml')) {
        const xmlContent = new TextDecoder().decode(data);

        // Extract inline strings
        const inlineMatches = xmlContent.match(/<is><t>([^<]*)<\/t><\/is>/g);
        if (inlineMatches) {
          const inlineText = inlineMatches
            .map(match => match.replace(/<[^>]+>/g, ''))
            .join(' ');
          textParts.push(inlineText);
        }
      }
    }

    const text = textParts.join(' ').replace(/\s+/g, ' ').trim();
    console.log('Extracted XLSX text length:', text.length);
    return text;
  } catch (error) {
    console.error('XLSX extraction error:', error);
    return '';
  }
}

/**
 * Extract text from PDF files
 * Note: This is a best-effort extraction as full PDF parsing requires heavy libraries
 */
function extractTextFromPdf(arrayBuffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const content = decoder.decode(bytes);

    const textParts: string[] = [];

    // Method 1: Extract text from PDF text objects (Tj, TJ operators)
    // Look for text in parentheses within BT...ET blocks
    const btEtBlocks = content.match(/BT[\s\S]*?ET/g) || [];
    for (const block of btEtBlocks) {
      // Extract strings from Tj operator: (text) Tj
      const tjMatches = block.match(/\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g) || [];
      for (const match of tjMatches) {
        const text = match.replace(/\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/, '$1')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
        if (text.length > 2 && /[a-zA-Z]/.test(text)) {
          textParts.push(text);
        }
      }

      // Extract strings from TJ operator: [(text1) -100 (text2)] TJ
      const tjArrayMatches = block.match(/\[([^\]]+)\]\s*TJ/g) || [];
      for (const match of tjArrayMatches) {
        const innerMatches = match.match(/\(([^)\\]*(?:\\.[^)\\]*)*)\)/g) || [];
        for (const inner of innerMatches) {
          const text = inner.slice(1, -1)
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')');
          if (text.length > 1 && /[a-zA-Z]/.test(text)) {
            textParts.push(text);
          }
        }
      }
    }

    // Method 2: Extract from ToUnicode CMap if present
    // This handles fonts with Unicode mappings
    const unicodeText = extractUnicodeFromPdf(content);
    if (unicodeText) {
      textParts.push(unicodeText);
    }

    // Clean and combine
    let result = textParts.join(' ')
      .replace(/[^\x20-\x7E\n\r\t\u00A0-\u00FF\u0100-\u017F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Validate that the result is actual readable text, not PDF metadata
    if (result.length > 0) {
      // Check for PDF internal structure patterns (indicates corrupt extraction)
      const pdfMetadataPatterns = [
        /StructTreeRoot\s+\d+\s+\d+\s+R/,
        /ViewerPreferences\s+\d+\s+\d+\s+R/,
        /FontDescriptor\s+\d+\s+\d+\s+R/,
        /DescendantFonts\s+\d+\s+\d+\s+R/,
        /\d+\s+\d+\s+R\s+\d+\s+\d+\s+R\s+\d+\s+\d+\s+R/, // Multiple PDF references
        /CDEFGHIJSTUVWXYZcdefghijstuvwxyz/, // Encoding table
      ];

      const hasPdfMetadata = pdfMetadataPatterns.some(pattern => pattern.test(result));
      if (hasPdfMetadata) {
        console.log('PDF extraction returned metadata instead of text, returning empty');
        return '';
      }

      // Check that result has actual words (at least 5 words with 3+ characters)
      const words = result.match(/\b[a-zA-Z]{3,}\b/g) || [];
      if (words.length < 5) {
        console.log('PDF extraction did not find enough readable words:', words.length);
        return '';
      }
    }

    return result;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}

/**
 * Try to extract Unicode text from PDF ToUnicode CMap
 */
function extractUnicodeFromPdf(content: string): string {
  // Look for readable ASCII text segments
  const readableSegments: string[] = [];

  // Find long sequences of readable ASCII
  const asciiMatches = content.match(/[A-Za-z][A-Za-z0-9\s,.;:'"!?\-()]{20,}/g) || [];
  for (const match of asciiMatches) {
    // Filter out PDF operators and metadata
    if (!match.includes('/') && !match.includes('obj') && !match.includes('stream')) {
      readableSegments.push(match);
    }
  }

  return readableSegments.join(' ');
}

/**
 * Extract text content from a document file
 * Supports DOCX, PPTX, XLSX, PDF, and text files
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
    const bytes = new Uint8Array(arrayBuffer);

    // For text-based files, extract directly
    if (fileType.includes('text') || fileType.includes('json') || fileType.includes('xml')) {
      const text = new TextDecoder().decode(arrayBuffer);
      return cleanExtractedText(text);
    }

    // For DOCX files
    if (fileType.includes('wordprocessingml') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const text = await extractTextFromDocx(bytes);
      if (text.length > 50) {
        return cleanExtractedText(text);
      }
    }

    // For PPTX files
    if (fileType.includes('presentationml') || fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      const text = await extractTextFromPptx(bytes);
      if (text.length > 50) {
        return cleanExtractedText(text);
      }
    }

    // For XLSX files
    if (fileType.includes('spreadsheetml') || fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const text = await extractTextFromXlsx(bytes);
      if (text.length > 50) {
        return cleanExtractedText(text);
      }
    }

    // For PDF files
    if (fileType.includes('pdf')) {
      const text = extractTextFromPdf(arrayBuffer);
      if (text.length > 50) {
        return cleanExtractedText(text);
      }
    }

    // For old DOC format (binary), we can't easily extract
    // Return empty to trigger AI-based description
    return '';
  } catch (error) {
    console.error('Error extracting text:', error);
    return '';
  }
}

/**
 * Clean extracted text by removing excess whitespace and invalid characters
 */
function cleanExtractedText(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove control characters except tab, newline, carriage return
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50000); // Limit to ~50KB
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
