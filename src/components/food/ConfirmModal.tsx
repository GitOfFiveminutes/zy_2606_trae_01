import { Utensils, Trash2, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { STORAGE_AREA_LABELS, STORAGE_AREA_ICONS, ACTION_LABELS } from '@/types';

export function ConfirmModal() {
  const { confirmData, closeConfirm, handleAction, currentUser } = useAppStore();

  if (!confirmData) return null;

  const { food, action } = confirmData;

  const handleConfirm = () => {
    handleAction(food.id, action, currentUser);
  };

  const isConsume = action === 'consume';

  return (
    <Modal
      open={!!confirmData}
      onClose={closeConfirm}
      size="sm"
    >
      <div className="text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
          isConsume ? 'bg-brand-100' : 'bg-gray-100'
        }`}>
          {isConsume ? (
            <Utensils size={30} className="text-brand-600" />
          ) : (
            <Trash2 size={30} className="text-gray-500" />
          )}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-1">
          确认{ACTION_LABELS[action]}？
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          此操作将从冰箱列表中移除食物，并记录操作日志
        </p>

        <div className={`rounded-2xl p-4 mb-6 text-left ${
          isConsume ? 'bg-brand-50 border border-brand-100' : 'bg-gray-50 border border-gray-100'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
              isConsume ? 'bg-brand-100' : 'bg-white'
            }`}>
              {STORAGE_AREA_ICONS[food.storageArea]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 mb-1">{food.name}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>{STORAGE_AREA_ICONS[food.storageArea]} {STORAGE_AREA_LABELS[food.storageArea]}</span>
                <span>·</span>
                <span>归属: {food.owners.join('、')}</span>
              </div>
            </div>
          </div>
        </div>

        {!isConsume && (
          <div className="flex items-start gap-2 text-xs text-warning-600 bg-warning-50 rounded-xl p-3 mb-5">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>丢弃前请确认食物已变质，避免浪费哦～</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={closeConfirm}
            className="flex-1"
          >
            再想想
          </Button>
          <Button
            variant={isConsume ? 'primary' : 'danger'}
            onClick={handleConfirm}
            className="flex-1"
            leftIcon={isConsume ? <Utensils size={16} /> : <Trash2 size={16} />}
          >
            确认{ACTION_LABELS[action]}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
