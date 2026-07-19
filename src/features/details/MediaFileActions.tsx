import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDeleteMediaFile } from '@/api/queries';
import { toErrorMessage } from '@/api/http';
import { Button } from '@/components/ui/Button';
import { downloadMediaUrl } from '@/lib/mediaFile';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

type Props = {
  mediaId: string;
  /** Suggested filename for the browser download attribute. */
  fileName?: string;
  size?: 'sm' | 'md' | 'lg';
  /** When media is removed, navigate here (e.g. library home). */
  onRemovedNavigateTo?: string;
};

export function MediaFileActions({
  mediaId,
  fileName,
  size = 'lg',
  onRemovedNavigateTo = '/',
}: Props) {
  const { t } = useTranslation('details');
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const token = useAuthStore((s) => s.accessToken);
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const deleteMutation = useDeleteMediaFile();
  const [error, setError] = useState<string | null>(null);

  const onDownload = () => {
    const url = downloadMediaUrl(baseUrl, mediaId, token);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName ?? 'video';
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

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size={size} variant="secondary" onClick={onDownload}>
          {t('download')}
        </Button>
        {role === 'Admin' && (
          <Button
            type="button"
            size={size}
            variant="secondary"
            disabled={deleteMutation.isPending}
            onClick={() => void onDelete()}
          >
            {deleteMutation.isPending ? t('deleting') : t('deleteFile')}
          </Button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
