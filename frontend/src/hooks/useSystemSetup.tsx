import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export interface UseSystemSetupProps {
  closeSettings: () => void;
  openConfirm: (config: any) => void;
  closeConfirm: () => void;
  reload: () => Promise<void>;
  setSelectedId: (id: string | null) => void;
}

export function useSystemSetup({
  closeSettings,
  openConfirm,
  closeConfirm,
  reload,
  setSelectedId,
}: UseSystemSetupProps) {
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [deletedSize, setDeletedSize] = useState<number | null>(null);
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    api.getSetupStatus()
      .then((status) => {
        setSetupRequired(!status.initialized);
      })
      .catch(() => {
        setSetupRequired(false);
      });
  }, []);

  const handleRequestReset = () => {
    closeSettings();
    openConfirm({
      title: 'Sistemi sifirla',
      message: (
        <React.Fragment>
          <strong className="text-brand-danger">Dikkat:</strong> Bu islem tum ajanlari,
          sohbetleri, zamanlanmis gorevleri ve loglari <strong>kalici olarak</strong>{' '}
          silecek ve kurulum sihirbazini yeniden acacak.
        </React.Fragment>
      ),
      details: (
        <div className="space-y-1">
          <div>• Silinecek: tum ajanlar, tum mesajlar, tum gorevler, tum loglar</div>
          <div>• Geri alinamaz</div>
          <div>• Ayarlar (tema) korunur</div>
        </div>
      ),
      variant: 'danger',
      confirmLabel: 'Evet, SIFIRLA',
      requireTypeText: 'SIFIRLA',
      onConfirm: async () => {
        closeConfirm();
        setShowReset(true);
        try {
          const res = await api.resetSystem();
          setDeletedSize(res.deleted_size_mb);
          await reload();
          setSelectedId(null);
        } catch (err) {
          setShowReset(false);
          openConfirm({
            title: 'Sifirlama basarisiz',
            message: err instanceof Error ? err.message : String(err),
            confirmLabel: 'Tamam',
            onConfirm: closeConfirm
          });
        }
      }
    });
  };

  return {
    setupRequired,
    setSetupRequired,
    showSplash,
    setShowSplash,
    showReset,
    setShowReset,
    deletedSize,
    setDeletedSize,
    typedText,
    setTypedText,
    handleRequestReset,
  };
}
