import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { X, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/users';
import { Avatar } from '../components/Avatar';
import { getCroppedImg } from '../lib/cropImage';

const ROLE_LABEL: Record<string, string> = {
  CLIENT: 'Client',
  COACH:  'Coach',
  ADMIN:  'Administrateur',
};

export function Profile() {
  const { user, refreshUser } = useAuth();
  const [modalOpen, setModalOpen]   = useState(false);
  const [imageSrc, setImageSrc]     = useState<string | null>(null);
  const [crop, setCrop]             = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom]             = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [saving, setSaving]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFile = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setImageSrc(reader.result as string); setModalOpen(true); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) { toast.error('Fichier image requis'); return; }
    const reader = new FileReader();
    reader.onload = () => { setImageSrc(reader.result as string); setModalOpen(true); };
    reader.readAsDataURL(file);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedArea) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedArea);
      await usersApi.uploadAvatar(blob);
      await refreshUser();
      setModalOpen(false);
      setImageSrc(null);
      toast.success('Photo de profil mise à jour');
    } catch {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer votre photo de profil ?')) return;
    try {
      await usersApi.deleteAvatar();
      await refreshUser();
      toast.success('Photo supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-lg">
      <div className="mb-8 pb-6 border-b border-ink/8">
        <h1 className="font-serif italic text-[clamp(32px,4vw,48px)] text-ink leading-tight tracking-tight">
          Mon profil
        </h1>
      </div>

      {/* Avatar section */}
      <div className="flex items-start gap-6 mb-8 pb-8 border-b border-ink/8">
        <Avatar user={user} size="lg" />
        <div className="flex flex-col gap-3 pt-1">
          <p className="font-sans font-medium text-ink">{user.firstName} {user.lastName}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{ROLE_LABEL[user.role]}</p>
          <div className="flex gap-3 mt-2">
            <div
              className="border border-dashed border-ink/20 hover:border-ink/40 transition-colors duration-150 cursor-pointer px-4 py-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted hover:text-ink"
              onClick={openFile}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
              {user.avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
            </div>
            {user.avatarUrl && (
              <button
                onClick={() => void handleDelete()}
                className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent hover:opacity-70 transition-opacity flex items-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                Supprimer
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      </div>

      {/* Info */}
      <div className="space-y-4">
        {[
          { label: 'Prénom',  value: user.firstName },
          { label: 'Nom',     value: user.lastName  },
          { label: 'Email',   value: user.email     },
          { label: 'Rôle',    value: ROLE_LABEL[user.role] },
        ].map(({ label, value }) => (
          <div key={label} className="grid grid-cols-[120px_1fr] items-baseline gap-4 border-b border-ink/6 pb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{label}</span>
            <span className="font-sans text-sm text-ink">{value}</span>
          </div>
        ))}
      </div>

      {/* Crop modal */}
      {modalOpen && imageSrc && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-ink/15 w-full max-w-md shadow-[0_24px_64px_rgba(26,26,26,0.16)]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-ink/8">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Recadrer la photo</p>
              <button onClick={() => { setModalOpen(false); setImageSrc(null); }} className="btn-ghost">
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="relative h-72 bg-ink/5">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, pixels) => setCroppedArea(pixels)}
              />
            </div>

            <div className="px-6 py-4 border-t border-ink/8">
              <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint block mb-2">Zoom</label>
              <input
                type="range"
                min={1} max={3} step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-ink"
              />
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => { setModalOpen(false); setImageSrc(null); }}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="btn-primary flex-1"
              >
                {saving ? '…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
