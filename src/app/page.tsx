'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/FileUpload';

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/resumes', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload resume');
      }

      // Redirect to the resume review page
      router.push(`/review/${data.id}`);
    } catch (err) {
      console.error('Error uploading resume:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload resume');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Resume Reviewer
          </h1>
          <p className="text-gray-600 text-lg">
            Upload your resume and get feedback from others through a shareable link.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Upload Your Resume
            </h2>
            <p className="text-gray-500 text-sm">
              Upload your resume as a PDF file to get started.
            </p>
          </div>
          
          <FileUpload onUpload={handleUpload} isUploading={isUploading} />
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            How It Works
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-100 text-blue-700 font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Upload your resume</h3>
                <p className="text-gray-500 text-sm">
                  Upload your resume as a PDF file.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-100 text-blue-700 font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Share the link</h3>
                <p className="text-gray-500 text-sm">
                  Get a unique link to share with others for review.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-100 text-blue-700 font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Receive feedback</h3>
                <p className="text-gray-500 text-sm">
                  Others can leave comments on specific parts of your resume.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
