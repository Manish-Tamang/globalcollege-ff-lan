import { NextResponse, type NextRequest } from "next/server";
import { getAnonSupabase } from "@/app/lib/supabase/server";
import { teamNameSchema } from "@/app/lib/registration-schema";

/** GET /api/team-name?name=… → { available: boolean } */
export async function GET(request: NextRequest) {
  const parsed = teamNameSchema.safeParse(
    request.nextUrl.searchParams.get("name") ?? "",
  );
  if (!parsed.success) {
    return NextResponse.json(
      { available: false, error: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }

  const supabase = getAnonSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Registration is not configured yet." },
      { status: 503 },
    );
  }

  const { data, error } = await supabase.rpc("team_name_available", {
    p_name: parsed.data,
  });
  if (error) {
    return NextResponse.json(
      { error: "Could not check the team name." },
      { status: 500 },
    );
  }
  return NextResponse.json({ available: Boolean(data) });
}
