
import React, { useState, useCallback, useRef, useEffect } from 'react';
import TopicSelector from './components/TopicSelector';
import PracticeSession from './components/PracticeSession';
import SpeakingSession from './components/SpeakingSession';
import SessionComplete from './components/SessionComplete';
import DictionaryView from './components/DictionaryView';
import { Feedback, VocabularyItem, PracticeMode } from './types';
import { generateParagraph, checkTranslation, generateSpeech } from './services/geminiService';
import { BookOpenIcon } from './components/icons/BookOpenIcon';
import { BookmarkIcon } from './components/icons/BookmarkIcon';
import { HomeIcon } from './components/icons/HomeIcon';
import { SESSION_LENGTH } from './constants';
import { decode, decodeAudioData } from './utils/audio';


const App: React.FC = () => {
  const [topic, setTopic] = useState<string | null>(null);
  const [mode, setMode] = useState<PracticeMode>('reading');
  const [currentParagraph, setCurrentParagraph] = useState<string>('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [progressCount, setProgressCount] = useState(0);
  const [dictionary, setDictionary] = useState<VocabularyItem[]>([]);
  const [isDictionaryVisible, setIsDictionaryVisible] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      const savedDictionary = localStorage.getItem('thaiPracticeDictionary');
      if (savedDictionary) {
        setDictionary(JSON.parse(savedDictionary));
      }
    } catch (error) {
      console.error("Could not load dictionary from localStorage:", error);
    }
  }, []);

  const handleToggleDictionaryWord = (item: VocabularyItem) => {
    setDictionary(prevDictionary => {
      const isSaved = prevDictionary.some(word => word.thai === item.thai);
      let newDictionary;
      if (isSaved) {
        newDictionary = prevDictionary.filter(word => word.thai !== item.thai);
      } else {
        newDictionary = [...prevDictionary, item];
      }
      try {
        localStorage.setItem('thaiPracticeDictionary', JSON.stringify(newDictionary));
      } catch (error) {
        console.error("Could not save dictionary to localStorage:", error);
      }
      return newDictionary;
    });
  };

  const handleNewParagraph = useCallback(async (selectedTopic: string) => {
    setIsLoading(true);
    setError(null);
    setFeedback(null);
    setUserTranslation('');
    try {
      const paragraph = await generateParagraph(selectedTopic, currentParagraph);
      setCurrentParagraph(paragraph);
    } catch (e) {
      setError('Failed to generate a new paragraph. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [currentParagraph]);

  const handleTopicSelect = (selectedTopic: string, selectedMode: PracticeMode) => {
    setTopic(selectedTopic);
    setMode(selectedMode);
    setProgressCount(1);
    
    if (selectedMode === 'reading') {
      handleNewParagraph(selectedTopic);
    }
    // Speaking mode fetches its first word inside the component on mount
  };

  const handleSubmitTranslation = async () => {
    if (!userTranslation.trim() || !topic) return;
    setIsLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const result = await checkTranslation(currentParagraph, userTranslation);
      setFeedback(result);
    } catch (e)
    {
      setError('Failed to get feedback. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (topic) {
      const newProgressCount = progressCount + 1;
      setProgressCount(newProgressCount);
      if (newProgressCount <= SESSION_LENGTH && mode === 'reading') {
        handleNewParagraph(topic);
      }
    }
  };

  const handleListen = async () => {
    if (!currentParagraph || isAudioLoading) return;

    setIsAudioLoading(true);
    setError(null);

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = audioContextRef.current;
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const base64Audio = await generateSpeech(currentParagraph);
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();

    } catch (e) {
        setError('Failed to play audio. Please try again.');
        console.error(e);
    } finally {
        setIsAudioLoading(false);
    }
  };

  const resetSession = () => {
    setTopic(null);
    setCurrentParagraph('');
    setFeedback(null);
    setIsLoading(false);
    setError(null);
    setUserTranslation('');
    setProgressCount(0);
    // Mode defaults back to reading or stays same? Let's keep last selection logic in selector state, but here just reset
  };

  const renderContent = () => {
    if (!topic) {
      return <TopicSelector onTopicSelect={handleTopicSelect} />;
    }
    
    if (progressCount > SESSION_LENGTH) {
        return <SessionComplete topic={topic} />;
    }

    if (mode === 'speaking') {
      return (
        <SpeakingSession
          topic={topic}
          onNext={handleNext}
          progressCount={progressCount}
          totalItems={SESSION_LENGTH}
          onToggleDictionaryWord={handleToggleDictionaryWord}
        />
      );
    }

    return (
      <PracticeSession
        topic={topic}
        currentParagraph={currentParagraph}
        feedback={feedback}
        isLoading={isLoading}
        isAudioLoading={isAudioLoading}
        error={error}
        userTranslation={userTranslation}
        setUserTranslation={setUserTranslation}
        onSubmit={handleSubmitTranslation}
        onNext={handleNext}
        onListen={handleListen}
        progressCount={progressCount}
        totalParagraphs={SESSION_LENGTH}
        dictionary={dictionary}
        onToggleDictionaryWord={handleToggleDictionaryWord}
      />
    );
  };

  return (
    <>
      <DictionaryView 
        isVisible={isDictionaryVisible}
        dictionary={dictionary}
        onClose={() => setIsDictionaryVisible(false)}
        onToggleWord={handleToggleDictionaryWord}
      />
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 pb-24">
        <div className="w-full max-w-3xl mx-auto">
          <header className="flex justify-center items-center mb-8 w-full">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <BookOpenIcon className="w-8 h-8 text-cyan-400" />
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-violet-500 text-transparent bg-clip-text whitespace-nowrap">
                  Thai Practice
                </h1>
              </div>
              <p className="text-slate-400">Hone your Thai reading and speaking skills with AI.</p>
            </div>
          </header>

          <main className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-slate-950/50 p-6 md:p-8 border border-slate-700">
            {renderContent()}
          </main>
        </div>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700">
        <div className="max-w-3xl mx-auto p-3 flex justify-center items-center gap-4">
            {topic && (
                <button 
                    onClick={resetSession}
                    className="flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-cyan-400 transition-colors w-24"
                >
                    <HomeIcon className="w-6 h-6" />
                    <span className="text-xs font-medium">Home</span>
                </button>
            )}
            <button 
                onClick={() => setIsDictionaryVisible(true)}
                className="flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-cyan-400 transition-colors w-24"
            >
                <BookmarkIcon className="w-6 h-6" />
                <span className="text-xs font-medium">My Dictionary</span>
            </button>
        </div>
      </footer>
    </>
  );
};

export default App;
