import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { Comment } from '@/types';

// Create a new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeId, content, position, author, commentType } = body;

    if (!resumeId || !content || !position) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const commentId = uuidv4();
    const createdAt = new Date().toISOString();

    // Store comment in the database
    const { error } = await supabase
      .from('comments')
      .insert({
        id: commentId,
        resume_id: resumeId,
        content,
        position: JSON.stringify(position),
        author: author || null,
        created_at: createdAt,
        comment_type: commentType,
        likes: 0,
        dislikes: 0
      });

    if (error) {
      console.error('Error storing comment:', error);
      return NextResponse.json(
        { error: 'Error storing comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: commentId,
      resumeId,
      content,
      position,
      author,
      createdAt,
      commentType,
      likes: 0,
      dislikes: 0
    });
  } catch (error) {
    console.error('Error processing comment creation:', error);
    return NextResponse.json(
      { error: 'Error processing comment' },
      { status: 500 }
    );
  }
}

// Get comments for a resume
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const resumeId = searchParams.get('resumeId');

  if (!resumeId) {
    return NextResponse.json(
      { error: 'Resume ID is required' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('resume_id', resumeId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Error fetching comments' },
        { status: 500 }
      );
    }

    const comments: Comment[] = data.map((comment) => ({
      id: comment.id,
      resumeId: comment.resume_id,
      content: comment.content,
      position: JSON.parse(comment.position),
      author: comment.author || undefined,
      createdAt: comment.created_at,
      commentType: comment.comment_type,
      likes: comment.likes || 0,
      dislikes: comment.dislikes || 0
    }));

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error processing comments request:', error);
    return NextResponse.json(
      { error: 'Error processing request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const { id, likes, dislikes } = data;
    
    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }
    
    // Build update object handling null values properly
    const updateData: { likes?: number; dislikes?: number } = {};
    
    // Handle likes with null safety
    if (likes !== undefined) {
      updateData.likes = likes;
    }
    
    // Handle dislikes with null safety
    if (dislikes !== undefined) {
      updateData.dislikes = dislikes;
    }
    
    // Update the comment in the database
    const { error } = await supabase
      .from('comments')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Fetch the updated comment separately to return it
    const { data: updatedComment, error: fetchUpdatedError } = await supabase
      .from('comments')
      .select()
      .eq('id', id)
      .single();
    
    if (fetchUpdatedError) {
      console.error('Error fetching updated comment:', fetchUpdatedError);
      return NextResponse.json({ error: fetchUpdatedError.message }, { status: 500 });
    }
    
    // Create a response with correctly typed data
    const response = {
      id: updatedComment.id,
      resumeId: updatedComment.resume_id,
      content: updatedComment.content,
      position: JSON.parse(updatedComment.position),
      author: updatedComment.author || undefined,
      createdAt: updatedComment.created_at,
      commentType: updatedComment.comment_type,
      likes: updatedComment.likes || 0, // Ensure null is converted to 0
      dislikes: updatedComment.dislikes || 0 // Ensure null is converted to 0
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in PATCH /api/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}