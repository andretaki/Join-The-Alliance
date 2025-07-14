import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { db } = await import('@/lib/db');
    const { jobPostings } = await import('@/lib/schema');
    
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const jobs = await db.select().from(jobPostings).orderBy(jobPostings.createdAt);
    
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching job postings:', error);
    return NextResponse.json({ error: 'Failed to fetch job postings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await import('@/lib/db');
    const { jobPostings } = await import('@/lib/schema');
    
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const body = await request.json();
    const { title, department, description, requirements, reviewerEmail, isActive } = body;

    if (!title || !reviewerEmail) {
      return NextResponse.json({ error: 'Title and reviewer email are required' }, { status: 400 });
    }

    const [newJob] = await db.insert(jobPostings).values({
      title,
      department: department || null,
      description: description || null,
      requirements: requirements || null,
      reviewerEmail,
      isActive: isActive ?? true,
    }).returning();

    return NextResponse.json(newJob);
  } catch (error) {
    console.error('Error creating job posting:', error);
    return NextResponse.json({ error: 'Failed to create job posting' }, { status: 500 });
  }
} 