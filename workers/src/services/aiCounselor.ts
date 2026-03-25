/**
 * AI Counselor "Dr. Sena" Service
 * Provides AI-powered wellness counseling for Ghana's civil servants
 */

import { AI_DEFAULTS } from '../config/aiModels';

interface Env {
  DB: D1Database;
  AI: any;
}

export interface CounselorMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  helpful?: boolean | null;
  createdAt: string;
}

export interface SessionContext {
  topic?: string;
  mood?: number;
  isAnonymous: boolean;
  userName?: string;
}

export interface EscalationAnalysis {
  shouldEscalate: boolean;
  urgency: 'low' | 'normal' | 'high' | 'crisis';
  reason: string;
}

// Crisis keywords that should trigger immediate escalation
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
  'hurt myself', 'self-harm', 'cutting myself', 'overdose',
  'no reason to live', 'can\'t go on', 'hopeless', 'give up on life'
];

// High-urgency keywords that need human attention
const HIGH_URGENCY_KEYWORDS = [
  'severe depression', 'can\'t function', 'panic attack', 'breakdown',
  'abuse', 'violence', 'harassment', 'assault', 'threatened',
  'addiction', 'substance abuse', 'alcoholism'
];

/**
 * Get AI counselor response for user message
 */
export async function getCounselorResponse(
  env: Env,
  sessionId: string,
  userMessage: string,
  conversationHistory: CounselorMessage[],
  context: SessionContext
): Promise<string> {
  try {
    // Check for crisis keywords first
    const escalation = analyzeForEscalationSync(userMessage, conversationHistory);
    if (escalation.shouldEscalate && escalation.urgency === 'crisis') {
      return getCrisisResponse();
    }

    if (!env.AI) {
      console.log('AI binding not available, using fallback response');
      return getFallbackResponse(context.topic);
    }

    // Build conversation context
    const historyContext = conversationHistory
      .slice(-8) // Last 8 messages for context
      .map(m => `${m.role === 'user' ? 'User' : 'Dr. Sena'}: ${m.content}`)
      .join('\n');

    const topicContext = getTopicContext(context.topic);
    const moodContext = getMoodContext(context.mood);
    const greeting = context.isAnonymous ? 'friend' : (context.userName || 'friend');

    // Check if this is the first message (no history)
    const isFirstMessage = conversationHistory.length === 0;

    const systemPrompt = `You are Dr. Sena - an AI wellness companion at Ghana's OHCS. You are named in honor of the respected leader of the Counselor Unit, but you are an AI assistant, NOT the actual person.

WHO YOU ARE:
You're an AI wellness companion - friendly, warm, and genuinely caring. You chat naturally and supportively, while being transparent that you're an AI. You're like a supportive friend who happens to be powered by AI.

CRITICAL - ALWAYS BE TRANSPARENT:
- You are an AI assistant, NOT a human counselor
- You are named "Dr. Sena" in honor of the Counselor Unit leader, but you are NOT that person
- If asked directly, always confirm you are an AI
- For serious issues, remind users that human CSEAP counselors are available

${isFirstMessage ? `IMPORTANT - FIRST MESSAGE:
This is the start of a new conversation. In your response:
1. Warmly greet them and introduce yourself as Dr. Sena, the AI wellness companion
2. Briefly mention you're an AI here to provide supportive conversation
3. Ask for their name so you can address them personally
4. Then gently ask what's on their mind
Keep it natural and welcoming, not overly formal.` : ''}

CONVERSATION STYLE:
- Talk like you're having a real conversation with a friend
- If you know their name, use it naturally (not in every sentence, just occasionally)
- Vary how you respond - don't always start the same way
- Keep responses short and natural - 1-3 paragraphs max
- Ask ONE thoughtful question at a time
- Acknowledge what they said before going deeper
- Match their tone - casual if they're casual, thoughtful if they're serious
- Be genuine, relatable, and supportive

WHAT NOT TO DO:
- Don't pretend to be a human or the actual Dr. Sena
- Don't sound scripted or robotic
- Don't overuse phrases like "I understand" or "That must be difficult"
- Don't give unsolicited advice - listen first, then offer if asked
- Don't be fake-positive or dismiss real struggles
- Don't use bullet points or lists
- Never diagnose or prescribe anything

IMPORTANT:
- For crisis situations (self-harm, suicide), immediately provide crisis resources
- For serious issues, gently suggest speaking with a human CSEAP counselor
- Always be honest about being an AI when asked

${topicContext}
${moodContext}`;

    const fullPrompt = `${systemPrompt}

${historyContext ? `Previous messages:\n${historyContext}\n` : ''}

They just said: "${userMessage}"

Reply naturally as Dr. Sena:`;

    let response;
    try {
      response = await env.AI.run(AI_DEFAULTS.counselor.model, {
        prompt: fullPrompt,
        max_tokens: AI_DEFAULTS.counselor.response.max_tokens,
        temperature: AI_DEFAULTS.counselor.response.temperature,
      });
      console.log('Dr. Sena AI Response received:', JSON.stringify(response).slice(0, 200));
    } catch (aiError: any) {
      console.error('AI counselor run error:', aiError?.message || aiError);
      return getFallbackResponse(context.topic);
    }

    let aiResponse = response?.response?.trim();

    if (!aiResponse) {
      return getFallbackResponse(context.topic);
    }

    // Clean up response
    aiResponse = aiResponse
      .replace(/^(Dr\.?\s*Sena:|Ayo:|Assistant:|AI:)\s*/i, '')
      .trim();

    // Add escalation suggestion if high urgency detected
    if (escalation.shouldEscalate && escalation.urgency === 'high') {
      aiResponse += '\n\n💙 I want you to know that what you\'re going through sounds really challenging. While I\'m here to support you, speaking with one of our trained human counselors could provide more specialized help. Would you like me to connect you with someone from the counseling unit?';
    }

    return aiResponse;
  } catch (error) {
    console.error('AI counselor error:', error);
    return getFallbackResponse(context.topic);
  }
}

