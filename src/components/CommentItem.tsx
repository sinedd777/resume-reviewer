import { Comment } from '@/types';

// Define UserInteraction type
type UserInteraction = {
  liked: boolean;
  disliked: boolean;
};

interface CommentItemProps {
  comment: Comment;
  isHighlighted?: boolean;
  setHighlightedCommentId?: (id: string | null) => void;
  onLikeComment?: (id: string) => void;
  onDislikeComment?: (id: string) => void;
  userInteraction?: UserInteraction;
}

export default function CommentItem({ 
  comment, 
  isHighlighted = false, 
  setHighlightedCommentId,
  onLikeComment,
  onDislikeComment,
  userInteraction = { liked: false, disliked: false }
}: CommentItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div 
      className={`border-b border-gray-200 py-3 group ${isHighlighted ? 'bg-yellow-50' : ''}`}
      onMouseEnter={() => setHighlightedCommentId?.(comment.id)}
      onMouseLeave={() => setHighlightedCommentId?.(null)}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-gray-700">
            {comment.author || 'Anonymous'}
          </div>
          <span 
            className={`text-xs px-2 py-0.5 rounded ${
              comment.commentType === 'content' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
            }`}
          >
            {comment.commentType === 'content' ? 'Content' : 'Styling'}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {formatDate(comment.createdAt)}
        </div>
      </div>
      
      {comment.position.selectedText && (
        <div className="mt-1 text-xs italic bg-yellow-50 p-1 rounded">
          &ldquo;{comment.position.selectedText}&rdquo;
        </div>
      )}
      
      <div className="mt-2">
        <div className="text-sm text-gray-800">{comment.content}</div>
      </div>
      
      <div className="mt-2 flex justify-end items-center space-x-4">
        <button 
          onClick={() => onLikeComment?.(comment.id)}
          className={`flex items-center text-xs ${
            userInteraction.liked 
              ? 'text-green-600 font-medium' 
              : 'text-gray-600 hover:text-green-600'
          }`}
          disabled={userInteraction.liked}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill={userInteraction.liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          {comment.likes}
        </button>
        <button 
          onClick={() => onDislikeComment?.(comment.id)}
          className={`flex items-center text-xs ${
            userInteraction.disliked 
              ? 'text-red-600 font-medium' 
              : 'text-gray-600 hover:text-red-600'
          }`}
          disabled={userInteraction.disliked}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill={userInteraction.disliked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
          {comment.dislikes}
        </button>
      </div>
    </div>
  );
}