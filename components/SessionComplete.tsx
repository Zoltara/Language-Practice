
import React from 'react';
import { TrophyIcon } from './icons/TrophyIcon';

interface SessionCompleteProps {
  topic: string;
}

const SessionComplete: React.FC<SessionCompleteProps> = ({ topic }) => {
  return (
    <div className="text-center animate-fade-in p-4">
      <TrophyIcon className="w-16 h-16 mx-auto mb-4 text-amber-400" />
      <h2 className="text-3xl font-bold text-slate-100">Session Complete!</h2>
      <p className="text-slate-400 mt-2 mb-6">
        You've completed the practice session for <span className="font-semibold text-cyan-400">{topic}</span>.
      </p>
      <p className="text-slate-400 mt-8">
        Click the <span className="font-semibold text-cyan-400">Home</span> button below to start a new session.
      </p>
    </div>
  );
};

export default SessionComplete;
