-- AI Counselor "Ayo" - Database Schema
-- Created: December 28, 2025

-- Counselor sessions (supports anonymous)
CREATE TABLE IF NOT EXISTS counselor_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT,  -- NULL for anonymous sessions
  anonymousId TEXT,  -- For anonymous session continuity
  title TEXT,
  topic TEXT,  -- 'work_stress', 'career', 'personal', 'relationships', 'financial', 'general'
  status TEXT DEFAULT 'active',  -- 'active', 'completed', 'escalated'
  messageCount INTEGER DEFAULT 0,
  mood INTEGER,  -- 1-5 scale at session start
  isAnonymous INTEGER DEFAULT 0,
  lastMessageAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- Counselor messages
CREATE TABLE IF NOT EXISTS counselor_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  sessionId TEXT NOT NULL,
  role TEXT NOT NULL,  -- 'user' or 'assistant'
  content TEXT NOT NULL,
  helpful INTEGER,  -- NULL, 0 (not helpful), 1 (helpful)
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (sessionId) REFERENCES counselor_sessions(id) ON DELETE CASCADE
);

-- Mood entries for tracking over time
CREATE TABLE IF NOT EXISTS mood_entries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  mood INTEGER NOT NULL,  -- 1-5 scale
  factors TEXT,  -- JSON array: ['work', 'family', 'health', 'sleep']
  notes TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Wellness resources (articles, videos, exercises)
CREATE TABLE IF NOT EXISTS wellness_resources (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,  -- For articles
  type TEXT NOT NULL,  -- 'article', 'video', 'audio', 'exercise'
  category TEXT NOT NULL,  -- 'stress', 'career', 'relationships', 'mindfulness', 'sleep'
  thumbnailUrl TEXT,
  mediaUrl TEXT,  -- For video/audio
  duration INTEGER,  -- In minutes
  difficulty TEXT DEFAULT 'beginner',  -- 'beginner', 'intermediate', 'advanced'
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  isPublished INTEGER DEFAULT 1,
  createdById TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

-- Resource bookmarks
CREATE TABLE IF NOT EXISTS wellness_bookmarks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  resourceId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resourceId) REFERENCES wellness_resources(id) ON DELETE CASCADE,
  UNIQUE(userId, resourceId)
);

-- Escalation requests (when user needs human counselor)
CREATE TABLE IF NOT EXISTS counselor_escalations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  sessionId TEXT NOT NULL,
  userId TEXT,
  reason TEXT,
  urgency TEXT DEFAULT 'normal',  -- 'low', 'normal', 'high', 'crisis'
  status TEXT DEFAULT 'pending',  -- 'pending', 'acknowledged', 'scheduled', 'resolved'
  assignedCounselorId TEXT,
  notes TEXT,
  scheduledAt TEXT,
  resolvedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (sessionId) REFERENCES counselor_sessions(id),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (assignedCounselorId) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_counselor_sessions_userId ON counselor_sessions(userId);
CREATE INDEX IF NOT EXISTS idx_counselor_sessions_anonymousId ON counselor_sessions(anonymousId);
CREATE INDEX IF NOT EXISTS idx_counselor_sessions_status ON counselor_sessions(status);
CREATE INDEX IF NOT EXISTS idx_counselor_messages_sessionId ON counselor_messages(sessionId);
CREATE INDEX IF NOT EXISTS idx_mood_entries_userId ON mood_entries(userId);
CREATE INDEX IF NOT EXISTS idx_mood_entries_createdAt ON mood_entries(createdAt);
CREATE INDEX IF NOT EXISTS idx_wellness_resources_category ON wellness_resources(category);
CREATE INDEX IF NOT EXISTS idx_wellness_resources_type ON wellness_resources(type);
CREATE INDEX IF NOT EXISTS idx_wellness_bookmarks_userId ON wellness_bookmarks(userId);
CREATE INDEX IF NOT EXISTS idx_counselor_escalations_status ON counselor_escalations(status);
CREATE INDEX IF NOT EXISTS idx_counselor_escalations_urgency ON counselor_escalations(urgency);

-- Insert sample wellness resources
INSERT INTO wellness_resources (id, title, description, content, type, category, duration, difficulty) VALUES
('res-001', 'Managing Workplace Stress', 'Learn effective techniques to handle stress in your daily work life.',
'# Managing Workplace Stress

Stress is a normal part of work, but when it becomes overwhelming, it can affect your health and productivity. Here are some proven strategies:

## 1. Identify Your Stressors
Keep a stress journal for a week. Note when you feel stressed, what triggered it, and how you responded.

## 2. Practice the 4-7-8 Breathing Technique
- Breathe in through your nose for 4 seconds
- Hold your breath for 7 seconds
- Exhale slowly through your mouth for 8 seconds
- Repeat 3-4 times

## 3. Take Regular Breaks
Follow the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds.

## 4. Set Boundaries
Learn to say no to unreasonable demands. Your wellbeing matters.

## 5. Connect with Colleagues
Build supportive relationships at work. A friendly chat can reduce stress significantly.

Remember: It''s okay to ask for help when you need it.',
'article', 'stress', 8, 'beginner'),

