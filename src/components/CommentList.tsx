import { useState } from 'react';
import { Comment } from '@/types';
import CommentItem from './CommentItem';

// Define UserInteractions type
type UserInteractions = {
  [commentId: string]: {
    liked: boolean;
    disliked: boolean;
  };
};

interface CommentListProps {
  comments: Comment[];
  onLikeComment?: (id: string) => void;
  onDislikeComment?: (id: string) => void;
  highlightedCommentId?: string | null;
  setHighlightedCommentId?: (id: string | null) => void;
  userInteractions?: UserInteractions;
}

export default function CommentList({ 
  comments, 
  onLikeComment,
  onDislikeComment,
  highlightedCommentId,
  setHighlightedCommentId,
  userInteractions = {}
}: CommentListProps) {
  const [sortBy, setSortBy] = useState<'date' | 'likes'>('date');

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      // Sort by total likes (likes - dislikes)
      return (b.likes - b.dislikes) - (a.likes - a.dislikes);
    }
  });

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Comments ({comments.length})</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSortBy('date')}
            className={`px-3 py-1 text-sm rounded ${
              sortBy === 'date'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sort by Date
          </button>
          <button
            onClick={() => setSortBy('likes')}
            className={`px-3 py-1 text-sm rounded ${
              sortBy === 'likes'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sort by Likes
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedComments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No comments yet. Click on the document to add a comment.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isHighlighted={highlightedCommentId === comment.id}
                setHighlightedCommentId={setHighlightedCommentId}
                onLikeComment={onLikeComment}
                onDislikeComment={onDislikeComment}
                userInteraction={userInteractions[comment.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}