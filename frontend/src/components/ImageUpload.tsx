import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { fileToBase64 } from '../utils/imageUtils';

const IS_PRODUCTION = import.meta.env.PROD;

interface ImageUploadProps {
  // 단일 이미지 모드
  onImageSelect?: (base64: string) => void;
  currentImage?: string | null;
  // 다중 이미지 모드
  onImagesSelect?: (images: string[]) => void;
  currentImages?: string[];
  multiple?: boolean;
  maxImages?: number;
  // 공통
  label?: string;
  subLabel?: string;
  compact?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  currentImage,
  onImagesSelect,
  currentImages = [],
  multiple = false,
  maxImages = 5,
  label = "Upload Image",
  subLabel = "Click to browse or drag image here",
  compact = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  // 파일들을 Base64로 변환하여 처리
  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    try {
      if (multiple && onImagesSelect) {
        // 다중 이미지 모드
        const remainingSlots = maxImages - currentImages.length;
        const filesToProcess = imageFiles.slice(0, remainingSlots);

        const base64Results = await Promise.all(
          filesToProcess.map(file => fileToBase64(file))
        );

        onImagesSelect([...currentImages, ...base64Results]);
      } else if (onImageSelect) {
        // 단일 이미지 모드
        const base64 = await fileToBase64(imageFiles[0]);
        onImageSelect(base64);
      }
    } catch (error) {
      if (!IS_PRODUCTION) {
        console.error("Error processing files:", error);
      }
    }
  }, [multiple, onImagesSelect, onImageSelect, currentImages, maxImages]);

  // 파일 선택 핸들러
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await processFiles(files);
      // 입력 초기화 (같은 파일 재선택 가능하도록)
      event.target.value = '';
    }
  }, [processFiles]);

  // Drag & Drop 핸들러
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  }, [processFiles]);

  // Paste 핸들러
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      await processFiles(imageFiles);
    }
  }, [processFiles]);

  // Paste 이벤트 리스너 등록
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 전역 paste 이벤트를 감지하되, 컴포넌트에 포커스가 있을 때만 처리
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // 컴포넌트가 호버 상태이거나 포커스가 있을 때만 처리
      if (container.matches(':hover') || container.contains(document.activeElement)) {
        handlePaste(e);
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [handlePaste]);

  // 개별 이미지 삭제 핸들러 (다중 이미지 모드)
  const handleRemoveImage = useCallback((indexToRemove: number) => {
    if (multiple && onImagesSelect) {
      const newImages = currentImages.filter((_, index) => index !== indexToRemove);
      onImagesSelect(newImages);
    }
  }, [multiple, onImagesSelect, currentImages]);

  // 단일 이미지 모드에서 이미지가 있는 경우의 display 이미지
  const displayImage = multiple ? null : currentImage;
  const hasImages = multiple ? currentImages.length > 0 : !!currentImage;
  const canAddMore = multiple ? currentImages.length < maxImages : !currentImage;

  const containerClasses = `w-full h-full ${compact ? 'min-h-[180px]' : 'min-h-[300px]'} bg-slate-50 rounded-2xl border-2 border-dashed transition-all relative overflow-hidden group flex flex-col ${
    isDragging
      ? 'border-pink-500 bg-pink-50 ring-4 ring-pink-200'
      : 'border-slate-200 hover:border-pink-400'
  }`;

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      tabIndex={0}
    >
      {/* 드래그 오버레이 */}
      {isDragging && (
        <div className="absolute inset-0 bg-pink-100/80 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <Upload size={48} className="mx-auto text-pink-500 mb-2 animate-bounce" />
            <p className="text-pink-600 font-semibold">Drop images here</p>
          </div>
        </div>
      )}

      {/* 다중 이미지 모드 */}
      {multiple ? (
        <div className="w-full h-full p-3 flex flex-col">
          {currentImages.length > 0 ? (
            <>
              {/* 이미지 그리드 */}
              <div className="flex-1 overflow-x-auto">
                <div className="flex gap-2 h-full">
                  {currentImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative flex-shrink-0 h-full aspect-square bg-white rounded-xl border border-slate-200 overflow-hidden group/item"
                    >
                      <img
                        src={image}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-rose-600 shadow-lg"
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {/* 추가 버튼 */}
                  {canAddMore && (
                    <label className="relative flex-shrink-0 h-full aspect-square bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 hover:border-pink-400 hover:bg-pink-50 cursor-pointer flex items-center justify-center transition-colors">
                      <div className="text-center">
                        <Upload size={compact ? 16 : 20} className="mx-auto text-slate-400 mb-1" />
                        <span className="text-xs text-slate-500">Add</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* 힌트 텍스트 */}
              <div className="mt-2 text-center">
                <p className="text-xs text-slate-400">
                  {currentImages.length}/{maxImages} images • Drag & Drop or Ctrl+V to paste
                </p>
              </div>
            </>
          ) : (
            /* 빈 상태 - 업로드 영역 */
            <label className="cursor-pointer flex flex-col items-center gap-2 w-full h-full justify-center z-10">
              <div className={`bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform ${compact ? 'w-10 h-10' : 'w-16 h-16'}`}>
                <ImageIcon size={compact ? 20 : 32} />
              </div>
              <div className="space-y-0.5 text-center">
                <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-semibold text-slate-900`}>{label}</h3>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-slate-500`}>{subLabel}</p>
                <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-slate-400 mt-1`}>
                  Drag & Drop • Ctrl+V to paste
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>
      ) : (
        /* 단일 이미지 모드 */
        <>
          {displayImage ? (
            <>
              <img
                src={displayImage}
                alt="Uploaded"
                className="w-full h-full object-contain absolute inset-0 z-0 p-2"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 backdrop-blur-sm">
                <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-full font-medium shadow-lg hover:bg-pink-50 transition-colors flex items-center gap-2">
                  <Upload size={16} />
                  Change Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </>
          ) : (
            <label className="cursor-pointer flex flex-col items-center gap-2 w-full h-full justify-center z-10 p-4 text-center">
              <div className={`bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform ${compact ? 'w-10 h-10' : 'w-16 h-16'}`}>
                <ImageIcon size={compact ? 20 : 32} />
              </div>
              <div className="space-y-0.5">
                <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-semibold text-slate-900`}>{label}</h3>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-slate-500`}>{subLabel}</p>
                <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-slate-400 mt-1`}>
                  Drag & Drop • Ctrl+V to paste
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          )}
        </>
      )}
    </div>
  );
};

export default ImageUpload;
