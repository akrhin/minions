import { adapter } from './app.js';
import { getTask, updateTask } from './db/queries.js';
import { broadcast } from './events.js';
import { notify } from './notifications.js';
import { REVIEW_AGENT_PROMPT } from './prompts/review-agent.js';

const AUTO_REVIEW_TAG = 'auto-review';

/**
 * Parse review verdict from agent response.
 * Accepts JSON with or without markdown fences.
 */
function parseVerdict(text: string): { verdict: 'approve' | 'reject'; summary?: string; feedback?: string } | null {
  // Strip markdown fences if present
  let json = text.trim();
  if (json.startsWith('```')) {
    json = json.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(json);

    if (parsed.verdict === 'approve') {
      return { verdict: 'approve', summary: parsed.summary ?? '' };
    }
    if (parsed.verdict === 'reject') {
      return { verdict: 'reject', feedback: parsed.feedback ?? 'No feedback provided' };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Build a compact conversation context from task messages.
 */
function buildConversationContext(taskId: string, messages: Array<{ role: string; content: string }>): string {
  const lines: string[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') continue;
    if (msg.role === 'user' && msg.content) {
      lines.push(`User: ${msg.content.slice(0, 4000)}`);
    } else if (msg.role === 'assistant' && msg.content) {
      lines.push(`Agent: ${msg.content.slice(0, 4000)}`);
    }
  }

  return lines.join('\n\n');
}

/**
 * Run auto-review on a task that just moved to in_review.
 * Returns true if the task was auto-handled (approved or rejected).
 */
export async function autoReviewTask(taskId: string): Promise<boolean> {
  const task = getTask(taskId);
  if (!task || task.status !== 'in_review') return false;

  // Only auto-review tagged tasks
  const tags = task.tags ?? [];
  if (!tags.includes(AUTO_REVIEW_TAG)) return false;

  try {
    // Fetch conversation
    const messages = await adapter.getMessages(taskId, taskId);
    const context = buildConversationContext(taskId, messages);

    if (!context.trim()) {
      // Empty conversation — nothing to review, just approve
      const updated = updateTask(taskId, { status: 'done' });
      if (updated) broadcast({ type: 'task_updated', task: updated });
      return true;
    }

    // Run review via Hermes (non-streaming chat)
    const prompt = [
      REVIEW_AGENT_PROMPT,
      '',
      `## Task: ${task.title}`,
      task.description ? `\n## Description:\n${task.description}` : '',
      `\n## Conversation:\n${context}`,
      '',
      'Output your JSON verdict now:',
    ].join('\n');

    const result = await adapter.chat(`review-${taskId}`, prompt, {
      systemMessage: 'You are a strict but fair code review bot. Respond only with the requested JSON format.',
    });

    const verdict = parseVerdict(result.text);

    if (!verdict) {
      // Parse failed — leave in_review, human reviews it
      return false;
    }

    if (verdict.verdict === 'approve') {
      const updated = updateTask(taskId, { status: 'done' });
      if (updated) {
        broadcast({ type: 'task_updated', task: updated });
      }
      return true;
    }

    if (verdict.verdict === 'reject') {
      // Move back to in_progress with feedback as pending_prompt
      const rejectMessage = `🔁 **Auto-review rejected**\n${verdict.feedback}\n\nFix the issues and run again.`;
      const updated = updateTask(taskId, {
        status: 'in_progress',
        pending_prompt: rejectMessage,
      });
      if (updated) {
        broadcast({ type: 'task_updated', task: updated });
        // Start a new agent session with the rejection feedback
        try {
          const { startTaskRun } = await import('./routes/chat.js');
          await startTaskRun(updated, rejectMessage, 'task', { taskFields: {}, hasFields: false });
        } catch {
          // Best-effort — the task is back in in_progress with a pending_prompt
        }
      }
      return true;
    }

    return false;
  } catch {
    // Any error → leave in_review for human review
    return false;
  }
}
