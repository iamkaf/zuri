import { Notification } from 'electron';
import type { DocModel } from './markdown';

type Timer = { key: string; timeout: NodeJS.Timeout };

const timers = new Map<string, Timer>();

const clearAll = () => {
  for (const t of timers.values()) clearTimeout(t.timeout);
  timers.clear();
};

const parseTimeHHMM = (hhmm: string) => {
  const m = hhmm.match(/^(\d{2}):(\d{2})$/);
  if (!m) return { h: 0, m: 0 };
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const mm = Math.min(59, Math.max(0, Number(m[2])));
  return { h, m: mm };
};

const fireAt = (due: string, hhmm: string) => {
  const { h, m } = parseTimeHHMM(hhmm);
  // local time
  const [Y, M, D] = due.split('-').map(Number);
  return new Date(Y, (M ?? 1) - 1, D ?? 1, h, m, 0, 0);
};

export const rescheduleNotifications = (opts: {
  model: DocModel;
  enabled: boolean;
  notificationTime: string;
}) => {
  clearAll();
  if (!opts.enabled) return;

  const now = Date.now();

  for (const section of opts.model.sections) {
    for (const task of section.tasks) {
      if (task.done) continue;
      if (!task.due) continue;

      const when = fireAt(task.due, opts.notificationTime).getTime();
      if (!Number.isFinite(when) || when <= now) continue;

      const key = `${section.name}::${task.title}::${task.due}::${opts.notificationTime}`;
      const timeout = setTimeout(() => {
        new Notification({
          title: 'Zuri — Task due',
          body: `${task.title} (${section.name})`,
        }).show();
      }, when - now);

      timers.set(key, { key, timeout });
    }
  }
};
