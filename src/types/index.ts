export interface Resume {
  id: string;
  fileName: string;
  uploadedAt: string;
  fileUrl: string;
}

export type CommentType = 'content' | 'styling';

export interface Comment {
  id: string;
  resumeId: string;
  content: string;
  position: CommentPosition;
  createdAt: string;
  author?: string;
  commentType: CommentType;
  likes: number;
  dislikes: number;
}

export interface CommentPosition {
  x: number;
  y: number;
  pageNumber: number;
  width?: number;
  height?: number;
  selectedText?: string;
  originalX?: number;
  originalY?: number;
} 