
import React, { useState, useCallback } from 'react';
import { Editor } from './components/Editor';
import { InitialPrompt } from './components/InitialPrompt';
import { generateInitialContent } from './services/geminiService';
import { SparklesIcon, AlertTriangleIcon } from './components/icons';
import type { AttachedFile } from './types';

export default function App() {
  const [documentContent, setDocumentContent] = useState<string>('');
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (prompt: string, files: AttachedFile[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const content = await generateInitialContent(prompt, files);
      setDocumentContent(content);
      setIsGenerated(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleNewDocument = () => {
    setDocumentContent('');
    setIsGenerated(false);
    setError(null);
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm z-30 border-b border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="w-8 h-8 text-purple-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">Magic Writer</h1>
          </div>
          {isGenerated && (
             <button
                onClick={handleNewDocument}
                className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-colors"
              >
                New Document
              </button>
          )}
        </div>
      </header>

      <main className="pt-16">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/70 z-40">
            <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-lg text-gray-300">Gemini is thinking...</p>
          </div>
        )}

        {error && (
          <div className="container mx-auto mt-8 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center space-x-3">
            <AlertTriangleIcon className="w-6 h-6 text-red-400" />
            <p className="text-red-300">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {!isGenerated && !isLoading ? (
          <InitialPrompt onGenerate={handleGenerate} />
        ) : (
          <Editor
            initialContent={documentContent}
            onContentChange={setDocumentContent}
          />
        )}
      </main>
    </div>
  );
}
