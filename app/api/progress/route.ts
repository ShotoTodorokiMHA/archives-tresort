import { NextResponse } from "next/server";
import { huntConfig, treasureSteps } from "@/data/hunt-config";
import { readSharedProgress, writeSharedProgress } from "@/lib/progress-store";

type ValidatePayload = {
  stepId?: string;
  code?: string;
};

export async function GET() {
  const progress = await readSharedProgress();
  return NextResponse.json(progress, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as ValidatePayload;
  const stepId = payload.stepId ?? "";
  const code = (payload.code ?? "").trim();

  const progress = await readSharedProgress();
  const nextStep = treasureSteps[progress.validatedStepIds.length];

  if (!nextStep) {
    return NextResponse.json(
      {
        ...progress,
        message: huntConfig.successMessage
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  if (stepId !== nextStep.id) {
    return NextResponse.json(
      {
        error: "Cette etape n'est pas ouverte pour le moment.",
        ...progress
      },
      { status: 409, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (code !== nextStep.validationCode) {
    return NextResponse.json(
      {
        error: huntConfig.codeErrorMessage,
        ...progress
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const updated = {
    validatedStepIds: [...progress.validatedStepIds, nextStep.id]
  };

  await writeSharedProgress(updated);

  return NextResponse.json(
    {
      ...updated,
      message: huntConfig.successMessage
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
