
import React from 'react';
import { VocabularyItem } from '../types';
import { StarIcon } from './icons/StarIcon';
import { StarOutlineIcon } from './icons/StarOutlineIcon';

interface VocabularyListProps {
  vocabulary: VocabularyItem[];
  dictionary: VocabularyItem[];
  onToggleWord: (item: VocabularyItem) => void;
}

const VocabularyList: React.FC<VocabularyListProps> = ({ vocabulary, dictionary, onToggleWord }) => {
  if (!vocabulary || vocabulary.length === 0) {
    return null;
  }

  const isWordInDictionary = (thaiWord: string) => {
    return dictionary.some(item => item.thai === thaiWord);
  };

  return (
    <div className="mt-6 animate-fade-in">
      <h4 className="text-lg font-semibold text-slate-300 mb-3">Key Vocabulary</h4>
      <div className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700">
        <ul className="divide-y divide-slate-700">
          {vocabulary.map((item, index) => (
            <li key={index} className="flex justify-between items-center p-3 gap-3">
              <div>
                <span className="font-thai text-slate-200 text-lg">{item.thai}</span>
                <span className="text-slate-400 block text-sm">{item.english}</span>
              </div>
              <button
                onClick={() => onToggleWord(item)}
                className="text-amber-400 hover:text-amber-300 p-2 -m-2 rounded-full transition-colors"
                aria-label={isWordInDictionary(item.thai) ? 'Remove from dictionary' : 'Save to dictionary'}
              >
                {isWordInDictionary(item.thai) ? (
                  <StarIcon className="w-6 h-6" />
                ) : (
                  <StarOutlineIcon className="w-6 h-6" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VocabularyList;
