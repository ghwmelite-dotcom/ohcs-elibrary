/**
 * AI Response Sanitizer
 *
 * QWQ-32B is a reasoning model that emits chain-of-thought reasoning before
 * (and sometimes around) the final answer. This helper strips reasoning so
 * only the user-facing reply is returned.
 *
 * Strategy (in priority order):
 * 1. Extract content of `<reply>...</reply>` tags if the prompt requested
 *    structured output and the model complied — this is the most reliable
 *    delimiter.
 * 2. Strip `<think>...</think>` / `<thinking>...</thinking>` blocks.
 * 3. Take content after a structured `Reply:` / `Response:` / `Answer:` marker.
 * 4. Take content after a "let me draft the response" / "put it together"
 *    transition phrase.
 * 5. Strip trailing meta-analysis sections that follow the actual reply.
 */

export function stripModelReasoning(text: string): string {
  if (!text) return '';

  // 1. STRONGEST: extract <reply>...</reply> content if present.
  //    The Kaya / GUIDE prompts now instruct the model to wrap its final
  //    user-facing answer in <reply> tags. If we find them, take ONLY the
  //    content inside (last occurrence wins, in case the model emits the
  //    tags multiple times during reasoning iterations).
  const replyTagMatches = [...text.matchAll(/<reply\b[^>]*>([\s\S]*?)<\/reply>/gi)];
  if (replyTagMatches.length > 0) {
    return replyTagMatches[replyTagMatches.length - 1][1].trim();
  }

  // 2. Strip <think>...</think> blocks (reasoning-tag fallback).
  let t = text
    .replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, '')
    .trim();

  // 3. Structured "Reply:" / "Response:" / "Answer:" marker — take content
  //    after the LAST one.
  const replyMarkers = [
    /(?:^|\n)\s*(?:reply|response|answer|final\s+(?:reply|response|answer))\s*:\s*\n+/gi,
  ];
  for (const marker of replyMarkers) {
    const matches = [...t.matchAll(marker)];
    if (matches.length > 0) {
      const last = matches[matches.length - 1];
      t = t.slice(last.index! + last[0].length).trim();
      break;
    }
  }

  // 4. Untagged reasoning ending with a transition phrase. Take content
  //    after the LAST.
  const draftMarkers = [
    /(?:alright,?\s+)?(?:let me|let's|time to|okay,?\s+(?:let me|let's))\s*(?:put (?:that |it |everything |all (?:of )?(?:that|it|this) )?(?:all\s+)?together|draft (?:the |my |a |our )?(?:final )?response|write (?:out |up )?(?:the |my |a |our )?(?:final )?(?:response|answer|reply))[^\n]*\n+/gi,
    /(?:^|\n)\s*here'?s?\s+(?:my|a|the)?\s*(?:final\s+)?(?:response|answer|reply)[\s:]*\n+/gi,
  ];
  for (const marker of draftMarkers) {
    const matches = [...t.matchAll(marker)];
    if (matches.length > 0) {
      const last = matches[matches.length - 1];
      t = t.slice(last.index! + last[0].length).trim();
      break;
    }
  }

  // 5. Trailing meta-analysis: cut from a horizontal-rule separator onwards.
  t = t.replace(/\n+\s*-{3,}\s*\n[\s\S]*$/, '').trim();

  // Strip trailing meta sections without a separator that start with a
  // recognized meta-heading.
  const trailingHeadings = [
    'why this works',
    'this approach',
    'this maintains',
    'step.?by.?step\\s+explanation',
    'step.?by.?step\\s+breakdown',
    'analysis',
    'explanation',
    'rationale',
    'breakdown',
    'final note',
    'note(?:s)?\\s+to\\s+(?:self|user)',
    'how\\s+does\\s+(?:that|this)\\s+feel',
    'p\\.s\\.',
    'let me know whenever',
  ];
  const trailingPattern = new RegExp(
    `\\n{2,}\\s*(?:${trailingHeadings.join('|')})[^\\n]*[:.]?\\s*\\n[\\s\\S]*$`,
    'gi',
  );
  t = t.replace(trailingPattern, '').trim();

  // 6. Final cleanup: collapse 3+ consecutive newlines to 2.
  t = t.replace(/\n{3,}/g, '\n\n').trim();

  return t;
}
