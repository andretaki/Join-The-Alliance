import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobPostings } from '@/lib/schema';
import { jobPostingSchema } from '@/lib/employee-validation';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const activeJobPostings = await db.query.jobPostings.findMany({
      where: eq(jobPostings.isActive, true),
      orderBy: (jobPostings, { asc }) => [asc(jobPostings.title)]
    });

    return NextResponse.json(activeJobPostings);

  } catch (error) {
    console.error('Error fetching job postings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch job postings' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the job posting data
    const validatedData = jobPostingSchema.parse(body);

    const [jobPosting] = await db.insert(jobPostings).values(validatedData).returning();

    return NextResponse.json(jobPosting);

  } catch (error) {
    console.error('Error creating job posting:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: 'Failed to create job posting', 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Job posting ID is required' }, { status: 400 });
    }

    // Validate the job posting data
    const validatedData = jobPostingSchema.parse(updateData);

    const [updatedJobPosting] = await db
      .update(jobPostings)
      .set(validatedData)
      .where(eq(jobPostings.id, id))
      .returning();

    if (!updatedJobPosting) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });
    }

    return NextResponse.json(updatedJobPosting);

  } catch (error) {
    console.error('Error updating job posting:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: 'Failed to update job posting', 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Job posting ID is required' }, { status: 400 });
    }

    // Soft delete by setting isActive to false
    const [deletedJobPosting] = await db
      .update(jobPostings)
      .set({ isActive: false })
      .where(eq(jobPostings.id, parseInt(id)))
      .returning();

    if (!deletedJobPosting) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Job posting deleted successfully' });

  } catch (error) {
    console.error('Error deleting job posting:', error);
    return NextResponse.json({ 
      error: 'Failed to delete job posting' 
    }, { status: 500 });
  }
}