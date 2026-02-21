import type { TaskFilter } from '../types';
import styles from './ContentHeader.module.css';

export type ContentHeaderProps = {
  title: string;
  filter: TaskFilter;
  onSetFilter: (filter: TaskFilter) => void;
  right?: React.ReactNode;
};

export function ContentHeader({ title, filter, onSetFilter, right }: ContentHeaderProps) {
  return (
    <div className={styles.contentHeader}>
      <div className={styles.contentHeaderTop}>
        <h1 className={styles.contentTitle}>{title}</h1>
        {right}
      </div>
      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn}${filter === 'open' ? ` ${styles.isActive}` : ''}`}
          onClick={() => onSetFilter('open')}
        >
          Open
        </button>
        <button
          className={`${styles.filterBtn}${filter === 'all' ? ` ${styles.isActive}` : ''}`}
          onClick={() => onSetFilter('all')}
        >
          All
        </button>
        <button
          className={`${styles.filterBtn}${filter === 'done' ? ` ${styles.isActive}` : ''}`}
          onClick={() => onSetFilter('done')}
        >
          Done
        </button>
      </div>
    </div>
  );
}