/**
 * Analyze message for escalation need (synchronous version for quick checks)
 */
function analyzeForEscalationSync(
  message: string,
  conversationHistory: CounselorMessage[]
): EscalationAnalysis {
  const messageLower = message.toLowerCase();
  const historyText = conversationHistory.map(m => m.content.toLowerCase()).join(' ');
  const allText = messageLower + ' ' + historyText;

  // Check for crisis keywords
  for (const keyword of CRISIS_KEYWORDS) {
    if (messageLower.includes(keyword)) {
      return {
        shouldEscalate: true,
        urgency: 'crisis',
        reason: `Crisis keyword detected: "${keyword}"`
      };
    }
  }

  // Check for high urgency keywords
  for (const keyword of HIGH_URGENCY_KEYWORDS) {
    if (messageLower.includes(keyword)) {
      return {
        shouldEscalate: true,
        urgency: 'high',
        reason: `High urgency topic detected: "${keyword}"`
      };
    }
  }

  // Check for repeated distress indicators
  const distressIndicators = ['stressed', 'anxious', 'depressed', 'overwhelmed', 'can\'t cope'];
  const distressCount = distressIndicators.filter(d => allText.includes(d)).length;

  if (distressCount >= 3) {
    return {
      shouldEscalate: true,
      urgency: 'normal',
      reason: 'Multiple distress indicators detected across conversation'
    };
  }

  return {
    shouldEscalate: false,
    urgency: 'low',
    reason: ''
  };
}

/**
 * Analyze message for escalation using AI (more nuanced analysis)
 */
export async function analyzeForEscalation(
  env: Env,
  message: string,
  conversationHistory: CounselorMessage[]
): Promise<EscalationAnalysis> {
  // First do quick sync check
  const quickCheck = analyzeForEscalationSync(message, conversationHistory);
  if (quickCheck.shouldEscalate) {
    return quickCheck;
  }

  // For borderline cases, use AI analysis
  if (!env.AI) {
    return quickCheck;
  }

  try {
    const historyContext = conversationHistory
      .slice(-5)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `You are analyzing a wellness counseling conversation for escalation needs.

CONVERSATION:
${historyContext}
User: ${message}

Analyze if this person needs to be connected with a human counselor.

ESCALATE if:
- Signs of self-harm, suicide ideation, or crisis
- Abuse, violence, or harassment mentions
- Severe mental health symptoms
- Addiction or substance abuse issues
- Complex issues beyond AI counseling scope

DO NOT ESCALATE for:
- Normal work stress
- General life advice seeking
- Mild anxiety or frustration
- Career guidance questions

Respond in exactly this format:
ESCALATE: [YES/NO]
URGENCY: [low/normal/high/crisis]
REASON: [brief reason or "none"]`;

    const response = await env.AI.run(AI_DEFAULTS.counselor.model, {
      prompt,
      max_tokens: AI_DEFAULTS.counselor.escalation.max_tokens,
      temperature: AI_DEFAULTS.counselor.escalation.temperature,
    });

    const text = response?.response || '';
    const escalateMatch = text.match(/ESCALATE:\s*(YES|NO)/i);
    const urgencyMatch = text.match(/URGENCY:\s*(low|normal|high|crisis)/i);
    const reasonMatch = text.match(/REASON:\s*(.+)/i);

    return {
      shouldEscalate: escalateMatch?.[1]?.toUpperCase() === 'YES',
      urgency: (urgencyMatch?.[1]?.toLowerCase() as EscalationAnalysis['urgency']) || 'low',
      reason: reasonMatch?.[1]?.trim() || ''
    };
  } catch (error) {
    console.error('Escalation analysis error:', error);
    return quickCheck;
  }
}

