import { createDraftRun, listRecentRuns } from "@/features/analysis-run/repository";

type CreateRunRequest = {
  inputText?: string;
  inputNotes?: string | null;
};

export async function GET() {
  const runs = await listRecentRuns(5);
  return Response.json({ runs });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateRunRequest;
    const run = await createDraftRun({
      inputText: body.inputText ?? "",
      inputNotes: body.inputNotes ?? null
    });

    return Response.json({ run }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create the draft run.";

    return Response.json({ error: message }, { status: 400 });
  }
}
