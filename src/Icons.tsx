// Re-export lucide-react icons using Zuri's naming convention
export {
  Check as IconCheck,
  Plus as IconPlus,
  Settings as IconSettings,
  SquareCheck as IconTask,
  Folder as IconFolder,
  Pencil as IconEdit,
  X as IconClose,
  Menu as IconMenu,
  Calendar as IconCalendar,
  Flag as IconFlag,
  Clock as IconClock,
  FileText as IconFile,
  Bell as IconBell,
  Palette as IconColor,
  Sparkles as IconSparkle,
  GripVertical as IconGripVertical,
  Code2 as IconCode,
  Repeat as IconRepeat,
  MoreHorizontal as IconEllipsis,
} from 'lucide-react';

// Custom icons not available in lucide-react
import type { CSSProperties } from 'react';

type IconProps = {
  size?: number;
  style?: CSSProperties;
  className?: string;
};

export function IconApple({ size = 18, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      style={style}
      className={className}
    >
      <path
        d="M12.5 5.5C11.5 5.5 10.8 6 10.5 6C10.2 6 9.5 5.5 8.5 5.5C6.5 5.5 5 7.2 5 9.5C5 12.3 6.8 15 8.5 15C9.2 15 9.7 14.5 10.5 14.5C11.3 14.5 11.8 15 12.5 15C14.2 15 16 12.3 16 9.5C16 7.2 14.5 5.5 12.5 5.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.5 5.5C10.5 4 11.5 3 11.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconWindows({ size = 18, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      style={style}
      className={className}
    >
      <path d="M3 5L8.5 4.2V8.5H3V5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M3 9.5H8.5V13.8L3 13V9.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9.5 4L15 3V8.5H9.5V4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9.5 9.5H15V15L9.5 14V9.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
