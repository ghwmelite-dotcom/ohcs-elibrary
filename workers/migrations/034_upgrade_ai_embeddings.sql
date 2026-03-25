-- Migration: Upgrade AI embedding model from bge-base-en-v1.5 (768-dim) to bge-m3 (1024-dim)
-- This clears existing embeddings and re-queues all documents for re-embedding with the new model.
-- The cron job will automatically re-process the queue with the new embedding model.

-- Clear old 768-dim embeddings (incompatible with new 1024-dim model)
UPDATE document_chunks SET embedding = NULL;

-- embedding column now stores JSON array of 1024 floats (bge-m3, multilingual)

-- Reset embedding queue: re-queue all documents that have chunks for re-embedding
INSERT OR REPLACE INTO embedding_queue (id, documentId, status, priority, attempts, createdAt)
SELECT
  lower(hex(randomblob(16))),
  dc.documentId,
  'pending',
  1,
  0,
  datetime('now')
FROM document_chunks dc
GROUP BY dc.documentId;
