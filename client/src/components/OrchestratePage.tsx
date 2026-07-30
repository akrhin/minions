import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, Loader2, ChartNetwork } from 'lucide-react';
import { toErrorMessage } from '../lib/format';

export function OrchestratePage() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') navigate('/');
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleSubmit = useCallback(async () => {
    const trimmed = goal.trim();
    if (!trimmed || isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/tasks/create-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: trimmed }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const { task } = await res.json();
      navigate(`/tasks/${task.id}`);
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to start orchestrator'));
      setIsCreating(false);
    }
  }, [goal, isCreating, navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 320) + 'px';
  }, []);

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center px-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <ChartNetwork size={28} className="text-indigo-500" />
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Orchestrate
        </h1>
      </div>

      <div className="w-full max-w-3xl">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm">
          <textarea
            ref={textareaRef}
            value={goal}
            onChange={(e) => { setGoal(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            placeholder={`What do you want to accomplish?\n\nExample: "Review all pipeline-plugin audit items, fix P0 bugs, and push the changes."`}
            rows={6}
            disabled={isCreating}
            className="w-full resize-none bg-transparent px-5 pt-4 pb-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none leading-relaxed"
          />
          {error && (
            <div className="px-5 pb-2 text-xs text-red-500">{error}</div>
          )}
          <div className="flex items-center justify-between gap-2 px-4 pb-4">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              The orchestrator will decompose your goal into subtasks, create them on the board, and track them to completion.
            </p>
            <button
              onClick={handleSubmit}
              disabled={!goal.trim() || isCreating}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:opacity-30"
            >
              {isCreating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowUp size={18} />
              )}
            </button>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
            How it works
          </h3>
          <ol className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>1. The orchestrator analyzes your goal and breaks it into subtasks</li>
            <li>2. Subtasks appear on the board with dependencies and <span className="inline-flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">auto-review</span> tags</li>
            <li>3. Each subtask is worked by an agent, then auto-reviewed</li>
            <li>4. When all subtasks are done — the orchestrator synthesizes the result</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
