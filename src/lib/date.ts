const pad2 = (n: number) => String(n).padStart(2, '0');

export const isoToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

// Returns the status suffix shown inside the recur pill, e.g. "· done today" or "· Feb 21"
export const recurStateSuffix = (due: string | undefined, lastDone: string | undefined): string => {
  const today = isoToday();
  if (lastDone === today) return ' · done today';
  if (due) {
    const diffMs = new Date(due + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime();
    const diffDays = Math.round(diffMs / 86_400_000);
    if (diffDays < 0) return ` · ${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return ' · due today';
    if (diffDays === 1) return ' · tomorrow';
    return ` · ${new Date(due + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
  }
  if (lastDone) {
    return ` · done ${new Date(lastDone + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
  }
  return '';
};
