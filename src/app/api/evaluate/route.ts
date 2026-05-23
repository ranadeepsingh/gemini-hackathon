import { NextRequest, NextResponse } from "next/server";
import { runConsensusEvaluation } from "@/lib/evaluation/evaluator";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { problemSlug, candidateCode, executionLogs, rubrics } = body;

    if (!problemSlug || !candidateCode) {
      return NextResponse.json({ error: "Missing problemSlug or candidateCode" }, { status: 400 });
    }

    // Call the Best-of-3 Gemini grading service, now equipped with dynamic rubrics!
    const gradeReport = await runConsensusEvaluation(
      problemSlug,
      candidateCode,
      executionLogs || [],
      rubrics || []
    );

    return NextResponse.json(gradeReport);
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
