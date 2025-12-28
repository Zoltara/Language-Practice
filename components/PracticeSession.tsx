
import React, { useState } from 'react';
import { Feedback, VocabularyItem, Language } from '../types';
import FeedbackDisplay from './FeedbackDisplay';
import ProgressBar from './ProgressBar';
import VocabularyList from './VocabularyList';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';

interface PracticeSessionProps {
  topic: string;
  language: Language;
  currentParagraph: string;
  feedback: Feedback | null;
  isLoading: boolean;
  isAudioLoading: boolean;
  error: string | null;
  userTranslation: string;
  setUserTranslation: (value: string) => void;
  onSubmit: () => void;
  onHelp: () => void;
  onNext: () => void;
  onSkip: () => void;
  onListen: () => void;
  progressCount: number;
  totalParagraphs: number;
  dictionary: VocabularyItem[];
  onToggleDictionaryWord: (item: VocabularyItem) => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-0 bg-slate-800 bg-opacity-50 flex items-center justify-center rounded-xl z-20">
    <div className="w-12 h-12 border-4 border-t-cyan-400 border-r-cyan-400 border-b-cyan-400 border-l-transparent rounded-full animate-spin"></div>
  </div>
);

const PracticeSession: React.FC<PracticeSessionProps> = ({
  topic,
  language,
  currentParagraph,
  feedback,
  isLoading,
  isAudioLoading,
  error,
  userTranslation,
  setUserTranslation,
  onSubmit,
  onHelp,
  onNext,
  onSkip,
  onListen,
  progressCount,
  totalParagraphs,
  dictionary,
  onToggleDictionaryWord,
}) => {
  const [showVocabulary, setShowVocabulary] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!feedback) {
        onSubmit();
      }
    }
  };

  const handleNextParagraph = () => {
    setShowVocabulary(false);
    onNext();
  };

  const isRTL = language === 'Hebrew';
  const langFont = language === 'Thai' ? 'font-thai' : 'font-hebrew';

  return (
    <div className="relative animate-fade-in">
      <div className="mb-6">
        <ProgressBar current={progressCount} total={totalParagraphs} label="Item" />
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-slate-400">Practice &bull; {language}</p>
          <h2 className="text-xl md:text-2xl font-semibold text-cyan-400 truncate max-w-[200px] md:max-w-none">{topic}</h2>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm md:text-base font-medium text-slate-400">
              {language} Content:
            </label>
            <div className="flex gap-2">
              <button
                onClick={onListen}
                disabled={isAudioLoading || isLoading || !currentParagraph}
                className="flex items-center gap-2 text-sm md:text-base px-3 md:px-4 py-1.5 md:py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAudioLoading ? (
                  <span className="w-4 h-4 md:w-5 md:h-5 border-2 border-t-slate-400 border-r-slate-400 border-b-slate-400 border-l-transparent rounded-full animate-spin"></span>
                ) : (
                  <SpeakerIcon className="w-4 h-4 md:w-5 md:h-5" />
                )}
                <span>Listen</span>
              </button>
            </div>
          </div>
          <div className="bg-slate-900/70 p-5 md:p-6 rounded-lg min-h-[120px] flex items-center justify-center text-center">
            <p 
              className={`${langFont} text-xl md:text-3xl leading-relaxed tracking-wide text-slate-100`}
              dir={isRTL ? "rtl" : "ltr"}
            >
              {currentParagraph || '...'}
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="translation" className="block text-sm md:text-base font-medium text-slate-400 mb-2">
            {language === 'Hebrew' ? 'Your understanding in English or Thai:' : 'Your understanding in English:'}
          </label>
          <textarea
            id="translation"
            value={userTranslation}
            onChange={(e) => setUserTranslation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'Hebrew' ? "Type meaning in English or Thai..." : "Type meaning in English..."}
            rows={3}
            className="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg p-3 md:p-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-colors text-slate-200 text-base md:text-lg disabled:opacity-50"
            disabled={!!feedback || isLoading}
          />
        </div>

        {error && <p className="text-red-400 text-center text-base md:text-lg">{error}</p>}
        
        {feedback && <FeedbackDisplay feedback={feedback} />}

        {feedback && showVocabulary && (
          <VocabularyList 
            vocabulary={feedback.vocabulary} 
            dictionary={dictionary}
            language={language}
            onToggleWord={onToggleDictionaryWord}
          />
        )}

        <div className="pt-2">
          {feedback ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <button
                onClick={() => setShowVocabulary(!showVocabulary)}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 text-slate-100 font-bold py-3 md:py-4 px-6 rounded-lg transition-all text-base md:text-lg"
              >
                <ListBulletIcon className="w-5 h-5 md:w-6 md:h-6" />
                <span>{showVocabulary ? 'Hide' : 'View'} Vocabulary</span>
              </button>
              <button
                onClick={handleNextParagraph}
                disabled={isLoading}
                className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 md:py-4 px-6 rounded-lg transition-all text-base md:text-lg"
              >
                {isLoading ? 'Loading...' : 'Next'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onSkip}
                  disabled={isLoading}
                  className="py-3 md:py-4 rounded-lg border-2 border-slate-600 hover:border-slate-500 text-slate-400 font-bold text-base md:text-lg transition-all disabled:opacity-50"
                >
                  Skip
                </button>
                <button
                  onClick={onHelp}
                  disabled={isLoading}
                  className="py-3 md:py-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-base md:text-lg transition-all disabled:opacity-50"
                >
                  Help me
                </button>
              </div>
              <button
                onClick={onSubmit}
                disabled={isLoading || !userTranslation.trim()}
                className="w-full bg-violet-500 hover:bg-violet-600 text-white font-bold py-3 md:py-4 px-6 rounded-lg transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 text-base md:text-lg"
              >
                {isLoading ? 'Checking...' : 'Check My Answer'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {isLoading && <LoadingSpinner />}
    </div>
  );
};

export default PracticeSession;
