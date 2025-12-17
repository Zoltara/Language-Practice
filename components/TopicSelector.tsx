
import React, { useState } from 'react';
import { TOPICS } from '../constants';
import { PracticeMode } from '../types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';

interface TopicSelectorProps {
  onTopicSelect: (topic: string, mode: PracticeMode) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ onTopicSelect }) => {
  const [customTopic, setCustomTopic] = useState('');
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('reading');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTopic.trim()) {
      onTopicSelect(customTopic.trim(), selectedMode);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <SparklesIcon className="w-8 h-8 mx-auto mb-2 text-violet-400" />
        <h2 className="text-2xl font-semibold text-slate-100">Choose a Topic</h2>
        <p className="text-slate-400 mt-1">Select your practice mode and topic to start.</p>
      </div>

      {/* Mode Selector */}
      <div className="flex bg-slate-700/50 p-1 rounded-xl mb-8 relative">
        <button
          onClick={() => setSelectedMode('reading')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            selectedMode === 'reading' 
              ? 'bg-slate-600 text-cyan-400 shadow-lg ring-1 ring-slate-500' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpenIcon className="w-5 h-5" />
          Reading Practice
        </button>
        <button
          onClick={() => setSelectedMode('speaking')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            selectedMode === 'speaking' 
              ? 'bg-slate-600 text-violet-400 shadow-lg ring-1 ring-slate-500' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SpeakerIcon className="w-5 h-5" />
          Pronunciation
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <label htmlFor="custom-topic" className="block text-sm font-medium text-slate-400">
          Enter your own topic:
        </label>
        <div className="flex gap-2">
          <input
            id="custom-topic"
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="e.g., At the Airport"
            className="flex-grow bg-slate-700/50 border-2 border-slate-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-colors text-slate-200"
          />
          <button
            type="submit"
            disabled={!customTopic.trim()}
            className="bg-violet-500 hover:bg-violet-600 text-white font-bold py-3 px-5 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-violet-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start
          </button>
        </div>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-800/50 px-3 text-sm text-slate-400 backdrop-blur-sm">
            Or choose a preset
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => onTopicSelect(topic, selectedMode)}
            className="w-full flex justify-between items-center bg-slate-700/50 hover:bg-slate-700 text-left p-4 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75"
          >
            <span className="font-medium text-slate-200">{topic}</span>
            <ChevronRightIcon className="w-5 h-5 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicSelector;
