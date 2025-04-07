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
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [pdfDimensions, setPdfDimensions] = useState<Map<number, { width: number, height: number }>>(new Map());

  const isControlled = highlightedCommentId !== undefined && setHighlightedCommentId !== undefined;
  const currentHoveredId = isControlled ? highlightedCommentId : internalHoveredId;
  const setHovered = isControlled ? setHighlightedCommentId! : setInternalHoveredId;

  // Update container width on resize
  React.useEffect(() => {
    if (containerRef.current) {
      const updateWidth = () => {
        const width = containerRef.current?.clientWidth || 0;
        setContainerWidth(width - 32); // Account for padding
      };
      
      updateWidth();
      
      // Update when window resizes
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
  }, []);

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
        // Calculate position as percentages of the actual PDF dimensions
        const pageNumber = i + 1;
        const pdfPage = pdfDimensions.get(pageNumber);
        
        if (pdfPage) {
          const xPercent = (event.clientX - rect.left) / rect.width;
          const yPercent = (event.clientY - rect.top) / rect.height;
          
          // Store original coordinates in percentages (0-1) so they scale correctly
          const position: CommentPosition = {
            pageNumber,
            x: xPercent,
            y: yPercent,
            originalX: event.clientX - rect.left, // Store pixel coordinates for rendering
            originalY: event.clientY - rect.top,
          };

          const selectedText = window.getSelection()?.toString() || undefined;
          onAddComment(position, selectedText);
          break;
        }
      }
    }
  };

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Update page dimensions when loaded
  const handlePageLoadSuccess = ({ pageNumber, width, height }: { pageNumber: number, width: number, height: number }) => {
    setPageWidth(width);
    setPdfDimensions(prev => {
      const newMap = new Map(prev);
      newMap.set(pageNumber, { width, height });
      return newMap;
    });
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="flex flex-col items-center w-full overflow-hidden"
      style={{
        position: "relative",
        cursor: "crosshair",
      }}
    >
      <div className="overflow-auto max-h-[calc(100vh-200px)] w-full">
        <Document file={fileUrl} onLoadSuccess={handleLoadSuccess}>
          {Array.from(new Array(numPages), (_, index) => (
            <div 
              key={index} 
              style={{ 
                position: "relative",
                width: `${containerWidth}px`,
                margin: '0 auto 20px auto',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
              }}
              className="bg-white"
            >
              <Page 
                pageNumber={index + 1} 
                width={containerWidth}
                onLoadSuccess={handlePageLoadSuccess}
              />
              {comments
                .filter((comment) => comment.position.pageNumber === index + 1)
                .map((comment) => {
                  const isHovered = currentHoveredId === comment.id;
                  const markerStyle = getMarkerStyle(comment.commentType, isHovered);
                  
                  const pdfPage = pdfDimensions.get(index + 1);
                  
                  // Calculate marker position based on PDF dimensions
                  let xPos = 0, yPos = 0;
                  
                  if (pdfPage) {
                    // If we have stored percentage values (for new comments)
                    if (typeof comment.position.x === 'number' && typeof comment.position.y === 'number') {
                      // If values are very small (0-1), they're probably percentages
                      if (comment.position.x <= 1 && comment.position.y <= 1) {
                        xPos = comment.position.x * pdfPage.width;
                        yPos = comment.position.y * pdfPage.height;
                      } else {
                        // For legacy coordinates (absolute pixels), maintain position ratio
                        const scaleRatio = containerWidth / pageWidth;
                        xPos = comment.position.x * scaleRatio;
                        yPos = comment.position.y * scaleRatio;
                      }
                    }
                  }
                  
                  return (
                    <div
                      key={comment.id}
                      onMouseEnter={() => setHovered(comment.id)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        position: "absolute",
                        top: yPos,
                        left: xPos,
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
    </div>
  );
};

export default PDFViewer;
