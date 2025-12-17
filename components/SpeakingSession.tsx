
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PronunciationFeedback, VocabularyPracticeTarget, VocabularyItem } from '../types';
import ProgressBar from './ProgressBar';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { StopIcon } from './icons/StopIcon';
import { generatePracticeWord, evaluatePronunciation, generateSpeech } from '../services/geminiService';
import { blobToBase64, decode, decodeAudioData } from '../utils/audio';

interface SpeakingSessionProps {
  topic: string;
  onNext: () => void;
  progressCount: number;
  totalItems: number;
  onToggleDictionaryWord: (item: VocabularyItem) => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-0 bg-slate-800 bg-opacity-50 flex items-center justify-center rounded-xl z-20">
    <div className="w-12 h-12 border-4 border-t-cyan-400 border-r-cyan-400 border-b-cyan-400 border-l-transparent rounded-full animate-spin"></div>
  </div>
);

const SpeakingSession: React.FC<SpeakingSessionProps> = ({
  topic,
  onNext,
  progressCount,
  totalItems,
  onToggleDictionaryWord
}) => {
  const [currentTarget, setCurrentTarget] = useState<VocabularyPracticeTarget | null>(null);
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const fetchNewWord = useCallback(async () => {
    setIsProcessing(true);
    setFeedback(null);
    setError(null);
    try {
      const word = await generatePracticeWord(topic, currentTarget?.thai);
      setCurrentTarget(word);
    } catch (e) {
      setError('Failed to generate a new word.');
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  }, [topic, currentTarget]);

  useEffect(() => {
    fetchNewWord();
    // Cleanup function to stop tracks if unmounting while recording
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Only run once on mount (fetchNewWord handles subsequent calls via next button)

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (e) {
      setError('Could not access microphone. Please allow permissions.');
      console.error(e);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    if (!currentTarget) return;
    setIsProcessing(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const result = await evaluatePronunciation(currentTarget.thai, base64Audio, 'audio/webm');
      setFeedback(result);
    } catch (e) {
      setError('Failed to evaluate pronunciation. Try again.');
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleListen = async () => {
    if (!currentTarget || isAudioLoading) return;
    setIsAudioLoading(true);
    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioContext = audioContextRef.current;
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const base64Audio = await generateSpeech(currentTarget.thai);
        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
    } catch (e) {
      console.error("Audio playback error", e);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleNext = () => {
    onNext();
    fetchNewWord();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="relative animate-fade-in">
      <div className="mb-6">
        <ProgressBar current={progressCount} total={totalItems} />
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-slate-400">Pronunciation Practice</p>
          <h2 className="text-xl font-semibold text-violet-400">{topic}</h2>
        </div>
      </div>

      <div className="text-center space-y-8 min-h-[300px] flex flex-col justify-center">
        {!currentTarget ? (
           <div className="text-slate-400">Loading word...</div>
        ) : (
          <>
            <div className="space-y-2">
              <h3 className="text-5xl md:text-6xl font-thai font-bold text-slate-100">{currentTarget.thai}</h3>
              <p className="text-xl text-cyan-400">{currentTarget.phonetic}</p>
              <p className="text-slate-400">{currentTarget.english}</p>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-6 items-center">
              <button
                onClick={handleListen}
                disabled={isAudioLoading || isRecording}
                className="flex flex-col items-center gap-2 group"
                title="Listen to pronunciation"
              >
                <div className="p-4 rounded-full bg-slate-700 hover:bg-slate-600 transition-all shadow-lg group-disabled:opacity-50">
                   {isAudioLoading ? (
                        <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                   ) : (
                       <SpeakerIcon className="w-6 h-6 text-slate-200" />
                   )}
                </div>
                <span className="text-xs text-slate-400 font-medium">Listen</span>
              </button>

              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isProcessing || isAudioLoading}
                className={`flex flex-col items-center gap-2 group transition-all transform ${isRecording ? 'scale-110' : 'hover:scale-105'}`}
              >
                <div className={`p-6 rounded-full shadow-xl transition-all ${
                  isRecording ? 'bg-red-500 animate-pulse ring-4 ring-red-500/30' : 'bg-violet-500 hover:bg-violet-600'
                }`}>
                  {isRecording ? (
                    <StopIcon className="w-8 h-8 text-white" />
                  ) : (
                    <MicrophoneIcon className="w-8 h-8 text-white" />
                  )}
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {isRecording ? 'Stop' : 'Record'}
                </span>
              </button>
            </div>

            {/* Error Message */}
            {error && <p className="text-red-400 text-sm animate-fade-in">{error}</p>}

            {/* Feedback Section */}
            {feedback && (
              <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700 animate-fade-in-up">
                <div className="flex flex-col items-center mb-4">
                  <span className="text-slate-400 text-sm uppercase tracking-wider font-semibold mb-1">Score</span>
                  <div className={`text-4xl font-bold ${getScoreColor(feedback.score)}`}>
                    {feedback.score}/100
                  </div>
                </div>
                
                <div className="text-left space-y-3">
                    <div className="p-3 bg-slate-800/50 rounded border-l-4 border-violet-500">
                        <p className="text-slate-300 text-sm">{feedback.feedback}</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded border-l-4 border-cyan-500">
                         <span className="text-xs font-bold text-cyan-400 block mb-1">TIP</span>
                        <p className="text-slate-300 text-sm">{feedback.tips}</p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={() => onToggleDictionaryWord({ thai: currentTarget.thai, english: currentTarget.english })}
                        className="flex-1 py-3 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold transition-colors"
                    >
                        Save Word
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex-1 py-3 px-4 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-bold transition-colors shadow-lg shadow-violet-500/20"
                    >
                        Next Word
                    </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {(isProcessing) && <LoadingSpinner />}
    </div>
  );
};

export default SpeakingSession;
