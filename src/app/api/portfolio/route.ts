import { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile, joinPath } from "@/lib/storage/file-utils";
import { PATHS } from "@/lib/config/constants";
import { handleError, badRequest, json } from "@/lib/http/responses";

const dataPath = joinPath(PATHS.PORTFOLIO_DATA);

// GET - Read portfolio data
export async function GET() {
  try {
    const data = readJsonFile(dataPath);
    return json(data);
  } catch (error) {
    return handleError(error, "Failed to read portfolio data");
  }
}

// PUT - Update portfolio data
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.profile || !body.skills || !body.experience || !body.projects || !body.certifications) {
      return badRequest("Invalid data structure — profile, skills, experience, projects, and certifications are required");
    }

    writeJsonFile(dataPath, body);

    return json({ success: true, message: "Portfolio data updated successfully" });
  } catch (error) {
    return handleError(error, "Failed to update portfolio data");
  }
}
