import { useState, useEffect } from 'react';
import { Package, Calendar, Clock, MapPin, User } from 'lucide-react';
import type { FoodFormData, StorageArea } from '@/types';
import { STORAGE_AREA_LABELS } from '@/types';
import { useAppStore } from '@/store';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { getTodayString } from '@/utils/date';

interface FoodFormProps {
  open: boolean;
  onClose: () => void;
}

export function FoodForm({ open, onClose }: FoodFormProps) {
  const { roommates, currentUser, addFood } = useAppStore();

  const initialData: FoodFormData = {
    name: '',
    purchaseDate: getTodayString(),
    shelfLifeDays: 7,
    storageArea: 'fridge',
    owner: currentUser,
  };

  const [formData, setFormData] = useState<FoodFormData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof FoodFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({ ...initialData, owner: currentUser });
      setErrors({});
    }
  }, [open, currentUser]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FoodFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入食物名称';
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = '请选择购买日期';
    }

    if (formData.shelfLifeDays <= 0 || isNaN(Number(formData.shelfLifeDays))) {
      newErrors.shelfLifeDays = '保质期必须大于0';
    }

    if (formData.shelfLifeDays > 3650) {
      newErrors.shelfLifeDays = '保质期过长，请检查';
    }

    if (!formData.owner) {
      newErrors.owner = '请选择归属人';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setTimeout(() => {
      addFood({
        ...formData,
        name: formData.name.trim(),
        shelfLifeDays: Number(formData.shelfLifeDays),
      });
      setSubmitting(false);
    }, 300);
  };

  const updateField = <K extends keyof FoodFormData>(field: K, value: FoodFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const storageAreas: { value: StorageArea; emoji: string; label: string }[] = [
    { value: 'fridge', emoji: '❄️', label: '冷藏' },
    { value: 'freezer', emoji: '🧊', label: '冷冻' },
    { value: 'door', emoji: '🚪', label: '门架' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="登记新食物"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Package size={16} className="text-brand-500" />
            食物名称
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="例如：鲜牛奶、土鸡蛋..."
            className={`input-base ${errors.name ? 'border-danger-400 focus:ring-danger-400' : ''}`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-danger-500">{errors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Calendar size={16} className="text-brand-500" />
              购买日期
            </label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => updateField('purchaseDate', e.target.value)}
              max={getTodayString()}
              className={`input-base ${errors.purchaseDate ? 'border-danger-400 focus:ring-danger-400' : ''}`}
            />
            {errors.purchaseDate && (
              <p className="mt-1 text-xs text-danger-500">{errors.purchaseDate}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Clock size={16} className="text-brand-500" />
              保质期 (天)
            </label>
            <input
              type="number"
              min={1}
              max={3650}
              value={formData.shelfLifeDays}
              onChange={(e) => updateField('shelfLifeDays', parseInt(e.target.value) || 0)}
              className={`input-base ${errors.shelfLifeDays ? 'border-danger-400 focus:ring-danger-400' : ''}`}
            />
            {errors.shelfLifeDays && (
              <p className="mt-1 text-xs text-danger-500">{errors.shelfLifeDays}</p>
            )}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <MapPin size={16} className="text-brand-500" />
            存放区域
          </label>
          <div className="grid grid-cols-3 gap-2">
            {storageAreas.map(area => (
              <button
                key={area.value}
                type="button"
                onClick={() => updateField('storageArea', area.value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                  formData.storageArea === area.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{area.emoji}</span>
                <span className="text-xs font-semibold">{area.label}</span>
              </button>
            ))}
          </div>
          <input type="hidden" value={STORAGE_AREA_LABELS[formData.storageArea]} />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <User size={16} className="text-brand-500" />
            归属人
          </label>
          <select
            value={formData.owner}
            onChange={(e) => updateField('owner', e.target.value)}
            className={`select-base ${errors.owner ? 'border-danger-400 focus:ring-danger-400' : ''}`}
          >
            {roommates.map(roommate => (
              <option key={roommate.name} value={roommate.name}>
                {roommate.avatar} {roommate.name}
              </option>
            ))}
          </select>
          {errors.owner && (
            <p className="mt-1 text-xs text-danger-500">{errors.owner}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={submitting}
          >
            {submitting ? '保存中...' : '确认添加'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
