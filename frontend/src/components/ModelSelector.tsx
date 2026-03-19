import React from 'react';
import { Cpu } from 'lucide-react';
import { IMAGE_MODELS, VIDEO_MODELS } from '../types';
import type { ImageModelId, VideoModelId } from '../types';

interface ModelSelectorProps {
  imageModel: ImageModelId;
  videoModel: VideoModelId;
  onImageModelChange: (model: ImageModelId) => void;
  onVideoModelChange: (model: VideoModelId) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  imageModel,
  videoModel,
  onImageModelChange,
  onVideoModelChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <Cpu size={14} />
        <span>AI Models</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Image Model</label>
          <select
            value={imageModel}
            onChange={(e) => onImageModelChange(e.target.value as ImageModelId)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-300 transition-all"
          >
            {Object.entries(IMAGE_MODELS).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Video Model</label>
          <select
            value={videoModel}
            onChange={(e) => onVideoModelChange(e.target.value as VideoModelId)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
          >
            {Object.entries(VIDEO_MODELS).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
