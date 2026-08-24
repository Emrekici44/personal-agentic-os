import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { buildVaultWriteProposal, revalidateVaultWriteProposal } from "@/lib/obsidian-write-proposal";
import { publicApiError } from "@/lib/public-api-error";
import { approveVaultWriteProposal, listVaultWriteProposals, saveVaultWriteProposal, verifyLocalSession } from "@/lib/shared-store";

const headers = { "Cache-Control": "no-store, private" };
const authorized = (request: NextRequest) => verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);
const errorResponse = (error: unknown, status = 400) => NextResponse.json({ error: publicApiError(error, "Vault-Vorschlag konnte nicht sicher verarbeitet werden"), applyAvailable: false, writesPerformed: false, existingNotesModified: 0 }, { status, headers });

export async function GET(request: NextRequest) {
  if (!authorized(request)) return errorResponse(new Error("Lokale Sitzung erforderlich"), 401);
  return NextResponse.json({ proposals: listVaultWriteProposals(), applyAvailable: false, writesPerformed: false, existingNotesModified: 0 }, { headers });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return errorResponse(new Error("Lokale Sitzung erforderlich"), 401);
  try {
    const proposal = await buildVaultWriteProposal(await request.json());
    const approvalToken = crypto.randomBytes(32).toString("base64url");
    return NextResponse.json({ proposal: saveVaultWriteProposal(proposal, approvalToken), approvalToken, applyAvailable: false, writesPerformed: false, existingNotesModified: 0 }, { status: 201, headers });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return errorResponse(new Error("Lokale Sitzung erforderlich"), 401);
  try {
    const body = await request.json();
    if (body.action !== "approve_preview") throw new Error("Apply ist gesperrt; nur die Vorschau-Freigabe ist verfügbar");
    const proposal = listVaultWriteProposals(20).find((item) => item.id === String(body.proposalId || ""));
    if (!proposal) throw new Error("Vault-Vorschlag nicht gefunden");
    const revalidation = await revalidateVaultWriteProposal(proposal);
    return NextResponse.json({ proposal: approveVaultWriteProposal(proposal.id, String(body.approvalToken || ""), String(body.confirmation || ""), revalidation), applyAvailable: false, writesPerformed: false, existingNotesModified: 0 }, { headers });
  } catch (error) {
    return errorResponse(error);
  }
}
