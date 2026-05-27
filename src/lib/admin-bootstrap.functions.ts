import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_EMAIL = "admin@shatakshiherbal.com";
const ADMIN_PASSWORD = "shatakshiherbal";

/**
 * Ensures the canonical admin user exists with the expected password
 * and has the 'admin' role in user_roles. Idempotent.
 * Called once from the admin login page before sign-in.
 */
export const ensureAdminUser = createServerFn({ method: "POST" }).handler(
  async () => {
    // Try to find an existing user with the admin email
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw new Error(listErr.message);

    let user = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);

    if (!user) {
      const { data: created, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: "Shatakshi Herbal Admin" },
        });
      if (createErr) throw new Error(createErr.message);
      user = created.user!;
    } else {
      // Make sure password matches and account is confirmed
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
    }

    // Upsert admin role
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
    if (roleErr) throw new Error(roleErr.message);

    return { ok: true };
  },
);