('res-002', '5-Minute Desk Meditation', 'A quick mindfulness exercise you can do at your desk.',
'# 5-Minute Desk Meditation

Find a comfortable seated position at your desk. You can close your eyes or keep them softly focused on a spot in front of you.

## The Practice

**Minute 1-2: Grounding**
Feel your feet on the floor. Notice the weight of your body in the chair. Take three deep breaths.

**Minute 2-3: Body Scan**
Starting from your head, slowly scan down your body. Notice any areas of tension. Don''t try to change anything, just observe.

**Minute 3-4: Breath Awareness**
Focus on your natural breathing. Feel the rise and fall of your chest. If your mind wanders, gently bring it back.

**Minute 5: Return**
Slowly become aware of your surroundings. Wiggle your fingers and toes. When ready, open your eyes.

Practice this daily for best results.',
'exercise', 'mindfulness', 5, 'beginner'),

('res-003', 'Building Resilience in Your Career', 'Strategies for bouncing back from setbacks and growing stronger.',
'# Building Resilience in Your Career

Resilience is not about avoiding challenges—it''s about developing the capacity to recover and grow from them.

## Key Resilience Strategies

### 1. Reframe Setbacks as Learning Opportunities
Instead of asking "Why did this happen to me?" ask "What can I learn from this?"

### 2. Build Your Support Network
Identify 3-5 people you can turn to for advice, encouragement, or just to listen.

### 3. Focus on What You Can Control
Make a list: things you can control, things you can influence, and things you cannot change. Direct your energy accordingly.

### 4. Celebrate Small Wins
Keep a "success journal." Write down one thing you did well each day, no matter how small.

### 5. Maintain Perspective
Ask yourself: "Will this matter in 5 years?" Often, our current challenges are smaller than they seem.

### 6. Take Care of Your Physical Health
Sleep, exercise, and nutrition directly impact your mental resilience.

## Action Step
Choose one strategy above and practice it for the next week.',
'article', 'career', 10, 'intermediate'),

('res-004', 'Improving Sleep for Better Wellbeing', 'Evidence-based tips for getting quality rest.',
'# Improving Sleep for Better Wellbeing

Good sleep is the foundation of mental and physical health. Here''s how to improve yours:

## Sleep Hygiene Basics

### Create a Sleep Schedule
Go to bed and wake up at the same time every day, even on weekends.

### Optimize Your Environment
- Keep your bedroom cool (18-22°C)
- Make it dark with curtains or an eye mask
- Reduce noise or use white noise

### Wind Down Properly
Start a relaxation routine 1 hour before bed:
- Dim the lights
- Avoid screens (or use blue light filters)
- Try reading, gentle stretching, or journaling

### Watch What You Consume
- No caffeine after 2 PM
- Limit alcohol (it disrupts sleep quality)
- Avoid large meals close to bedtime

## The 4-7-8 Sleep Technique
If you struggle to fall asleep, try this breathing pattern:
1. Exhale completely
2. Inhale through nose for 4 seconds
3. Hold for 7 seconds
4. Exhale through mouth for 8 seconds
5. Repeat 3 times

Sweet dreams!',
'article', 'sleep', 7, 'beginner'),

('res-005', 'Healthy Work Relationships', 'Navigate office dynamics with grace and professionalism.',
'# Building Healthy Work Relationships

Strong professional relationships make work more enjoyable and productive.

## Communication Essentials

### Active Listening
- Give full attention when others speak
- Avoid interrupting
- Ask clarifying questions
- Summarize to confirm understanding

### Clear Expression
- Be direct but respectful
- Use "I" statements instead of "You" accusations
- Choose the right medium (email vs. in-person)

## Handling Conflict

### The DESC Model
- **D**escribe the situation objectively
- **E**xpress how you feel about it
- **S**pecify what you would like to happen
- **C**onsequences - explain positive outcomes

### Example:
"When meetings run over time (D), I feel stressed because I fall behind on my tasks (E). Could we set a timer and stick to the agenda (S)? This would help everyone manage their day better (C)."

## Building Trust
- Keep your commitments
- Give credit where due
- Maintain confidentiality
- Offer help without expecting returns

Remember: You don''t have to be friends with everyone, but mutual respect makes work better for all.',
'article', 'relationships', 12, 'intermediate');
