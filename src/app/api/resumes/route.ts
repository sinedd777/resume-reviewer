import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check if file is a PDF
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    const fileId = uuidv4();
    const fileName = file.name;
    const fileBuffer = await file.arrayBuffer();

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(`${fileId}/${fileName}`, fileBuffer, {
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Error uploading file' },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(`${fileId}/${fileName}`);

    // Store resume metadata in the database
    const { error: dbError } = await supabase
      .from('resumes')
      .insert({
        id: fileId,
        file_name: fileName,
        file_url: publicUrlData.publicUrl,
        uploaded_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Error storing resume data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: fileId,
      fileName,
      fileUrl: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error('Error processing resume upload:', error);
    return NextResponse.json(
      { error: 'Error processing upload' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    // Get a specific resume
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: data.id,
      fileName: data.file_name,
      uploadedAt: data.uploaded_at,
      fileUrl: data.file_url,
    });
  }

  // Get all resumes (can be limited/paginated in a real app)
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: 'Error fetching resumes' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    data.map((resume) => ({
      id: resume.id,
      fileName: resume.file_name,
      uploadedAt: resume.uploaded_at,
      fileUrl: resume.file_url,
    }))
  );
} 