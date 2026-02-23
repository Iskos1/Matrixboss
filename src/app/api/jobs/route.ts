import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getProjectRoot } from '@/lib/utils/file-utils';

export const dynamic = 'force-dynamic';

function getTrackerPath() {
  return path.join(getProjectRoot(), 'src/data/job-tracker.json');
}

function readTracker() {
  const filePath = getTrackerPath();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ applications: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeTracker(data: any) {
  fs.writeFileSync(getTrackerPath(), JSON.stringify(data, null, 2));
}

// GET /api/jobs — list all saved applications
export async function GET() {
  try {
    const tracker = readTracker();
    return NextResponse.json(tracker);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/jobs — save a new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      company,
      role,
      jobDescription,
      resumeFilename,
      coverLetterFilename,
      compatibilityScore,
      analysis,
    } = body;

    if (!jobDescription) {
      return NextResponse.json({ error: 'jobDescription is required' }, { status: 400 });
    }

    const tracker = readTracker();

    const newApplication = {
      id: `job_${Date.now()}`,
      savedAt: new Date().toISOString(),
      company: company || 'Unknown Company',
      role: role || 'Unknown Role',
      jobDescription,
      resumeFilename: resumeFilename || null,
      coverLetterFilename: coverLetterFilename || null,
      compatibilityScore: compatibilityScore ?? null,
      analysis: analysis || null,
    };

    tracker.applications.unshift(newApplication); // newest first
    writeTracker(tracker);

    return NextResponse.json({ success: true, application: newApplication });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/jobs — update status, company, role, or notes on an application
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const tracker = readTracker();
    const idx = tracker.applications.findIndex((a: any) => a.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Merge only allowed fields
    const allowed = ['applicationStatus', 'company', 'role', 'notes'];
    for (const key of allowed) {
      if (key in updates) {
        tracker.applications[idx][key] = updates[key];
      }
    }
    tracker.applications[idx].updatedAt = new Date().toISOString();

    writeTracker(tracker);
    return NextResponse.json({ success: true, application: tracker.applications[idx] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/jobs?id=job_xxx — delete an application
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const tracker = readTracker();
    const before = tracker.applications.length;
    tracker.applications = tracker.applications.filter((a: any) => a.id !== id);

    if (tracker.applications.length === before) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    writeTracker(tracker);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
