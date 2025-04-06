import { useState } from 'react';
import { CommentPosition, CommentType } from '@/types';

interface CommentFormProps {
  position: CommentPosition;
  onSubmit: (content: string, author: string, position: CommentPosition, commentType: CommentType) => void;
  onCancel: () => void;
}

export default function CommentForm({ position, onSubmit, onCancel }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [commentType, setCommentType] = useState<CommentType>('content');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (!confirming) {
      setConfirming(true);
      return;
    }

    onSubmit(content, author, position, commentType);
    setContent('');
    setAuthor('');
    setError('');
    setConfirming(false);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-md shadow-lg border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Add New Comment</h2>
      
      {position.selectedText && (
        <div className="mb-4 text-sm italic bg-yellow-50 p-3 rounded border border-yellow-200">
          <span className="block text-xs font-medium text-gray-600 mb-1">Selected Text:</span>
          &ldquo;{position.selectedText}&rdquo;
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comment
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-md p-3 text-sm text-gray-800 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Add your comment here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comment Type
          </label>
          <div className="flex space-x-4 mb-4">
            <label className="flex items-center bg-blue-50 border border-blue-200 rounded-md px-3 py-2 cursor-pointer">
              <input
                type="radio"
                name="commentType"
                value="content"
                checked={commentType === 'content'}
                onChange={() => setCommentType('content')}
                className="mr-2"
              />
              <span className="text-sm text-blue-700">Content</span>
            </label>
            <label className="flex items-center bg-purple-50 border border-purple-200 rounded-md px-3 py-2 cursor-pointer">
              <input
                type="radio"
                name="commentType"
                value="styling"
                checked={commentType === 'styling'}
                onChange={() => setCommentType('styling')}
                className="mr-2"
              />
              <span className="text-sm text-purple-700">Styling/Formatting</span>
            </label>
          </div>
          
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Name (optional)
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-800 bg-white"
            placeholder="Enter your name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
              confirming 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirming ? 'Confirm' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}