/**
 * Centralized AI Model Configuration
 *
 * Tiered model strategy to balance quality vs neuron cost on Cloudflare Workers AI free tier.
 * - HEAVY: Best reasoning, used for complex tasks (research, counseling, RAG Q&A)
 * - LIGHT: Efficient MoE, used for simple tasks (summaries, topic extraction, news)
 * - EMBEDDING: Multilingual embeddings for RAG semantic search
 */

export const AI_MODELS = {
  /** High-capability reasoning model for complex tasks */
  HEAVY: '@cf/qwen/qwq-32b' as const,
  /** Efficient model for simple generation tasks */
  LIGHT: '@cf/meta/llama-4-scout-17b-16e-instruct' as const,
  /** Multilingual embedding model (1024-dim, 100+ languages) */
  EMBEDDING: '@cf/baai/bge-m3' as const,
} as const;

/** Embedding vector dimension for bge-m3 */
export const EMBEDDING_DIMENSION = 1024;

/** Previous embedding dimension (bge-base-en-v1.5) — used for migration detection */
export const LEGACY_EMBEDDING_DIMENSION = 768;

/** Default generation parameters by use case */
export const AI_DEFAULTS = {
  /** Document summary, key points, topic extraction */
  documentAnalysis: {
    model: AI_MODELS.LIGHT,
    summary: { max_tokens: 400, temperature: 0.3 },
    keyPoints: { max_tokens: 500, temperature: 0.3 },
    topics: { max_tokens: 150, temperature: 0.2 },
  },
  /** Document Q&A (needs reasoning) */
  documentChat: {
    model: AI_MODELS.HEAVY,
    max_tokens: 700,
    temperature: 0.4,
  },
  /** Ozzy knowledge assistant (RAG) */
  ozzy: {
    model: AI_MODELS.HEAVY,
    max_tokens: 900,
    temperature: 0.7,
  },
  /** Kaya wellness counselor */
  counselor: {
    model: AI_MODELS.HEAVY,
    response: { max_tokens: 500, temperature: 0.85 },
    escalation: { max_tokens: 200, temperature: 0.2 },
    summary: { max_tokens: 200, temperature: 0.3 },
  },
  /** News article summarization */
  news: {
    model: AI_MODELS.LIGHT,
    max_tokens: 300,
    temperature: 0.3,
  },
  /** Research lab AI assistance */
  research: {
    model: AI_MODELS.HEAVY,
    max_tokens: 1000,
    temperature: 0.5,
  },
  /** Research advanced AI analysis */
  researchAnalysis: {
    model: AI_MODELS.HEAVY,
    max_tokens: 1200,
    temperature: 0.4,
  },
} as const;
