# Resume Reviewer

A web application for uploading resumes and getting feedback through annotations and comments.

## Features

- Upload PDF resumes
- Generate unique, shareable links
- In-browser PDF rendering
- Annotation mode for highlighting and commenting on specific parts of the resume
- Comment sidebar for viewing all feedback
- No authentication required

## Tech Stack

- **Frontend**: React.js, Next.js, Tailwind CSS
- **Backend**: Next.js API Routes
- **PDF Rendering**: PDF.js, react-pdf
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Deployment**: Vercel (frontend), Supabase (backend)

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works fine)

## Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/resume_reviewer.git
cd resume_reviewer
```

2. Install dependencies:

```bash
npm install
```

3. Create a Supabase project:
   - Go to [supabase.com](https://supabase.com/) and create a new project
   - Create the following tables in Supabase:

**resumes table:**
```sql
create table resumes (
  id uuid primary key,
  file_name text not null,
  file_url text not null,
  uploaded_at timestamp with time zone default now()
);
```

**comments table:**
```sql
create table comments (
  id uuid primary key,
  resume_id uuid references resumes(id) on delete cascade not null,
  content text not null,
  position jsonb not null,
  author text,
  created_at timestamp with time zone default now()
);
```

4. Set up Supabase Storage:
   - Create a bucket named `resumes` with public access

5. Configure environment variables:
   - Rename `.env.local.example` to `.env.local`
   - Fill in your Supabase URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

6. Run the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploying to Vercel

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add the environment variables from `.env.local` to your Vercel project
4. Deploy

## License
MIT


// ... existing code ...

## Troubleshooting

### "new row violates row-level security policy" Error

If you get errors related to row-level security when uploading files or creating records:

1. Make sure you've run the SQL commands to enable public access to your tables
2. Supabase enables Row Level Security (RLS) by default, which blocks all operations until you define policies
3. You can run these SQL commands in the Supabase SQL Editor (Dashboard > SQL Editor)

### "Supabase credentials are not set" Error

If you see this error:

1. Create a proper `.env.local` file with your Supabase credentials
2. Make sure the file is in the project root directory
3. Ensure there are no typos in your environment variable names
4. Restart the application after adding the credentials

### Supabase Storage Issues

If files aren't uploading properly:

1. Check that you've created a storage bucket named "resumes"
2. Ensure the bucket has appropriate public access
3. Run the SQL commands provided to set up storage permissions

## Security Considerations

**Note**: The current implementation allows anonymous access to all resources for simplicity. In a production environment, you should implement proper authentication and more restrictive RLS policies.
