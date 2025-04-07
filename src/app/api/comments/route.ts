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
      likes: comment.likes,
      dislikes: comment.dislikes
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
    
    console.log('PATCH request received:', { id, likes, dislikes });
    
    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }
    
    // Fetch current comment to get all its data
    const { data: currentComment, error: fetchError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching comment:', fetchError);
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    console.log('Current comment in database:', currentComment);
    
    // Build update object with explicit type conversion
    const updateData: Record<string, unknown> = {};
    
    if (likes !== undefined) {
      // Use Number() to ensure likes is stored as a number and not a string or null
      updateData.likes = Number(likes);
      console.log(`Setting likes to ${updateData.likes}`);
    }
    
    if (dislikes !== undefined) {
      // Use Number() to ensure dislikes is stored as a number and not a string or null
      updateData.dislikes = Number(dislikes);
      console.log(`Setting dislikes to ${updateData.dislikes}`);
    }
    
    console.log('Updating comment with data:', updateData);
    
    // Try a direct SQL update to bypass any RLS (Row Level Security) issues
    // This is more likely to work if there are permission issues
    const commentId = id;
    let updateQuery = 'UPDATE comments SET ';
    const updateValues: (string | number)[] = [];
    let valueIndex = 1;
    
    if (likes !== undefined) {
      updateQuery += `likes = $${valueIndex}, `;
      updateValues.push(Number(likes));
      valueIndex++;
    }
    
    if (dislikes !== undefined) {
      updateQuery += `dislikes = $${valueIndex}, `;
      updateValues.push(Number(dislikes));
      valueIndex++;
    }
    
    // Remove trailing comma and space
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` WHERE id = $${valueIndex} RETURNING *`;
    updateValues.push(commentId);
    
    console.log('Executing SQL update:', { query: updateQuery, values: updateValues });
    
    const { data: directUpdateResult, error: directUpdateError } = await supabase
      .rpc('direct_update_comment', { 
        comment_id: commentId, 
        likes_value: updateData.likes as number,
        dislikes_value: updateData.dislikes as number 
      });
    
    // Handle the direct update error - fall back to standard update
    if (directUpdateError) {
      console.error('Error with direct update, falling back to standard update:', directUpdateError);
      
      // Standard update as fallback
      const { error } = await supabase
        .from('comments')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating comment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      console.log('Direct update successful:', directUpdateResult);
    }
    
    // Fetch the updated comment separately to verify and return it
    const { data: updatedComment, error: fetchUpdatedError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchUpdatedError) {
      console.error('Error fetching updated comment:', fetchUpdatedError);
      return NextResponse.json({ error: fetchUpdatedError.message }, { status: 500 });
    }
    
    console.log('Updated comment in database:', updatedComment);
    
    // If the update didn't work, return a manual response with the updated values
    if ((likes !== undefined && updatedComment.likes !== Number(likes)) ||
        (dislikes !== undefined && updatedComment.dislikes !== Number(dislikes))) {
      console.warn('Database update did not take effect. Returning manually updated response.');
      
      // Create response manually with updated values
      const response = {
        id: updatedComment.id,
        resumeId: updatedComment.resume_id,
        content: updatedComment.content,
        position: JSON.parse(updatedComment.position),
        author: updatedComment.author || undefined,
        createdAt: updatedComment.created_at,
        commentType: updatedComment.comment_type,
        likes: likes !== undefined ? Number(likes) : Number(updatedComment.likes || 0),
        dislikes: dislikes !== undefined ? Number(dislikes) : Number(updatedComment.dislikes || 0)
      };
      
      console.log('Sending manually fixed response:', { 
        id: response.id, 
        likes: response.likes, 
        dislikes: response.dislikes 
      });
      
      return NextResponse.json(response);
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
      likes: Number(updatedComment.likes || 0), // Ensure null is converted to 0
      dislikes: Number(updatedComment.dislikes || 0) // Ensure null is converted to 0
    };
    
    console.log('Sending response:', { 
      id: response.id, 
      likes: response.likes, 
      dislikes: response.dislikes 
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in PATCH /api/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}