/**
 * Generate a summary of a counseling session
 */
export async function generateSessionSummary(
  env: Env,
  messages: CounselorMessage[]
): Promise<string> {
  if (!env.AI || messages.length < 2) {
    return generateFallbackSummary(messages);
  }

  try {
    const conversation = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Dr. Sena'}: ${m.content}`)
      .join('\n');

    const prompt = `Summarize this wellness counseling session in 2-3 sentences. Focus on:
1. Main topics discussed
2. Key concerns raised
3. Any coping strategies suggested

CONVERSATION:
${conversation}

SUMMARY:`;

    const response = await env.AI.run(AI_DEFAULTS.counselor.model, {
      prompt,
      max_tokens: AI_DEFAULTS.counselor.summary.max_tokens,
      temperature: AI_DEFAULTS.counselor.summary.temperature,
    });

    return response?.response?.trim() || generateFallbackSummary(messages);
  } catch (error) {
    console.error('Session summary error:', error);
    return generateFallbackSummary(messages);
  }
}

/**
 * Generate suggested follow-up questions
 */
export async function generateFollowUpSuggestions(
  env: Env,
  topic: string,
  lastUserMessage: string
): Promise<string[]> {
  const defaultSuggestions: Record<string, string[]> = {
    work_stress: [
      "What helps you unwind after a stressful day?",
      "How does this affect your work performance?",
      "Have you talked to your supervisor about this?"
    ],
    career: [
      "What are your career goals for the next 2-3 years?",
      "What skills would you like to develop?",
      "What's holding you back from taking the next step?"
    ],
    relationships: [
      "How long has this been bothering you?",
      "Have you tried discussing this with them directly?",
      "What would an ideal resolution look like?"
    ],
    personal: [
      "How are you taking care of yourself right now?",
      "What brings you joy outside of work?",
      "Who in your life provides good support?"
    ],
    financial: [
      "What's your biggest financial concern right now?",
      "Have you considered making a budget?",
      "What financial goal would bring you peace of mind?"
    ],
    general: [
      "What would make today a good day for you?",
      "What's one small step you could take right now?",
      "How can I best support you today?"
    ]
  };

  return defaultSuggestions[topic] || defaultSuggestions.general;
}

// Helper functions

function getCrisisResponse(): string {
  return `I hear you, and I want you to know that your life matters. What you're feeling right now is serious, and you deserve immediate support from trained professionals.

🆘 **Please reach out now:**
- **Ghana National Crisis Line:** Call 112 (Emergency)
- **Mental Health Authority Ghana:** 0800 800 800 (Toll-free)
- **Befrienders (Accra):** +233 24 444 2266

If you're in immediate danger, please call 112 or go to your nearest hospital emergency room.

💙 You're not alone in this. The OHCS counseling unit is also here for you. Would you like me to connect you with a human counselor right away?

I'm still here to listen if you want to talk, but please also reach out to one of these crisis resources.`;
}

function getFallbackResponse(topic?: string): string {
  const responses: Record<string, string[]> = {
    work_stress: [
      "Hey there! I'm Dr. Sena, your AI wellness companion. Work stress can really take a toll. Before we dive in, what's your name? And tell me what's been on your mind.",
      "Hi, I'm Dr. Sena - an AI here to chat and support you. Work stuff can get heavy sometimes. I'd love to know your name, and then you can tell me what's going on.",
      "Hello! I'm Dr. Sena, your AI wellness companion. What should I call you? And what's been weighing on you at work?"
    ],
    career: [
      "Hey! I'm Dr. Sena, your AI wellness companion. Career decisions can be tricky to navigate. What's your name? I'd love to hear what's on your mind.",
      "Hi there, I'm Dr. Sena - an AI here to support you. Before we chat about your career, what should I call you?",
      "Hello! I'm Dr. Sena, your AI wellness companion. What's your name? And tell me what's going on with your career."
    ],
    relationships: [
      "Hey, I'm Dr. Sena, your AI wellness companion. Relationships can be complicated. What's your name? I'm here to listen.",
      "Hi! I'm Dr. Sena - an AI here to support you, and I'm glad you're here. What should I call you? Tell me what's happening.",
      "Hello! I'm Dr. Sena, your AI wellness companion. Before we talk, what's your name? And what's been going on?"
    ],
    personal: [
      "Hey, I'm Dr. Sena, your AI wellness companion. Thanks for being here. What's your name? I'd like to know who I'm talking with.",
      "Hi there, I'm Dr. Sena - an AI here to listen and support you. What should I call you? Take your time and share what's on your heart.",
      "Hello! I'm Dr. Sena, your AI wellness companion. What's your name? I'm here to listen, no judgment."
    ],
    financial: [
      "Hey! I'm Dr. Sena, your AI wellness companion. Money stuff can be stressful. What's your name? Tell me what's on your mind.",
      "Hi, I'm Dr. Sena - an AI here to support you. Before we talk about finances, what should I call you?",
      "Hello! I'm Dr. Sena, your AI wellness companion. What's your name? And what's been worrying you about money?"
    ],
    general: [
      "Hey there! I'm Dr. Sena, your AI wellness companion, and I'm glad you're here. What's your name? I'd love to know who I'm chatting with.",
      "Hi! I'm Dr. Sena - an AI here to listen and support you. What should I call you? And what brings you here today?",
      "Hello! I'm Dr. Sena, your AI wellness companion. What's your name? Tell me what's on your mind."
    ]
  };

  const options = responses[topic || 'general'] || responses.general;
  return options[Math.floor(Math.random() * options.length)];
}

