import type { CSSProperties } from 'react';

type IconProps = {
  size?: number;
  style?: CSSProperties;
  className?: string;
};

export function IconCheck({ size = 16, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={style}
      className={className}
    >
      <path
        d="M3 8L6.5 11.5L13 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPlus({ size = 16, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={style}
      className={className}
    >
      <path
        d="M8 3V13M3 8H13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconSettings({ size = 18, style, className }: IconProps) {
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
        d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.625 11.25C14.5245 11.4788 14.4945 11.7326 14.5388 11.9788C14.583 12.2251 14.6995 12.4528 14.874 12.6337L14.9228 12.6825C15.0573 12.8169 15.1642 12.9761 15.2373 13.1514C15.3105 13.3266 15.3484 13.5145 15.3484 13.7044C15.3484 13.8942 15.3105 14.0821 15.2373 14.2574C15.1642 14.4326 15.0573 14.5918 14.9228 14.7262C14.7884 14.8607 14.6292 14.9676 14.4539 15.0408C14.2787 15.1139 14.0908 15.1518 13.9009 15.1518C13.711 15.1518 13.5232 15.1139 13.3479 15.0408C13.1726 14.9676 13.0134 14.8607 12.879 14.7262L12.8303 14.6775C12.6494 14.503 12.4216 14.3865 12.1754 14.3423C11.9291 14.298 11.6753 14.328 11.4465 14.4285C11.2222 14.5246 11.0307 14.6846 10.8965 14.8893C10.7623 15.0939 10.6909 15.3343 10.6909 15.5803V15.75C10.6909 16.1347 10.5382 16.5034 10.2663 16.7753C9.99441 17.0472 9.62571 17.2 9.24097 17.2C8.85623 17.2 8.48753 17.0472 8.21563 16.7753C7.94373 16.5034 7.79097 16.1347 7.79097 15.75V15.6787C7.7851 15.4272 7.70704 15.1826 7.56618 14.9743C7.42533 14.766 7.22767 14.603 6.99722 14.505C6.76841 14.4045 6.51464 14.3745 6.26837 14.4188C6.02211 14.463 5.79434 14.5795 5.61347 14.754L5.56472 14.8027C5.4303 14.9372 5.27112 15.0441 5.09585 15.1173C4.92058 15.1904 4.73269 15.2283 4.54284 15.2283C4.35299 15.2283 4.16511 15.1904 3.98984 15.1173C3.81456 15.0441 3.65539 14.9372 3.52097 14.8027C3.3865 14.6683 3.2796 14.5092 3.20644 14.3339C3.13328 14.1586 3.09537 13.9707 3.09537 13.7809C3.09537 13.591 3.13328 13.4031 3.20644 13.2279C3.2796 13.0526 3.3865 12.8934 3.52097 12.759L3.56972 12.7102C3.74421 12.5294 3.86073 12.3016 3.90498 12.0553C3.94922 11.8091 3.91924 11.5553 3.81872 11.3265C3.72263 11.1022 3.56263 10.9107 3.35796 10.7765C3.15328 10.6423 2.91289 10.5709 2.66697 10.5709H2.49722C2.11248 10.5709 1.74378 10.4182 1.47188 10.1463C1.19998 9.87436 1.04722 9.50566 1.04722 9.12092C1.04722 8.73618 1.19998 8.36749 1.47188 8.09559C1.74378 7.82368 2.11248 7.67092 2.49722 7.67092H2.56847C2.81996 7.66505 3.06458 7.58699 3.27287 7.44614C3.48116 7.30528 3.64415 7.10763 3.74222 6.87717C3.84273 6.64837 3.87272 6.39459 3.82847 6.14833C3.78423 5.90207 3.66771 5.67429 3.49322 5.49342L3.44447 5.44467C3.31 5.31025 3.2031 5.15108 3.12994 4.9758C3.05678 4.80053 3.01887 4.61265 3.01887 4.4228C3.01887 4.23295 3.05678 4.04506 3.12994 3.86979C3.2031 3.69452 3.31 3.53534 3.44447 3.40092C3.57889 3.26645 3.73806 3.15956 3.91334 3.0864C4.08861 3.01324 4.27649 2.97532 4.46634 2.97532C4.65619 2.97532 4.84408 3.01324 5.01935 3.0864C5.19462 3.15956 5.3538 3.26645 5.48822 3.40092L5.53697 3.44967C5.71784 3.62416 5.94561 3.74068 6.19187 3.78493C6.43814 3.82917 6.69191 3.79919 6.92072 3.69867C7.14503 3.60258 7.33653 3.44259 7.47071 3.23791C7.6049 3.03324 7.67632 2.79284 7.67634 2.54692V2.37717C7.67634 1.99243 7.8291 1.62373 8.101 1.35183C8.3729 1.07993 8.7416 0.92717 9.12634 0.92717C9.51108 0.92717 9.87978 1.07993 10.1517 1.35183C10.4236 1.62373 10.5763 1.99243 10.5763 2.37717V2.44842C10.5763 2.69435 10.6478 2.93474 10.782 3.13941C10.9161 3.34409 11.1076 3.50408 11.332 3.60017C11.5608 3.70069 11.8145 3.73067 12.0608 3.68643C12.3071 3.64218 12.5348 3.52566 12.7157 3.35117L12.7645 3.30242C12.8989 3.16795 13.0581 3.06106 13.2333 2.9879C13.4086 2.91474 13.5965 2.87682 13.7863 2.87682C13.9762 2.87682 14.1641 2.91474 14.3393 2.9879C14.5146 3.06106 14.6738 3.16795 14.8082 3.30242C14.9427 3.43684 15.0496 3.59602 15.1227 3.77129C15.1959 3.94656 15.2338 4.13445 15.2338 4.3243C15.2338 4.51415 15.1959 4.70203 15.1227 4.8773C15.0496 5.05257 14.9427 5.21175 14.8082 5.34617L14.7595 5.39492C14.585 5.57579 14.4685 5.80357 14.4242 6.04983C14.38 6.29609 14.41 6.54987 14.5105 6.77867C14.6066 7.00298 14.7666 7.19449 14.9712 7.32867C15.1759 7.46285 15.4163 7.53428 15.6622 7.5343H15.832C16.2167 7.5343 16.5854 7.68706 16.8573 7.95896C17.1292 8.23086 17.282 9.09956 17.282 9.4843C17.282 9.86904 17.1292 10.2377 16.8573 10.5096C16.5854 10.7815 16.2167 10.9343 15.832 10.9343H15.7607C15.5148 10.9343 15.2744 11.0057 15.0697 11.1399C14.865 11.2741 14.705 11.4656 14.609 11.69"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconTask({ size = 18, style, className }: IconProps) {
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
        d="M6.5 9L8 10.5L11.5 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="2.75"
        y="2.75"
        width="12.5"
        height="12.5"
        rx="3.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function IconFolder({ size = 18, style, className }: IconProps) {
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
        d="M2.25 5.25C2.25 4.42157 2.92157 3.75 3.75 3.75H6.539C6.82354 3.75 7.09998 3.84867 7.32279 4.03109L8.42721 4.91891C8.6502 5.10133 8.92646 5.2 9.211 5.2H14.25C15.0784 5.2 15.75 5.87157 15.75 6.7V12.75C15.75 13.5784 15.0784 14.25 14.25 14.25H3.75C2.92157 14.25 2.25 13.5784 2.25 12.75V5.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconEdit({ size = 16, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={style}
      className={className}
    >
      <path
        d="M11.5 2.5L13.5 4.5M12.5 1.5L5.5 8.5L5 11L7.5 10.5L14.5 3.5C14.8 3.2 14.8 2.7 14.5 2.4L13.6 1.5C13.3 1.2 12.8 1.2 12.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconClose({ size = 16, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={style}
      className={className}
    >
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconMenu({ size = 18, style, className }: IconProps) {
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
        d="M3 5.25H15M3 9H15M3 12.75H15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconCalendar({ size = 14, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      style={style}
      className={className}
    >
      <rect
        x="1.75"
        y="2.75"
        width="10.5"
        height="9.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path d="M4 1.5V3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M10 1.5V3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M1.75 5H12.25" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function IconFlag({ size = 14, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      style={style}
      className={className}
    >
      <path
        d="M3 12.5V7V1.5H10.5L8.5 4L10.5 6.5H3"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconClock({ size = 14, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      style={style}
      className={className}
    >
      <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.25" />
      <path d="M7 4V7L9 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function IconFile({ size = 18, style, className }: IconProps) {
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
        d="M10.25 2.25H4.75C3.92157 2.25 3.25 2.92157 3.25 3.75V14.25C3.25 15.0784 3.92157 15.75 4.75 15.75H13.25C14.0784 15.75 14.75 15.0784 14.75 14.25V6.75L10.25 2.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.25 2.25V6.75H14.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconBell({ size = 18, style, className }: IconProps) {
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
        d="M7 14.5C7.4 15.33 8.13 16 9 16C9.87 16 10.6 15.33 11 14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 7.5C14 5.9087 13.3679 4.38258 12.2426 3.25736C11.1174 2.13214 9.5913 1.5 8 1.5C6.4087 1.5 4.88258 2.13214 3.75736 3.25736C2.63214 4.38258 2 5.9087 2 7.5C2 11.5 1 12.5 1 12.5H15C15 12.5 14 11.5 14 7.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconColor({ size = 18, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      style={style}
      className={className}
    >
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="9" r="4" fill="currentColor" />
    </svg>
  );
}

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

export function IconSparkle({ size = 18, style, className }: IconProps) {
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
        d="M9 3L10 6L13 7L10 8L9 11L8 8L5 7L8 6L9 3Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 11L13.5 12.5L15 13L13.5 13.5L13 15L12.5 13.5L11 13L12.5 12.5L13 11Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconGripVertical({ size = 16, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={style}
      className={className}
    >
      <circle cx="5" cy="3" r="1" fill="currentColor" />
      <circle cx="5" cy="8" r="1" fill="currentColor" />
      <circle cx="5" cy="13" r="1" fill="currentColor" />
      <circle cx="11" cy="3" r="1" fill="currentColor" />
      <circle cx="11" cy="8" r="1" fill="currentColor" />
      <circle cx="11" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconRepeat({ size = 14, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      style={style}
      className={className}
    >
      <path
        d="M2 7C2 4.24 4.24 2 7 2C8.5 2 9.83 2.65 10.77 3.67L12 5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M12 2V5H9"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 7C12 9.76 9.76 12 7 12C5.5 12 4.17 11.35 3.23 10.33L2 9"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M2 12V9H5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconEllipsis({ size = 16, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={style}
      className={className}
    >
      <circle cx="3" cy="8" r="1.5" fill="currentColor" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="13" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}
