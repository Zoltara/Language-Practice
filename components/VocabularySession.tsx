
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VocabularyPracticeTarget, VocabularyItem, Language } from '../types';
import ProgressBar from './ProgressBar';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { generatePracticeWord, generateSpeech, checkWordTranslation } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audio';

interface VocabularySessionProps {
  topic: string;
  language: Language;
  onNext: () => void;
  progressCount: number;
  totalItems: number;
  dictionary: VocabularyItem[];
  onToggleDictionaryWord: (item: VocabularyItem) => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-0 bg-slate-800 bg-opacity-50 flex items-center justify-center rounded-xl z-20">
    <div className="w-12 h-12 border-4 border-t-emerald-400 border-r-emerald-400 border-b-emerald-400 border-l-transparent rounded-full animate-spin"></div>
  </div>
);

const VocabularySession: React.FC<VocabularySessionProps> = ({
  topic,
  language,
  onNext,
  progressCount,
  totalItems,
  dictionary,
  onToggleDictionaryWord,
}) => {
  const [currentTarget, setCurrentTarget] = useState<VocabularyPracticeTarget | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; feedback: string; correctMeaning: string; isHelpReveal?: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const fetchNewWord = useCallback(async () => {
    setIsProcessing(true);
    setFeedback(null);
    setUserAnswer('');
    setError(null);
    try {
      const wordData = await generatePracticeWord(topic, language, currentTarget?.word);
      setCurrentTarget(wordData);
    } catch (e) {
      setError('Failed to generate content.');
    } finally {
      setIsProcessing(false);
    }
  }, [topic, language, currentTarget]);

  useEffect(() => {
    fetchNewWord();
  }, []);

  const handleListen = async () => {
    if (!currentTarget || isAudioLoading) return;
    setIsAudioLoading(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = audioContextRef.current;
      if (audioContext.state === 'suspended') await audioContext.resume();

      const base64Audio = await generateSpeech(currentTarget.word, language);
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (e) {
      console.error("Audio error", e);
      setError("Audio failed.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleCheck = async () => {
    if (!userAnswer.trim() || !currentTarget) return;
    setIsProcessing(true);
    try {
      const result = await checkWordTranslation(currentTarget.word, userAnswer, language);
      setFeedback({ ...result, isHelpReveal: false });
    } catch (e) {
      setError('Check failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHelp = () => {
    if (!currentTarget) return;
    setFeedback({
      isCorrect: false,
      isHelpReveal: true,
      feedback: "Don't worry! Here is the correct meaning to help you learn.",
      correctMeaning: currentTarget.english
    });
  };

  const handleSkip = () => {
    fetchNewWord();
  };

  const langFont = language === 'Thai' ? 'font-thai' : 'font-hebrew';
  const isRTL = language === 'Hebrew';

  const getHeaderText = () => {
    if (!feedback) return '';
    if (feedback.isCorrect) return 'Excellent!';
    if (feedback.isHelpReveal) return 'Maybe Next Time';
    return 'Good try';
  };

  const getHeaderColor = () => {
    if (!feedback) return '';
    if (feedback.isCorrect) return 'text-green-400';
    if (feedback.isHelpReveal) return 'text-red-500';
    return 'text-yellow-400';
  };

  const isWordSaved = currentTarget ? dictionary.some(item => item.word === currentTarget.word) : false;

  return (
    <div className="relative animate-fade-in">
      <div className="mb-6">
        <ProgressBar current={progressCount} total={totalItems} label="Item" />
      </div>

      <div className="mb-6">
        <p className="text-sm text-slate-400">Vocab &bull; {language}</p>
        <h2 className="text-xl md:text-2xl font-semibold text-emerald-400 truncate max-w-[200px] md:max-w-none">{topic}</h2>
      </div>

      <div className="space-y-6 md:space-y-8 min-h-[400px] flex flex-col">
        {!currentTarget ? (
          <div className="flex-grow flex items-center justify-center text-slate-400 text-lg md:text-xl">Preparing...</div>
        ) : (
          <>
            <div className="bg-slate-900/60 p-6 md:p-10 rounded-2xl border border-slate-700 text-center shadow-inner relative group">
              <div className="absolute top-2 right-2 md:top-4 md:right-4 flex gap-2">
                <button
                  onClick={handleListen}
                  disabled={isAudioLoading || isProcessing}
                  className="p-2 md:p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all disabled:opacity-50"
                  title="Listen"
                >
                  {isAudioLoading ? <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <SpeakerIcon className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
              </div>
              <h3 
                className={`text-5xl md:text-8xl ${langFont} font-bold text-slate-100 mb-2 md:mb-4`}
                dir={isRTL ? "rtl" : "ltr"}
              >
                {currentTarget.word}
              </h3>
              {feedback && (
                <p className="text-xl md:text-2xl font-medium text-cyan-400 animate-fade-in">{currentTarget.phonetic}</p>
              )}
            </div>

            <div className="space-y-2 md:space-y-4">
              <label className="block text-sm md:text-lg font-semibold text-slate-400 ml-1">
                {language === 'Hebrew' ? 'Translate to English or Thai:' : 'Translate to English:'}
              </label>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={!!feedback || isProcessing}
                placeholder={language === 'Hebrew' ? "Meaning in English or Thai..." : "Meaning in English..."}
                className="w-full bg-slate-700/50 border-2 border-slate-600 rounded-xl p-3 md:p-5 text-lg md:text-2xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              />
            </div>

            {feedback && (
              <div className={`p-5 md:p-6 rounded-xl border-l-4 animate-fade-in-up ${feedback.isCorrect ? 'bg-green-900/20 border-green-500' : (feedback.isHelpReveal ? 'bg-red-900/20 border-red-500' : 'bg-yellow-900/20 border-yellow-500')}`}>
                <h4 className={`text-lg md:text-xl font-bold mb-1 md:mb-2 ${getHeaderColor()}`}>
                  {getHeaderText()}
                </h4>
                <p className="text-slate-200 text-base md:text-lg mb-3 md:mb-4">{feedback.feedback}</p>
                <div className="bg-slate-800/50 p-3 md:p-4 rounded-lg">
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Correct Meaning</span>
                  <span className="text-lg md:text-xl text-emerald-400 font-bold whitespace-pre-line">{feedback.correctMeaning}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              {feedback ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => onToggleDictionaryWord({ word: currentTarget.word, english: feedback.correctMeaning })}
                    className={`py-3 md:py-5 px-6 rounded-xl font-bold text-base md:text-xl transition-all ${
                      isWordSaved ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    {isWordSaved ? 'Saved' : 'Save to Dictionary'}
                  </button>
                  <button
                    onClick={() => { onNext(); fetchNewWord(); }}
                    className="py-3 md:py-5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base md:text-xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Next
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                   <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleSkip}
                      disabled={isProcessing}
                      className="py-3 md:py-4 rounded-xl border-2 border-slate-700 hover:border-slate-600 text-slate-400 font-bold text-base md:text-xl transition-all"
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleHelp}
                      disabled={isProcessing}
                      className="py-3 md:py-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-base md:text-xl transition-all"
                    >
                      Help me
                    </button>
                   </div>
                  <button
                    onClick={handleCheck}
                    disabled={isProcessing || !userAnswer.trim()}
                    className="w-full py-3 md:py-5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base md:text-xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {isProcessing ? 'Checking...' : 'Check Translation'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {isProcessing && <LoadingSpinner />}
      {error && <div className="mt-4 text-center text-red-400 font-bold">{error}</div>}
    </div>
  );
};

export default VocabularySession;
