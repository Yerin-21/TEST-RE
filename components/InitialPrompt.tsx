
import React, { useState, useCallback } from 'react';
import { PaperclipIcon, XIcon, FileIcon } from './icons';
import type { AttachedFile } from '../types';
import { fileToBase64 } from '../utils/fileUtils';

interface InitialPromptProps {
  onGenerate: (prompt: string, files: AttachedFile[]) => void;
}

export const InitialPrompt: React.FC<InitialPromptProps> = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      processFiles(newFiles);
    }
  };
  
  const processFiles = async (fileList: File[]) => {
     try {
        const processedFiles = await Promise.all(
          fileList.map(async (file) => {
            const content = await fileToBase64(file);
            return { name: file.name, type: file.type, content };
          })
        );
        setFiles((prevFiles) => [...prevFiles, ...processedFiles]);
      } catch (error) {
        console.error("Error processing files:", error);
      }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, files);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }, []);


  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-full max-w-3xl p-4 md:p-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-2">무엇에 대해 작성할까요?</h2>
            <p className="text-center text-gray-400 mb-8">
                시작하려면 프롬프트와 선택적인 첨부 파일을 제공하세요.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="예: 재생 에너지의 미래에 대한 블로그 게시물 작성..."
                    className="w-full h-40 p-4 bg-gray-800 border border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-200"
                />
                <div className="space-y-2">
                     <label 
                        htmlFor="file-upload" 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative flex justify-center w-full px-6 pt-5 pb-6 border-2 ${isDragging ? 'border-purple-500' : 'border-gray-600'} border-dashed rounded-md cursor-pointer hover:border-purple-500 transition-colors`}
                    >
                        <div className="space-y-1 text-center">
                           <PaperclipIcon className="mx-auto h-10 w-10 text-gray-500" />
                            <div className="flex text-sm text-gray-400">
                                <span className="font-medium text-purple-400">파일 업로드</span>
                                <p className="pl-1">또는 드래그 앤 드롭</p>
                            </div>
                            <p className="text-xs text-gray-500">관련 문서를 첨부하세요</p>
                        </div>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                    </label>

                    {files.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center p-2 bg-gray-800 border border-gray-700 rounded-md">
                               <FileIcon className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                                <span className="text-sm text-gray-300 truncate flex-grow">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="ml-2 text-gray-500 hover:text-white"
                                >
                                   <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        </div>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={!prompt.trim()}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    생성하기
                </button>
            </form>
        </div>
    </div>
  );
};
