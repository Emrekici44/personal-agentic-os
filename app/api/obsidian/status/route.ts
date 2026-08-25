import { NextRequest, NextResponse } from "next/server";

import { readVaultPreview, vaultConfigured } from "@/lib/obsidian-vault";
import { verifyLocalSession } from "@/lib/shared-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value)) {
    return NextResponse.json(
      { error: "Lokale Sitzung erforderlich", readOnly: true, writesEnabled: false, controlledActionsAvailable: false },
      { headers: { "cache-control": "no-store, private" }, status: 401 },
    );
  }
  if (!vaultConfigured()) {
    return NextResponse.json(
      {
        approvalRequired: true,
        configured: false,
        readOnly: true,
        status: "unconfigured",
        writesEnabled: false,
        controlledActionsAvailable: false,
      },
      { headers: { "cache-control": "no-store, private" } },
    );
  }

  try {
    const preview = await readVaultPreview();
    return NextResponse.json(
      { ...preview, configured: true, controlledActionsAvailable: true, directWritesEnabled: false },
      { headers: { "cache-control": "no-store, private" } },
    );
  } catch {
    return NextResponse.json(
      {
        approvalRequired: true,
        configured: true,
        error: "Vault konnte lokal nicht gelesen werden",
        readOnly: true,
        status: "degraded",
        writesEnabled: false,
        controlledActionsAvailable: false,
      },
      { headers: { "cache-control": "no-store, private" }, status: 503 },
    );
  }
}
