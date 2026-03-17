import { NextResponse } from "next/server";
import { defaultHuntConfig } from "@/data/hunt-config";
import { readHuntContent } from "@/lib/content-store";
import { readSharedProgress, writeSharedProgress } from "@/lib/progress-store";

type ValidatePayload = {
  action?: "validate" | "reset";
  stepId?: string;
  code?: string;
  adminPassword?: string;
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
  const action = payload.action ?? "validate";
  const stepId = payload.stepId ?? "";
  const code = (payload.code ?? "").trim();
  const adminPassword = (payload.adminPassword ?? "").trim();

  const { huntConfig, treasureSteps } = await readHuntContent();
  const progress = await readSharedProgress();

  if (action === "reset") {
    if (adminPassword !== huntConfig.admin.resetPassword) {
      return NextResponse.json(
        {
          error: huntConfig.admin.errorMessage ?? defaultHuntConfig.admin.errorMessage,
          ...progress
        },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const resetProgress = {
      validatedStepIds: []
    };

    await writeSharedProgress(resetProgress);

    return NextResponse.json(
      {
        ...resetProgress,
        message: huntConfig.admin.successMessage ?? defaultHuntConfig.admin.successMessage
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const currentStep = treasureSteps.find((step) => step.id === stepId);

  if (!currentStep) {
    return NextResponse.json(
      {
        error: "Boîte introuvable.",
        ...progress
      },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (progress.validatedStepIds.includes(currentStep.id)) {
    return NextResponse.json(
      {
        ...progress,
        message: currentStep.sellerMessage || huntConfig.successMessage
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  if (code !== currentStep.validationCode) {
    return NextResponse.json(
      {
        error: huntConfig.codeErrorMessage,
        ...progress
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const updated = {
    validatedStepIds: [...progress.validatedStepIds, currentStep.id]
  };

  await writeSharedProgress(updated);

  return NextResponse.json(
    {
      ...updated,
      message: currentStep.sellerMessage || huntConfig.successMessage
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
