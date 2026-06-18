import { useMemo, useState } from 'react';
import { MessageSquareText, SendHorizonal } from 'lucide-react';
import { Button } from '../ui/button';
import { VirtualList } from '../shared/VirtualList';
import { formatIndiaDateTime } from '../../utils/formatters';

export function TaskComments({ comments = [], onAdd, maxHeightClassName = 'max-h-80' }) {
  const [text, setText] = useState('');
  const sortedComments = useMemo(
    () =>
      [...comments].sort(
        (left, right) =>
          new Date(left.timestamp || left.createdAt || 0).getTime() - new Date(right.timestamp || right.createdAt || 0).getTime(),
      ),
    [comments],
  );
  const useVirtualList = sortedComments.length > 12;
  const virtualListHeightClassName = maxHeightClassName.startsWith('max-h-') ? maxHeightClassName.replace('max-h-', 'h-') : 'h-[22rem]';

  async function handleAdd() {
    const nextText = text.trim();
    if (!nextText) return;
    await onAdd?.(nextText);
    setText('');
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.96)] shadow-[0_22px_70px_-48px_rgba(15,23,42,0.38)]">
      <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.12)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-2xl bg-sky-500/10 p-2 text-sky-600">
            <MessageSquareText className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[rgb(var(--text))]">Comments</div>
            <div className="text-xs text-slate-500">{sortedComments.length} update{sortedComments.length === 1 ? '' : 's'}</div>
          </div>
        </div>
      </div>

      <div className={`px-4 py-3 ${maxHeightClassName}`}>
        {sortedComments.length ? (
          useVirtualList ? (
            <VirtualList
              items={sortedComments}
              estimateSize={112}
              className={`${virtualListHeightClassName} pr-1`}
              renderItem={(comment, index) => <CommentItem key={`${comment.timestamp || comment.createdAt || index}-${index}`} comment={comment} index={index} />}
            />
          ) : (
            <div className={`scrollbar-none overflow-y-auto ${maxHeightClassName}`}>
              <div className="space-y-3">
                {sortedComments.map((comment, index) => (
                  <CommentItem key={`${comment.timestamp || comment.createdAt || index}-${index}`} comment={comment} index={index} />
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel-2)/0.7)] px-4 py-8 text-center text-sm text-slate-500">
            No comments yet. Add the first update for this task.
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.96)] p-3 backdrop-blur">
        <div className="flex gap-2">
          <input
            className="input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Add a clear task update..."
          />
          <Button type="button" disabled={!text.trim()} onClick={handleAdd}>
            <SendHorizonal className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatCommentTime(value) {
  if (!value) return 'Just now';
  return formatIndiaDateTime(value);
}

function CommentItem({ comment }) {
  const author = comment.user?.name || comment.userName || 'Team member';
  const timestamp = formatCommentTime(comment.timestamp || comment.createdAt);
  return (
    <div className="theme-panel-muted rounded-2xl border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold text-[rgb(var(--text))]">{author}</div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{timestamp}</div>
      </div>
      <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{comment.text}</div>
    </div>
  );
}
