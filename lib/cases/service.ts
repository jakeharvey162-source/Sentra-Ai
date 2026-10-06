import type { SupabaseClient } from "@supabase/supabase-js";
import { assertSameOrigin, readBoundedJson, RequestError } from "../security/request";

export const PAGE_SIZE = 20;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const columns = "id,case_ref,kind,input_preview,risk_score,decision,explanation,created_at";
type Client = Pick<SupabaseClient, "auth" | "from">;

export async function caseRequest(request: Request, client: Client) {
  // Reject forged mutations before authentication or any database operation.
  let body: any;
  if (request.method === "POST") {
    assertSameOrigin(request, true);
    body = await readBoundedJson(request, 1024);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new RequestError("Invalid case request.", 400);
    if (!["delete", "deleteAll", "signOut"].includes(body.action)) throw new RequestError("Unknown case action.", 400);
    if (body.action === "delete" && (typeof body.id !== "string" || !uuid.test(body.id))) throw new RequestError("Invalid case ID.", 400);
    if (body.action === "deleteAll" && body.confirmation !== "DELETE ALL SAVED CASES") throw new RequestError("Confirm deletion of all saved cases.", 400);
  }
  const { data: auth, error: authError } = await client.auth.getUser();
  const user = auth.user;
  if (authError || !user || user.is_anonymous) throw new RequestError("Sign in to manage your saved cases.", 401);

  if (request.method === "POST") {
    if (body.action === "signOut") {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw new RequestError("Sign-out failed. Please try again.", 503);
      return { signedOut: true };
    }
    // Only server-verified identity supplies the owner filter. No client owner is trusted.
    let query = client.from("sentra_cases").delete().eq("user_id", user.id);
    if (body.action === "delete") query = query.eq("id", body.id);
    const { error } = await query;
    if (error) throw new RequestError("Cases could not be deleted. Please try again.", 503);
    // Identical response for a missing or another user's ID avoids revealing ownership.
    return { deleted: true };
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id !== null) {
    if (!uuid.test(id)) throw new RequestError("Invalid case ID.", 400);
    const { data: saved, error } = await client.from("sentra_cases").select(columns).eq("user_id", user.id).eq("id", id).maybeSingle();
    if (error) throw new RequestError("Case could not be loaded. Please try again.", 503);
    if (!saved) throw new RequestError("Case not found.", 404);
    const { data: evidence, error: evidenceError } = await client.from("sentra_evidence")
      .select("id,source,title,detail,severity,confidence,tags,attack_technique_ids").eq("user_id", user.id).eq("case_id", id).order("id").limit(100);
    if (evidenceError) throw new RequestError("Evidence could not be loaded. Please try again.", 503);
    return { case: saved, evidence: evidence ?? [] };
  }
  const rawPage = url.searchParams.get("page") ?? "0";
  if (!/^\d{1,4}$/.test(rawPage)) throw new RequestError("Invalid history page.", 400);
  const page = Number(rawPage);
  const { data, error } = await client.from("sentra_cases").select(columns).eq("user_id", user.id)
    .order("created_at", { ascending: false }).order("id", { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  if (error) throw new RequestError("History could not be loaded. Please try again.", 503);
  const rows = data ?? [];
  return { cases: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE, page, email: user.email ?? "" };
}
