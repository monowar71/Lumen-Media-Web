import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MediaItemSummary } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { IconPlay } from '@/components/AppIcons';
import { artworkUrl } from '@/lib/artwork';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { progressFraction } from '@/lib/format';

interface HeroBannerProps {
  item: MediaItemSummary;
}

/** Full-bleed Continue / featured hero — Plex-style cinema landing. */
export function HeroBanner({ item }: HeroBannerProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const token = useAuthStore((s) => s.accessToken);
  const backdrop = artworkUrl(
    baseUrl,
    item.artwork.backdrop ?? item.artwork.poster,
    { w: 1600, h: 900, quality: 70 },
    token,
  );
  const fraction = progressFraction(item.userData.playbackPositionMs, item.runtimeMs);
  const canResume = (item.userData.playbackPositionMs ?? 0) > 0 && !item.userData.watched;

  return (
    <section className="relative -mx-0 mb-8 min-h-[280px] overflow-hidden sm:min-h-[360px] lg:min-h-[420px]">
      {backdrop ? (
        <img
          src={backdrop}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-surface-2" />
      )}
      <div className="hero-scrim absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent" />

      <div className="relative flex h-full min-h-[280px] max-w-3xl flex-col justify-end px-4 pb-8 pt-24 sm:min-h-[360px] sm:px-6 sm:pb-10 lg:min-h-[420px] lg:px-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {canResume ? t('home.continueWatching') : t('home.featured')}
        </p>
        <h1 className="text-display text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
          {item.title}
        </h1>
        <p className="mt-2 line-clamp-2 max-w-xl text-sm text-muted sm:text-base">
          {[item.year, item.kind === 'Series' ? t('mediaTypes.Series') : t('mediaTypes.Movies')]
            .filter(Boolean)
            .join(' · ')}
        </p>

        {fraction > 0 && !item.userData.watched && (
          <div className="mt-4 h-1 max-w-xs overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-accent" style={{ width: `${fraction * 100}%` }} />
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            size="lg"
            className="min-w-[8rem] shadow-lg shadow-accent/20"
            onClick={() => navigate(`/item/${item.id}`)}
          >
            <IconPlay size={18} />
            {canResume ? t('home.resume') : t('home.play')}
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate(`/item/${item.id}`)}>
            {t('home.details')}
          </Button>
        </div>
      </div>
    </section>
  );
}
