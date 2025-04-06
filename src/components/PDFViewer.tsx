import React, { useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { pdfjs } from 'react-pdf';
import { Comment, CommentPosition, CommentType } from "@/types";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  fileUrl: string;
  comments: Comment[];
  onAddComment: (position: CommentPosition, selectedText?: string) => void;
  highlightedCommentId?: string | null;
  setHighlightedCommentId?: (id: string | null) => void;
}

const getMarkerStyle = (commentType: CommentType, isHovered: boolean) => {
  const baseSize = isHovered ? 16 : 12;
  
  if (commentType === 'content') {
    return {
      width: baseSize,
      height: baseSize,
      borderRadius: '50%', // Circle for content comments
      backgroundColor: isHovered
        ? "rgba(59, 130, 246, 0.9)" // Blue when hovered
        : "rgba(59, 130, 246, 0.7)",
      border: "1px solid #2563eb"
    };
  } else { // styling
    return {
      width: baseSize,
      height: baseSize,
      borderRadius: '3px', // Square with rounded corners for styling comments
      backgroundColor: isHovered
        ? "rgba(168, 85, 247, 0.9)" // Purple when hovered
        : "rgba(168, 85, 247, 0.7)", 
      border: "1px solid #7c3aed"
    };
  }
};

const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  comments,
  onAddComment,
  highlightedCommentId,
  setHighlightedCommentId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [internalHoveredId, setInternalHoveredId] = useState<string | null>(null);

  const isControlled = highlightedCommentId !== undefined && setHighlightedCommentId !== undefined;
  const currentHoveredId = isControlled ? highlightedCommentId : internalHoveredId;
  const setHovered = isControlled ? setHighlightedCommentId! : setInternalHoveredId;

  const handleClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const pages = containerRef.current?.querySelectorAll('.react-pdf__Page');
    if (!pages) return;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;
      const rect = page.getBoundingClientRect();

      if (
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom &&
        event.clientX >= rect.left &&
        event.clientX <= rect.right
      ) {
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const position: CommentPosition = {
          pageNumber: i + 1,
          x,
          y,
        };

        const selectedText = window.getSelection()?.toString() || undefined;
        onAddComment(position, selectedText);
        break;
      }
    }
  };

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{
        position: "relative",
        cursor: "crosshair",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Document file={fileUrl} onLoadSuccess={handleLoadSuccess}>
        {Array.from(new Array(numPages), (_, index) => (
          <div key={index} style={{ position: "relative" }}>
            <Page pageNumber={index + 1} />
            {comments
              .filter((comment) => comment.position.pageNumber === index + 1)
              .map((comment) => {
                const isHovered = currentHoveredId === comment.id;
                const markerStyle = getMarkerStyle(comment.commentType, isHovered);
                
                return (
                  <div
                    key={comment.id}
                    onMouseEnter={() => setHovered(comment.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      position: "absolute",
                      top: comment.position.y,
                      left: comment.position.x,
                      ...markerStyle,
                      transform: "translate(-50%, -50%)",
                      transition: "all 0.2s ease",
                    }}
                    title={comment.content}
                  />
                );
              })}
          </div>
        ))}
      </Document>
    </div>
  );
};

export default PDFViewer;
