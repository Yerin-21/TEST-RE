
import React, { useState } from 'react';
import type { SelectionRange } from '../types';
import { MagicWandIcon, SendIcon } from './icons';

interface SelectionToolbarProps {
  range: SelectionRange;
  onIterate: (instruction: string) => void;
  isLoading: boolean;
}

const quickActions = ["Improve writing", "Make it shorter", "Make it longer", "Fix grammar"];

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({ range, onIterate, isLoading }) => {
  const [customInstruction, setCustomInstruction] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInstruction.trim()) {
      onIterate(customInstruction);
      setCustomInstruction('');
    }
  };

  const toolbarStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${range.top - 55}px`, // Position above selection
    left: `${range.left + range.width / 2}px`,
    transform: 'translateX(-50%)',
    zIndex: 10,
  };

  if (isLoading) {
     return (
        <div style={toolbarStyle} className="flex items-center space-x-2 bg-gray-800/80 backdrop-blur-md border border-gray-600 text-white px-3 py-2 rounded-lg shadow-lg">
           <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Working...</span>
        </div>
     )
  }

  return (
    <div style={toolbarStyle} className="bg-gray-800/80 backdrop-blur-md border border-gray-600 text-white rounded-lg shadow-lg flex flex-col divide-y divide-gray-700">
      <div className="flex items-center p-1 space-x-1">
        <MagicWandIcon className="w-4 h-4 text-purple-400 mx-1"/>
        {quickActions.map(action => (
          <button
            key={action}
            onClick={() => onIterate(action)}
            className="px-2 py-1 text-xs font-medium hover:bg-gray-700 rounded-md transition-colors"
          >
            {action}
          </button>
        ))}
      </div>
      <form onSubmit={handleCustomSubmit} className="flex items-center p-1">
        <input
          type="text"
          value={customInstruction}
          onChange={(e) => setCustomInstruction(e.target.value)}
          placeholder="Or type a custom instruction..."
          className="bg-transparent text-xs w-full focus:outline-none px-2 py-1 placeholder-gray-500"
        />
        <button type="submit" className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700" disabled={!customInstruction.trim()}>
            <SendIcon className="w-4 h-4"/>
        </button>
      </form>
    </div>
  );
};
