import React, { useState } from 'react';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import StyleInput from './components/StyleInput';
import ModelSelector from './components/ModelSelector';
import ResultView from './components/ResultView';
import {
  generateFashionEdit,
  generateFashionVideo,
  pollVideoUntilComplete,
} from './services/apiService';
import { AlertCircle, Camera, Sparkles } from 'lucide-react';
import type { ImageModelId, VideoModelId } from './types';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [appliedPrompt, setAppliedPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [videoLoading, setVideoLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [imageModel, setImageModel] = useState<ImageModelId>('gemini-3-pro-image-preview');
  const [videoModel, setVideoModel] = useState<VideoModelId>('veo-3.1-fast-generate-preview');

  const handleImageSelect = (base64: string) => {
    setOriginalImage(base64);
    setGeneratedImage(null);
    setGeneratedVideo(null);
    setError(null);
  };

  const handleReferenceImagesSelect = (images: string[]) => {
    setReferenceImages(images);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!originalImage) return;

    setLoading(true);
    setError(null);
    setGeneratedVideo(null);

    try {
      const result = await generateFashionEdit(originalImage, prompt, referenceImages, imageModel);
      setGeneratedImage(result);
      setAppliedPrompt(prompt);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Style design failed. Please try again.';
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    const promptToUse = appliedPrompt || prompt;
    const finalPrompt = promptToUse || 'high quality street fashion, cinematic lighting, 4k';

    if (!generatedImage) return;

    setVideoLoading(true);
    setVideoError(null);

    try {
      const operationId = await generateFashionVideo(generatedImage, finalPrompt, videoModel);
      const videoUrl = await pollVideoUntilComplete(operationId, undefined, 10000, 30);
      setGeneratedVideo(videoUrl);
      setVideoError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Video production failed.';
      setVideoError(errorMessage);
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffafa] font-sans selection:bg-pink-100 selection:text-pink-600">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-bold uppercase tracking-widest mb-4 border border-pink-100">
            <Sparkles size={12} />
            AI Street Fashion
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Fashion <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Studio</span>
          </h2>
          <p className="text-slate-500 text-lg sm:text-xl leading-relaxed">
            Try on any style and see yourself walking the streets with AI-powered fashion simulation.
          </p>
        </div>

        {error && (
          <div className="mb-8 max-w-2xl mx-auto bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm animate-bounce-short">
            <AlertCircle size={24} className="flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-pink-100/20 border border-pink-50 transition-all hover:shadow-2xl hover:shadow-pink-100/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Canvas</h3>
                <Camera size={18} className="text-slate-300" />
              </div>
              <div className="space-y-6">
                <div className="h-72">
                  <ImageUpload
                    onImageSelect={handleImageSelect}
                    currentImage={originalImage}
                    label="Your Photo"
                    subLabel="Upload your full-body photo"
                  />
                </div>
                <div className="h-72">
                  <ImageUpload
                    onImagesSelect={handleReferenceImagesSelect}
                    currentImages={referenceImages}
                    multiple={true}
                    maxImages={5}
                    label="Style Reference"
                    subLabel="Optional clothing references (max 5)"
                  />
                </div>
              </div>

              <div className="mt-6">
                <ModelSelector
                  imageModel={imageModel}
                  videoModel={videoModel}
                  onImageModelChange={setImageModel}
                  onVideoModelChange={setVideoModel}
                />
              </div>

              <div className="mt-6">
                <StyleInput
                  prompt={prompt}
                  setPrompt={setPrompt}
                  onGenerate={handleGenerate}
                  isGenerating={loading}
                  disabled={!originalImage}
                />
              </div>
            </section>
          </div>

          <div className="lg:col-span-7 h-full">
            <section className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 h-full min-h-[700px] flex flex-col sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Showcase</h3>
                <div className="flex gap-2">
                  {generatedImage && <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />}
                  {generatedVideo && <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />}
                </div>
              </div>
              <div className="flex-grow flex flex-col">
                <ResultView
                  originalImage={originalImage}
                  generatedImage={generatedImage}
                  generatedVideo={generatedVideo}
                  onGenerateVideo={handleGenerateVideo}
                  isVideoGenerating={videoLoading}
                  videoError={videoError}
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
