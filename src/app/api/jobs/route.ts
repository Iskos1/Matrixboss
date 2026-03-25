import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getProjectRoot } from '@/lib/utils/file-utils';
import { handleError, badRequest, notFound, json } from '@/lib/api/responses';

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
    return json(tracker);
  } catch (error) {
    return handleError(error, 'Failed to read job tracker');
  }
}

// POST /api/jobs — save a new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company, role, jobDescription, resumeFilename, coverLetterFilename, compatibilityScore, analysis } = body;

    if (!jobDescription) {
      return badRequest('jobDescription is required');
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

    tracker.applications.unshift(newApplication);
    writeTracker(tracker);

    return json({ success: true, application: newApplication });
  } catch (error) {
    return handleError(error, 'Failed to save application');
  }
}

// PATCH /api/jobs — update an application
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return badRequest('id is required');
    }

    const tracker = readTracker();
    const idx = tracker.applications.findIndex((a: any) => a.id === id);
    if (idx === -1) {
      return notFound('Application not found');
    }

    const allowed = ['applicationStatus', 'company', 'role', 'notes', 'qaHistory', 'compatibilityScore', 'analysis', 'resumeFilename', 'coverLetterFilename'];
    for (const key of allowed) {
      if (key in updates) {
        tracker.applications[idx][key] = updates[key];
      }
    }
    tracker.applications[idx].updatedAt = new Date().toISOString();

    writeTracker(tracker);
    return json({ success: true, application: tracker.applications[idx] });
  } catch (error) {
    return handleError(error, 'Failed to update application');
  }
}

// DELETE /api/jobs?id=job_xxx
export async function DELETE(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get('id');

    if (!id) {
      return badRequest('id is required');
    }

    const tracker = readTracker();
    const before = tracker.applications.length;
    tracker.applications = tracker.applications.filter((a: any) => a.id !== id);

    if (tracker.applications.length === before) {
      return notFound('Application not found');
    }

    writeTracker(tracker);
    return json({ success: true });
  } catch (error) {
    return handleError(error, 'Failed to delete application');
  }
}
