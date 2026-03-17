import { NextResponse } from "next/server";
import { HuntContent } from "@/data/hunt-config";
import { readHuntContent, writeHuntContent } from "@/lib/content-store";

type ContentPayload = {
  adminPassword?: string;
  huntConfig?: unknown;
  treasureSteps?: unknown;
};

export async function GET() {
  const content = await readHuntContent();
  return NextResponse.json(content, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as ContentPayload;
  const content = await readHuntContent();
  const adminPassword = (payload.adminPassword ?? "").trim();

  if (adminPassword !== content.huntConfig.admin.resetPassword) {
    return NextResponse.json(
      {
        error: content.huntConfig.admin.errorMessage
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }

  const nextContent: HuntContent = {
    huntConfig: (payload.huntConfig as HuntContent["huntConfig"] | undefined) ?? content.huntConfig,
    treasureSteps:
      (payload.treasureSteps as HuntContent["treasureSteps"] | undefined) ?? content.treasureSteps
  };

  await writeHuntContent(nextContent);

  return NextResponse.json(
    {
      message: "Contenu mis a jour.",
      ...nextContent
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
