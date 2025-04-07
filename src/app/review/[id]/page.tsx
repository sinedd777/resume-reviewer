'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PDFViewer from '@/components/PDFViewer';
import CommentList from '@/components/CommentList';
import CommentForm from '@/components/CommentForm';
import { Resume, Comment, CommentPosition, CommentType } from '@/types';

// Create a type to track user interactions
type UserInteractions = {
  [commentId: string]: {
    liked: boolean;
    disliked: boolean;
  };
};

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [resume, setResume] = useState<Resume | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCommentPosition, setNewCommentPosition] = useState<CommentPosition | null>(null);
  const [sharingLink, setSharingLink] = useState<string>('');
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [userInteractions, setUserInteractions] = useState<UserInteractions>({});

  // Fetch resume data
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const response = await fetch(`/api/resumes?id=${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch resume');
        }
        
        const data = await response.json();
        setResume(data);
        
        // Generate sharing link
        const origin = window.location.origin;
        setSharingLink(`${origin}/review/${id}`);
      } catch (err) {
        console.error('Error fetching resume:', err);
        setError('Resume not found. It may have been deleted or the link is invalid.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResume();
    }
  }, [id]);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/comments?resumeId=${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }
        
        const data = await response.json();
        setComments(data);

        // Initialize user interactions tracking
        const initialInteractions: UserInteractions = {};
        data.forEach((comment: Comment) => {
          initialInteractions[comment.id] = {
            liked: false,
            disliked: false
          };
        });

        // Try to load existing interactions from sessionStorage
        try {
          const storedInteractions = sessionStorage.getItem(`interactions-${id}`);
          if (storedInteractions) {
            setUserInteractions(JSON.parse(storedInteractions));
          } else {
            setUserInteractions(initialInteractions);
          }
        } catch (err) {
          console.error('Error accessing session storage:', err);
          setUserInteractions(initialInteractions);
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    };

    if (id) {
      fetchComments();
    }
  }, [id]);

  // Save interactions to sessionStorage when they change
  useEffect(() => {
    if (Object.keys(userInteractions).length > 0) {
      try {
        sessionStorage.setItem(`interactions-${id}`, JSON.stringify(userInteractions));
      } catch (err) {
        console.error('Error saving to session storage:', err);
      }
    }
  }, [userInteractions, id]);

  const handleAddComment = (position: CommentPosition) => {
    setNewCommentPosition(position);
  };

  const handleSubmitComment = async (
    content: string, 
    author: string, 
    position: CommentPosition, 
    commentType: CommentType
  ) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: id,
          content,
          position,
          author: author || undefined,
          commentType,
          likes: 0,
          dislikes: 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const newComment = await response.json();
      
      // Update comments state
      setComments((prevComments) => [...prevComments, newComment]);
      
      // Initialize interaction tracking for new comment
      setUserInteractions((prev) => ({
        ...prev,
        [newComment.id]: { liked: false, disliked: false }
      }));
      
      setNewCommentPosition(null);
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    // Check if user has already interacted with this comment
    const interaction = userInteractions[commentId];
    if (!interaction || interaction.liked) {
      return; // User has already liked or the comment doesn't exist
    }

    try {
      // Find the current comment to update locally
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      // Handle null values
      const currentLikes = comment.likes || 0;
      const currentDislikes = comment.dislikes || 0;

      // Optimistically update UI
      const updatedComment = { 
        ...comment, 
        likes: currentLikes + 1 
      };
      
      if (interaction.disliked) {
        // If user previously disliked, remove their dislike
        updatedComment.dislikes = Math.max(0, currentDislikes - 1);
      }

      setComments(prevComments => 
        prevComments.map(c => c.id === commentId ? updatedComment : c)
      );
      
      // Update user interactions
      setUserInteractions(prev => ({
        ...prev,
        [commentId]: { liked: true, disliked: false }
      }));
      
      // Update on server
      const response = await fetch('/api/comments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: commentId,
          likes: updatedComment.likes,
          dislikes: updatedComment.dislikes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update comment likes');
      }
    } catch (err) {
      console.error('Error liking comment:', err);
      // Revert changes on error
      const originalComments = [...comments];
      setComments(originalComments);
      
      // Revert interaction state
      setUserInteractions(prev => ({
        ...prev,
        [commentId]: { liked: false, disliked: interaction.disliked }
      }));
    }
  };

  const handleDislikeComment = async (commentId: string) => {
    // Check if user has already interacted with this comment
    const interaction = userInteractions[commentId];
    if (!interaction || interaction.disliked) {
      return; // User has already disliked or the comment doesn't exist
    }

    try {
      // Find the current comment to update locally
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      // Handle null values
      const currentLikes = comment.likes || 0;
      const currentDislikes = comment.dislikes || 0;

      // Optimistically update UI
      const updatedComment = { 
        ...comment, 
        dislikes: currentDislikes + 1 
      };
      
      if (interaction.liked) {
        // If user previously liked, remove their like
        updatedComment.likes = Math.max(0, currentLikes - 1);
      }

      setComments(prevComments => 
        prevComments.map(c => c.id === commentId ? updatedComment : c)
      );
      
      // Update user interactions
      setUserInteractions(prev => ({
        ...prev,
        [commentId]: { liked: false, disliked: true }
      }));
      
      // Update on server
      const response = await fetch('/api/comments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: commentId,
          likes: updatedComment.likes,
          dislikes: updatedComment.dislikes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update comment dislikes');
      }
    } catch (err) {
      console.error('Error disliking comment:', err);
      // Revert changes on error
      const originalComments = [...comments];
      setComments(originalComments);
      
      // Revert interaction state
      setUserInteractions(prev => ({
        ...prev,
        [commentId]: { liked: interaction.liked, disliked: false }
      }));
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharingLink)
      .then(() => {
        alert('Link copied to clipboard!');
      })
      .catch((err) => {
        console.error('Error copying to clipboard:', err);
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <div className="text-center max-w-lg">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error || 'Resume not found'}</p>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4 border-b">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{resume.fileName}</h1>
            <p className="text-sm text-gray-500">
              Uploaded: {new Date(resume.uploadedAt).toLocaleString()}
            </p>
          </div>
          <div className="mt-2 md:mt-0 flex items-center space-x-2">
            <span className="text-sm text-gray-600 hidden md:inline">Share:</span>
            <div className="relative flex">
              <input
                type="text"
                readOnly
                value={sharingLink}
                className="w-48 md:w-64 text-sm border border-gray-300 rounded-l-md py-1 px-2 text-gray-600"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={handleCopyLink}
                className="bg-blue-500 text-white px-3 py-1 text-sm rounded-r-md hover:bg-blue-600"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white p-4 rounded-lg shadow-sm">
          <PDFViewer
            fileUrl={resume.fileUrl}
            comments={comments}
            onAddComment={handleAddComment}
            highlightedCommentId={highlightedCommentId}
            setHighlightedCommentId={setHighlightedCommentId}
          />
        </div>
        <div className="w-full md:w-96 bg-white p-4 rounded-lg shadow-sm">
          {newCommentPosition ? (
            <CommentForm
              position={newCommentPosition}
              onSubmit={handleSubmitComment}
              onCancel={() => setNewCommentPosition(null)}
            />
          ) : (
            <CommentList
              comments={comments}
              onLikeComment={handleLikeComment}
              onDislikeComment={handleDislikeComment}
              highlightedCommentId={highlightedCommentId}
              setHighlightedCommentId={setHighlightedCommentId}
              userInteractions={userInteractions}
            />
          )}
        </div>
      </main>
    </div>
  );
}