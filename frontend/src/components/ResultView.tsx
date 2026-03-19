import React, { useState, useEffect } from 'react';
import { Download, Layers, Video, Play, Loader2, RefreshCw, AlertTriangle, Check } from 'lucide-react';

interface ResultViewProps {
  originalImage: string | null;
  generatedImage: string | null;
  generatedVideo: string | null;
  onGenerateVideo: () => void;
  isVideoGenerating: boolean;
  videoError?: string | null;
}

const ResultView: React.FC<ResultViewProps> = ({
  originalImage,
  generatedImage,
  generatedVideo,
  onGenerateVideo,
  isVideoGenerating,
  videoError
}) => {
  const [activeTab, setActiveTab] = useState<'generated' | 'original' | 'compare' | 'video'>('generated');
  const [downloadStatus, setDownloadStatus] = useState<{
    original: 'idle' | 'downloading' | 'done';
    generated: 'idle' | 'downloading' | 'done';
    video: 'idle' | 'downloading' | 'done';
  }>({
    original: 'idle',
    generated: 'idle',
    video: 'idle'
  });

  // Switch to video tab automatically when video is ready
  useEffect(() => {
    if (generatedVideo) {
      setActiveTab('video');
    }
  }, [generatedVideo]);

  if (!generatedImage) {
    return (
      <div className="w-full h-full min-h-[300px] bg-gray-50 rounded-2xl border border-gray-200 flex flex-col items-center justify-center text-gray-400 p-8">
        <Layers size={48} className="mb-4 opacity-20" />
        <p className="text-center">Generated fashion styles will appear here.</p>
      </div>
    );
  }

  const handleDownloadOriginal = async () => {
    if (originalImage) {
      setDownloadStatus(prev => ({ ...prev, original: 'downloading' }));
      const link = document.createElement('a');
      link.href = originalImage;
      link.download = `fashion-studio-original-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show completion feedback
      setTimeout(() => {
        setDownloadStatus(prev => ({ ...prev, original: 'done' }));
        setTimeout(() => {
          setDownloadStatus(prev => ({ ...prev, original: 'idle' }));
        }, 2000);
      }, 300);
    }
  };

  const handleDownloadGenerated = async () => {
    if (generatedImage) {
      setDownloadStatus(prev => ({ ...prev, generated: 'downloading' }));
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `fashion-studio-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show completion feedback
      setTimeout(() => {
        setDownloadStatus(prev => ({ ...prev, generated: 'done' }));
        setTimeout(() => {
          setDownloadStatus(prev => ({ ...prev, generated: 'idle' }));
        }, 2000);
      }, 300);
    }
  };

  const handleDownloadVideo = async () => {
    if (generatedVideo) {
      setDownloadStatus(prev => ({ ...prev, video: 'downloading' }));
      const link = document.createElement('a');
      link.href = generatedVideo;
      link.download = `fashion-studio-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show completion feedback
      setTimeout(() => {
        setDownloadStatus(prev => ({ ...prev, video: 'done' }));
        setTimeout(() => {
          setDownloadStatus(prev => ({ ...prev, video: 'idle' }));
        }, 2000);
      }, 300);
    }
  };

  const handleDownloadAll = () => {
    handleDownloadOriginal();
    setTimeout(() => handleDownloadGenerated(), 500);
  };

  // Download button component for consistent styling
  const DownloadButton: React.FC<{
    onClick: () => void;
    status: 'idle' | 'downloading' | 'done';
    label: string;
    colorClass?: string;
  }> = ({ onClick, status, label, colorClass = 'pink' }) => {
    const colorStyles = {
      pink: {
        bg: 'bg-pink-600 hover:bg-pink-700',
        done: 'bg-green-500',
        text: 'text-white'
      },
      blue: {
        bg: 'bg-blue-600 hover:bg-blue-700',
        done: 'bg-green-500',
        text: 'text-white'
      },
      gray: {
        bg: 'bg-gray-600 hover:bg-gray-700',
        done: 'bg-green-500',
        text: 'text-white'
      },
      purple: {
        bg: 'bg-purple-600 hover:bg-purple-700',
        done: 'bg-green-500',
        text: 'text-white'
      }
    };

    const colors = colorStyles[colorClass as keyof typeof colorStyles] || colorStyles.pink;

    return (
      <button
        onClick={onClick}
        disabled={status === 'downloading'}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg ${
          status === 'done'
            ? colors.done
            : status === 'downloading'
            ? 'bg-gray-400 cursor-not-allowed'
            : colors.bg
        } ${colors.text}`}
      >
        {status === 'downloading' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            다운로드 중...
          </>
        ) : status === 'done' ? (
          <>
            <Check size={16} />
            완료!
          </>
        ) : (
          <>
            <Download size={16} />
            {label}
          </>
        )}
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl mb-4 w-fit self-center">
        <button
          onClick={() => setActiveTab('original')}
          className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'original'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Original
        </button>
        <button
          onClick={() => setActiveTab('generated')}
          className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'generated'
            ? 'bg-white text-pink-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          New Look
        </button>
         <button
          onClick={() => setActiveTab('compare')}
          className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'compare'
            ? 'bg-white text-purple-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Compare
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'video'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Video size={14} />
          Street Video
        </button>
      </div>

      {/* Image/Video Container */}
      <div className="flex-grow bg-white rounded-2xl border border-gray-200 overflow-hidden relative shadow-sm min-h-[400px] flex items-center justify-center group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        {activeTab === 'generated' && (
          <div className="w-full h-full flex flex-col">
            <div className="flex-grow flex items-center justify-center p-4 relative group/image">
              <img
                src={generatedImage}
                alt="Generated Fashion"
                className="max-w-full max-h-[450px] object-contain animate-in fade-in duration-500"
              />
              {/* Hover Download Button */}
              <button
                onClick={handleDownloadGenerated}
                disabled={downloadStatus.generated === 'downloading'}
                className={`absolute top-4 right-4 opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm shadow-lg ${
                  downloadStatus.generated === 'done'
                    ? 'bg-green-500 text-white'
                    : downloadStatus.generated === 'downloading'
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-pink-600 hover:bg-pink-700 text-white'
                }`}
              >
                {downloadStatus.generated === 'downloading' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    다운로드 중...
                  </>
                ) : downloadStatus.generated === 'done' ? (
                  <>
                    <Check size={16} />
                    완료!
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    다운로드
                  </>
                )}
              </button>
            </div>
            {/* CTA for Video - Floating Button */}
            {!generatedVideo && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                <button
                  onClick={() => {
                    setActiveTab('video');
                    onGenerateVideo();
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 font-medium text-sm"
                >
                  <Video size={16} />
                  Create Street Video
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'original' && (
          <div className="w-full h-full flex flex-col">
            <div className="flex-grow flex items-center justify-center p-4 relative group/image">
              <img
                src={originalImage || ''}
                alt="Original"
                className="max-w-full max-h-[450px] object-contain"
              />
              {/* Hover Download Button */}
              <button
                onClick={handleDownloadOriginal}
                disabled={downloadStatus.original === 'downloading'}
                className={`absolute top-4 right-4 opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm shadow-lg ${
                  downloadStatus.original === 'done'
                    ? 'bg-green-500 text-white'
                    : downloadStatus.original === 'downloading'
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {downloadStatus.original === 'downloading' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    다운로드 중...
                  </>
                ) : downloadStatus.original === 'done' ? (
                  <>
                    <Check size={16} />
                    완료!
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    다운로드
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="w-full h-full flex flex-col">
            <div className="flex-grow flex items-center justify-center gap-2 p-4">
              <div className="flex-1 h-full flex flex-col items-center justify-center relative">
                <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md z-10">Original</span>
                <img
                  src={originalImage || ''}
                  alt="Original"
                  className="max-w-full max-h-[400px] object-contain rounded-lg shadow-md"
                />
              </div>
              <div className="w-px h-full bg-gray-200 mx-2"></div>
              <div className="flex-1 h-full flex flex-col items-center justify-center relative">
                <span className="absolute top-2 left-2 bg-pink-500/80 text-white text-xs px-2 py-1 rounded backdrop-blur-md z-10">Edited</span>
                <img
                  src={generatedImage || ''}
                  alt="Generated"
                  className="max-w-full max-h-[400px] object-contain rounded-lg shadow-md"
                />
              </div>
            </div>
            {/* Download Bar */}
            <div className="border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm px-4 py-3 flex items-center justify-center gap-3 flex-wrap">
              <DownloadButton
                onClick={handleDownloadOriginal}
                status={downloadStatus.original}
                label="원본 다운로드"
                colorClass="gray"
              />
              <DownloadButton
                onClick={handleDownloadGenerated}
                status={downloadStatus.generated}
                label="생성 이미지 다운로드"
                colorClass="pink"
              />
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Download size={16} />
                전체 다운로드
              </button>
            </div>
          </div>
        )}

        {activeTab === 'video' && (
          <div className="w-full h-full flex flex-col">
            {generatedVideo ? (
              <>
                <div className="flex-grow flex flex-col items-center justify-center p-4">
                  <video
                    src={generatedVideo}
                    controls
                    autoPlay
                    loop
                    className="max-w-full max-h-[400px] rounded-lg shadow-lg"
                  />
                  <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    <Video size={14} />
                    <span>AI Generated Street Fashion</span>
                  </div>
                </div>
                {/* Download Bar */}
                <div className="border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm px-4 py-3 flex items-center justify-center">
                  <DownloadButton
                    onClick={handleDownloadVideo}
                    status={downloadStatus.video}
                    label="비디오 다운로드"
                    colorClass="blue"
                  />
                </div>
              </>
            ) : isVideoGenerating ? (
              // Dedicated Loading State
              <div className="flex-grow flex flex-col items-center justify-center text-center max-w-md mx-auto p-8 animate-in fade-in duration-500">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                    <Video size={32} />
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Generating Street Video</h3>
                <p className="text-gray-500 mb-4">
                  Bring your design to life with a street fashion walking video using Veo 3.1.
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <Loader2 size={12} className="animate-spin" />
                  <span>This may take 1-2 minutes for high quality results</span>
                </div>
              </div>
            ) : videoError ? (
              // Error State with Retry
              <div className="flex-grow flex flex-col items-center justify-center text-center max-w-md mx-auto p-6">
                <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Generation Failed</h3>
                <p className="text-gray-500 mb-2 text-sm">
                  {videoError.includes('overloaded')
                    ? 'The AI model is currently busy. Please try again in a moment.'
                    : 'An error occurred while generating the video.'}
                </p>
                <p className="text-xs text-gray-400 mb-6 break-all">
                  {videoError}
                </p>
                <button
                  onClick={onGenerateVideo}
                  className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                >
                  <RefreshCw size={18} />
                  Retry Video Generation
                </button>
              </div>
            ) : (
              // Initial State (if navigated to tab manually)
              <div className="flex-grow flex flex-col items-center justify-center text-center max-w-md mx-auto p-6">
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                  <Video size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Street Video</h3>
                <p className="text-gray-500 mb-6 text-sm">
                  Bring your design to life with a street fashion walking video using Veo 3.1.
                </p>
                <button
                  onClick={onGenerateVideo}
                  className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                >
                  <Play size={18} fill="currentColor" />
                  Generate Video
                </button>
                <p className="mt-4 text-xs text-gray-400">
                  Note: Video generation is processed on the backend server.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultView;
