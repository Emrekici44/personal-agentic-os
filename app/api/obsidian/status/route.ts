import { NextResponse } from "next/server";

import { readVaultPreview, vaultConfigured } from "@/lib/obsidian-vault";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!vaultConfigured()) {
    return NextResponse.json(
      {
        approvalRequired: true,
        configured: false,
        readOnly: true,
        status: "unconfigured",
        writesEnabled: false,
      },
      { headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const preview = await readVaultPreview();
    return NextResponse.json(
      { ...preview, configured: true },
      { headers: { "cache-control": "no-store" } },
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
      },
      { headers: { "cache-control": "no-store" }, status: 503 },
    );
  }
}
