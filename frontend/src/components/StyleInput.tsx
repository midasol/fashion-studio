import React, { useState } from 'react';
import { Wand2, ChevronDown, ChevronUp } from 'lucide-react';

interface StyleInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

const StyleInput: React.FC<StyleInputProps> = ({
  prompt,
  setPrompt,
  onGenerate,
  isGenerating,
  disabled,
}) => {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors cursor-pointer"
      >
        <span>Style Description</span>
        {isDescriptionOpen ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>

      {isDescriptionOpen && (
        <div className="group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the outfit, color, material, and accessories..."
            className="w-full min-h-[120px] p-5 rounded-3xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-pink-100 focus:border-pink-300 transition-all resize-none shadow-inner"
          />
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={disabled || isGenerating}
        className={`w-full px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
          disabled || isGenerating
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            : 'bg-slate-900 text-white hover:bg-pink-600 hover:-translate-y-1 active:translate-y-0 active:scale-95'
        }`}
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 size={16} />
            Apply Style
          </>
        )}
      </button>
    </div>
  );
};

export default StyleInput;
