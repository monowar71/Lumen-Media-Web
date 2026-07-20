import type { ReactNode, SVGProps } from 'react';
import { cn } from '@/lib/utils';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 22, className, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconBack(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 18l-6-6 6-6" />
    </Icon>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <Icon fill="currentColor" stroke="none" {...props}>
      <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86a1 1 0 00-1.5.86z" />
    </Icon>
  );
}

export function IconPause(props: IconProps) {
  return (
    <Icon fill="currentColor" stroke="none" {...props}>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </Icon>
  );
}

export function IconVolume(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10v4h3l4 4V6L7 10H4z" fill="currentColor" stroke="none" />
      <path d="M15.5 8.5a5 5 0 010 7" />
      <path d="M18 6a8.5 8.5 0 010 12" />
    </Icon>
  );
}

export function IconVolumeMute(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10v4h3l4 4V6L7 10H4z" fill="currentColor" stroke="none" />
      <path d="M16 9l5 5M21 9l-5 5" />
    </Icon>
  );
}

export function IconSubtitles(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 15h4M13 15h4M7 11h10" />
    </Icon>
  );
}

export function IconAudio(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 18V6l10-2v12" />
      <circle cx="7" cy="18" r="2.5" />
      <circle cx="17" cy="16" r="2.5" />
    </Icon>
  );
}

export function IconQuality(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M8 10v4M8 12h2.5a1.5 1.5 0 000-3H8M14 14V10h1.5a1.5 1.5 0 010 3H14l2 1" />
    </Icon>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Icon strokeWidth={2.4} {...props}>
      <path d="M5 12l5 5L20 7" />
    </Icon>
  );
}

export function IconFullscreen(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 3H4a1 1 0 00-1 1v4M16 3h4a1 1 0 011 1v4M8 21H4a1 1 0 01-1-1v-4M16 21h4a1 1 0 001-1v-4" />
    </Icon>
  );
}

export function IconFullscreenExit(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 3v5a1 1 0 01-1 1H3M15 3v5a1 1 0 001 1h5M9 21v-5a1 1 0 00-1-1H3M15 21v-5a1 1 0 011-1h5" />
    </Icon>
  );
}
