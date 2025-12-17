
export interface VocabularyItem {
  thai: string;
  english: string;
}

export interface Feedback {
  isCorrect: boolean;
  feedback: string;
  correctTranslation: string;
  vocabulary: VocabularyItem[];
}

export type PracticeMode = 'reading' | 'speaking';

export interface VocabularyPracticeTarget {
  thai: string;
  phonetic: string;
  english: string;
}

export interface PronunciationFeedback {
  score: number;
  feedback: string;
  tips: string;
}
