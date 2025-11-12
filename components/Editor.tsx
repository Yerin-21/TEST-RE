
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SelectionRange, Suggestion } from '../types';
import { SelectionToolbar } from './SelectionToolbar';
import { getProactiveSuggestion, iterateOnSelection } from '../services/geminiService';
import { useDebounce } from '../hooks/useDebounce';
import { SparklesIcon } from './icons';

interface EditorProps {
  initialContent: string;
  onContentChange: (content: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ initialContent, onContentChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [isIterating, setIsIterating] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const debouncedContent = useDebounce(initialContent, 2000);

  useEffect(() => {
    if (editorRef.current && initialContent !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onContentChange(e.currentTarget.innerHTML);
    setSuggestion(null);
  };
  
  const handleMouseUp = () => {
    const currentSelection = window.getSelection();
    if (currentSelection && currentSelection.rangeCount > 0 && !currentSelection.isCollapsed) {
      const range = currentSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection(currentSelection);
      setSelectionRange({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setSelection(null);
      setSelectionRange(null);
    }
  };

  const handleIteration = useCallback(async (instruction: string) => {
    if (!selection) return;
    
    setIsIterating(true);
    const selectedText = selection.toString();
    try {
      const newText = await iterateOnSelection(selectedText, instruction);
      const fullContent = initialContent.replace(selectedText, `<span class="bg-purple-500/20 transition-all duration-500">${newText}</span>`);
      onContentChange(fullContent);
      setTimeout(() => {
         onContentChange(fullContent.replace(/<\/?span[^>]*>/g, ""));
      }, 1500);

    } catch (error) {
      console.error("Iteration failed:", error);
    } finally {
      setIsIterating(false);
      setSelection(null);
      setSelectionRange(null);
    }
  }, [selection, initialContent, onContentChange]);

  const fetchSuggestion = useCallback(async () => {
    if (!debouncedContent || debouncedContent.length < 100 || isSuggesting || suggestion) {
      return;
    }
    setIsSuggesting(true);
    try {
      const newSuggestion = await getProactiveSuggestion(debouncedContent);
      if(newSuggestion && newSuggestion.find) {
         setSuggestion(newSuggestion);
      }
    } catch (error) {
      console.error('Failed to get suggestion:', error);
    } finally {
      setIsSuggesting(false);
    }
  }, [debouncedContent, isSuggesting, suggestion]);

  useEffect(() => {
    fetchSuggestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent, fetchSuggestion]);
  
  const renderContentWithSuggestion = () => {
    if (!suggestion || !initialContent.includes(suggestion.find)) {
      return <div dangerouslySetInnerHTML={{ __html: initialContent }} />;
    }
    const parts = initialContent.split(suggestion.find);
    return (
      <div>
        <span dangerouslySetInnerHTML={{ __html: parts[0] }} />
        <span className="relative group border-b-2 border-dotted border-purple-400 cursor-pointer">
          <span dangerouslySetInnerHTML={{ __html: suggestion.find }} />
          <div className="absolute bottom-full mb-2 w-max max-w-sm left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-20 shadow-lg">
            <div className="font-bold mb-2 flex items-center text-purple-400"><SparklesIcon className="w-4 h-4 mr-2" /> Suggestion</div>
            <p className="mb-3"><span className="line-through text-red-400/70" dangerouslySetInnerHTML={{ __html: suggestion.find }} /> → <span className="text-green-400/90">{suggestion.replace}</span></p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setSuggestion(null)} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-xs">Dismiss</button>
              <button onClick={acceptSuggestion} className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded-md text-xs">Accept</button>
            </div>
          </div>
        </span>
        <span dangerouslySetInnerHTML={{ __html: parts.slice(1).join(suggestion.find) }} />
      </div>
    );
  };

  const acceptSuggestion = () => {
    if (suggestion) {
      const newContent = initialContent.replace(suggestion.find, suggestion.replace);
      onContentChange(newContent);
      setSuggestion(null);
    }
  };
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8" onMouseUp={handleMouseUp}>
        <div 
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="prose prose-invert prose-lg max-w-3xl mx-auto focus:outline-none min-h-[calc(100vh-10rem)]"
        />
       {selectionRange && <SelectionToolbar range={selectionRange} onIterate={handleIteration} isLoading={isIterating} />}
       <div className="max-w-3xl mx-auto mt-4 h-8 flex items-center">
         {isSuggesting && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 animate-pulse">
                <SparklesIcon className="w-4 h-4 text-purple-500" />
                <span>Checking for suggestions...</span>
            </div>
         )}
       </div>
    </div>
  );
};
