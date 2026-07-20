import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useDeleteMediaFile, useMarkWatchedMutation, useRefreshMetadata } from '@/api/queries';
import { toErrorMessage } from '@/api/http';
import { Button } from '@/components/ui/Button';
import { IconMoreVertical } from '@/components/AppIcons';
import { downloadMediaUrl, sanitizeDownloadFileName } from '@/lib/mediaFile';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  MetadataAdminDialogs,
  type EditableMetadata,
  type MetadataAdminPanelKind,
} from './MetadataAdminPanel';

type Props = {
  mediaId: string;
  /** Suggested filename for the browser download attribute. */
  fileName?: string;
  size?: 'sm' | 'md' | 'lg';
  /** When media is removed, navigate here (e.g. library home). */
  onRemovedNavigateTo?: string;
  /** Optional watched toggle inside the same menu. */
  watched?: boolean;
  /** Optional trailer URL (opens in a new tab). */
  trailerUrl?: string | null;
  /** When false, hide the download action (e.g. series-level menu). */
  showDownload?: boolean;
  /** Admin-only metadata actions (refresh / edit / fix match). */
  metadataAdmin?: EditableMetadata;
};

function itemClass(destructive?: boolean) {
  return cn(
    'flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none',
    'data-[highlighted]:bg-surface-2',
    destructive ? 'text-red-400 data-[highlighted]:text-red-300' : 'text-text',
  );
}

/** Overflow menu for secondary media actions (download / delete / watched / trailer / metadata). */
export function MediaFileActions({
  mediaId,
  fileName,
  size = 'lg',
  onRemovedNavigateTo = '/',
  watched,
  trailerUrl,
  showDownload = true,
  metadataAdmin,
}: Props) {
  const { t } = useTranslation('details');
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const token = useAuthStore((s) => s.accessToken);
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const deleteMutation = useDeleteMediaFile();
  const markWatched = useMarkWatchedMutation();
  const refresh = useRefreshMetadata();
  const [error, setError] = useState<string | null>(null);
  const [metadataPanel, setMetadataPanel] = useState<MetadataAdminPanelKind>('none');

  const showMetadata = role === 'Admin' && Boolean(metadataAdmin);

  const onDownload = () => {
    const url = downloadMediaUrl(baseUrl, mediaId, token);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = sanitizeDownloadFileName(fileName ?? 'video');
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const onDelete = async () => {
    if (!window.confirm(t('deleteFileConfirm'))) return;
    setError(null);
    try {
      const result = await deleteMutation.mutateAsync(mediaId);
      if (result.mediaRemoved) {
        navigate(onRemovedNavigateTo, { replace: true });
      }
    } catch (err) {
      setError(toErrorMessage(err));
    }
  };

  const triggerSize =
    size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-9 w-9' : 'h-10 w-10';

  return (
    <div className="flex flex-col gap-1">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            type="button"
            size={size === 'lg' ? 'lg' : 'sm'}
            variant="secondary"
            className={cn(triggerSize, 'px-0')}
            aria-label={t('moreActions')}
          >
            <IconMoreVertical size={size === 'sm' ? 16 : 18} />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className={cn(
              'z-50 min-w-52 overflow-hidden rounded-xl border border-border',
              'bg-surface p-1 shadow-xl shadow-black/40',
            )}
          >
            {typeof watched === 'boolean' && (
              <DropdownMenu.Item
                className={itemClass()}
                disabled={markWatched.isPending}
                onSelect={() => markWatched.mutate({ itemId: mediaId, watched: !watched })}
              >
                {watched ? t('markUnwatched') : t('markWatched')}
              </DropdownMenu.Item>
            )}
            {trailerUrl && (
              <DropdownMenu.Item
                className={itemClass()}
                onSelect={() => window.open(trailerUrl, '_blank', 'noopener')}
              >
                {t('trailer')}
              </DropdownMenu.Item>
            )}
            {showDownload && (
              <DropdownMenu.Item className={itemClass()} onSelect={onDownload}>
                {t('download')}
              </DropdownMenu.Item>
            )}
            {showMetadata && metadataAdmin && (
              <>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item
                  className={itemClass()}
                  disabled={refresh.isPending}
                  onSelect={() => refresh.mutate(metadataAdmin.id)}
                >
                  {refresh.isPending ? t('refreshing') : t('refreshMetadata')}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={itemClass()}
                  onSelect={() => setMetadataPanel('edit')}
                >
                  {t('editMetadata')}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={itemClass()}
                  onSelect={() => setMetadataPanel('match')}
                >
                  {t('fixMatch')}
                </DropdownMenu.Item>
              </>
            )}
            {showDownload && role === 'Admin' && (
              <DropdownMenu.Item
                className={itemClass(true)}
                disabled={deleteMutation.isPending}
                onSelect={() => void onDelete()}
              >
                {deleteMutation.isPending ? t('deleting') : t('deleteFile')}
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {showMetadata && metadataAdmin && (
        <MetadataAdminDialogs
          item={metadataAdmin}
          panel={metadataPanel}
          onPanelChange={setMetadataPanel}
        />
      )}
    </div>
  );
}
