import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase-admin.js";
import { supabaseAnon } from "../lib/supabase-anon.js";

// Demo-only table, separate from the production `consumers` table.
const TABLE = "demo_consumers";
const COLS =
  "id, consumer_number, first_name, middle_name, last_name, email, account_status";

// ── snake_case DB row <-> camelCase app object ──────────────────────────────
const s = (v) => v ?? "";

function rowToConsumer(row) {
  return {
    id: row.id,
    consumerNumber: row.consumer_number ?? 0,
    firstName: row.first_name,
    middleName: s(row.middle_name),
    lastName: row.last_name,
    email: row.email,
    accountStatus: row.account_status,
  };
}

function consumerToRow(input) {
  const row = {};
  if (input.firstName !== undefined) row.first_name = input.firstName;
  if (input.middleName !== undefined) row.middle_name = input.middleName;
  if (input.lastName !== undefined) row.last_name = input.lastName;
  if (input.email !== undefined) row.email = input.email;
  if (input.accountStatus !== undefined) row.account_status = input.accountStatus;
  return row;
}

// ── Auth guard: proves the API is protected server-side, not just the UI ────
async function requireAuth(req, res, next) {
  const token = req.cookies["sb-access-token"];
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export const consumersRouter = Router();
consumersRouter.use(requireAuth); // every route below requires a valid cookie

/** GET /api/consumers -> { consumers: Consumer[] } */
consumersRouter.get("/", async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select(COLS)
    .order("consumer_number", { ascending: true });

  if (error) return res.status(500).json({ message: error.message });
  res.json({ consumers: data.map(rowToConsumer) });
});

/** POST /api/consumers -> { consumer: Consumer } */
consumersRouter.post("/", async (req, res) => {
  const body = req.body;
  if (
    !body ||
    typeof body.firstName !== "string" ||
    typeof body.lastName !== "string" ||
    typeof body.email !== "string"
  ) {
    return res
      .status(400)
      .json({ message: "firstName, lastName, and email are required" });
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert(consumerToRow(body))
    .select(COLS)
    .single();

  if (error) return res.status(400).json({ message: error.message });
  res.status(201).json({ consumer: rowToConsumer(data) });
});

/** GET /api/consumers/:id -> { consumer: Consumer } */
consumersRouter.get("/:id", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select(COLS)
    .eq("id", req.params.id)
    .single();

  if (error) {
    // PGRST116 = 0 rows; 22P02 = id isn't a valid UUID. Both mean "no such
    // consumer" -> a clean 404 instead of leaking the raw Postgres message.
    if (error.code === "PGRST116" || error.code === "22P02") {
      return res.status(404).json({ message: "Consumer not found" });
    }
    return res.status(500).json({ message: error.message });
  }

  res.json({ consumer: rowToConsumer(data) });
});

/** DELETE /api/consumers/:id -> { message: string } */
consumersRouter.delete("/:id", async (req, res) => {
  const { error } = await supabaseAdmin
    .from(TABLE)
    .delete()
    .eq("id", req.params.id);

  if (error) return res.status(400).json({ message: error.message });
  res.json({ message: "Consumer deleted" });
});