function getTopicContext(topic?: string): string {
  const contexts: Record<string, string> = {
    work_stress: 'They want to talk about work stress - could be deadlines, bosses, coworkers, workload, anything job-related.',
    career: 'They want to chat about their career - maybe promotions, feeling stuck, new opportunities, or figuring out their path.',
    relationships: 'They have something going on with people in their life - could be colleagues, family, friends, romantic partner.',
    personal: 'This is personal stuff - could be anything affecting their wellbeing. Be extra gentle.',
    financial: 'Money is on their mind - could be debts, saving, budgeting, financial worries.',
    general: 'They just want to talk - be open to wherever the conversation goes.'
  };

  return topic ? `Context: ${contexts[topic] || contexts.general}\n` : '';
}

function getMoodContext(mood?: number): string {
  if (!mood) return '';

  const moodDescriptions: Record<number, string> = {
    1: 'They said they\'re feeling really low right now. Be extra gentle.',
    2: 'They\'re not doing great today. Acknowledge that.',
    3: 'They\'re feeling okay/neutral. Just be present.',
    4: 'They\'re in a decent mood. Keep it light.',
    5: 'They\'re feeling good! Match that energy.'
  };

  return `Mood note: ${moodDescriptions[mood] || ''}\n`;
}

function generateFallbackSummary(messages: CounselorMessage[]): string {
  const messageCount = messages.length;
  const userMessages = messages.filter(m => m.role === 'user');

  if (messageCount === 0) {
    return 'No messages in this session.';
  }

  const firstUserMessage = userMessages[0]?.content.slice(0, 100) || '';
  return `Session with ${messageCount} messages. Initial topic: "${firstUserMessage}..."`;
}

/**
 * Generate personalized wellness tips based on user's history
 */
export async function getPersonalizedTips(
  env: Env,
  userId: string
): Promise<string[]> {
  // Get user's mood patterns
  const { results: moodHistory } = await env.DB.prepare(`
    SELECT mood, factors FROM mood_entries
    WHERE userId = ?
    ORDER BY createdAt DESC
    LIMIT 10
  `).bind(userId).all();

  // Get recent session topics
  const { results: sessions } = await env.DB.prepare(`
    SELECT topic FROM counselor_sessions
    WHERE userId = ?
    ORDER BY createdAt DESC
    LIMIT 5
  `).bind(userId).all();

  // Determine common factors and topics
  const allFactors: string[] = [];
  for (const entry of moodHistory || []) {
    try {
      const factors = JSON.parse((entry as any).factors || '[]');
      allFactors.push(...factors);
    } catch {}
  }

  const topics = (sessions || []).map((s: any) => s.topic).filter(Boolean);

  // Generate relevant tips
  const tips: string[] = [];

  if (allFactors.includes('work') || topics.includes('work_stress')) {
    tips.push('Try the 4-7-8 breathing technique when work feels overwhelming');
    tips.push('Schedule short breaks every 90 minutes to maintain focus');
  }

  if (allFactors.includes('sleep')) {
    tips.push('Dim lights 1 hour before bed to improve sleep quality');
    tips.push('Keep a consistent sleep schedule, even on weekends');
  }

  if (allFactors.includes('family') || topics.includes('relationships')) {
    tips.push('Practice active listening: reflect back what you hear before responding');
    tips.push('Set aside dedicated quality time with loved ones');
  }

  if (topics.includes('career')) {
    tips.push('Write down 3 accomplishments at the end of each week');
    tips.push('Identify one skill to develop this month');
  }

  // Default tips
  if (tips.length < 3) {
    tips.push('Take 5 minutes today just to breathe and be present');
    tips.push('Drink enough water - it affects your mood more than you think');
    tips.push('Reach out to someone you haven\'t talked to in a while');
  }

  return tips.slice(0, 5);
}
