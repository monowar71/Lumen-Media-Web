import { useState } from 'react';
import { artworkUrl } from '@/lib/artwork';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface PosterImageProps {
  path?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  rounded?: boolean;
}

/**
 * Lazy-loaded, correctly-sized artwork with srcset for 1x/2x DPR
 * (client_web/AGENTS.md resource discipline).
 */
export function PosterImage({
  path,
  alt,
  width,
  height,
  className,
  rounded = true,
}: PosterImageProps) {
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const token = useAuthStore((s) => s.accessToken);
  const [failed, setFailed] = useState(false);
  const src1x = artworkUrl(baseUrl, path, { w: width, h: height, dpr: 1 }, token);
  const src2x = artworkUrl(baseUrl, path, { w: width, h: height, dpr: 2 }, token);
  const src = src1x;
  const srcSet = src1x && src2x ? `${src1x} 1x, ${src2x} 2x` : undefined;

  const box = cn(
    'flex items-center justify-center overflow-hidden bg-surface-2 text-muted',
    rounded && 'rounded-lg',
    className,
  );

  if (!src || failed) {
    return (
      <div className={box} style={{ aspectRatio: `${width} / ${height}` }} aria-label={alt}>
        <span className="px-2 text-center text-xs">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={`${width}px`}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={width}
      height={height}
      onError={() => setFailed(true)}
      className={cn('h-full w-full object-cover', rounded && 'rounded-lg', className)}
    />
  );
}
