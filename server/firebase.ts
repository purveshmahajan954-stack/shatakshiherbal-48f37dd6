export interface FirebaseUser {
  uid: string;
  phone: string | null;
  email: string | null;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseUser | null> {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    console.error("[Firebase] FIREBASE_API_KEY not set");
    return null;
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[Firebase] Token verification failed:", res.status, err.slice(0, 200));
      return null;
    }

    const data = await res.json();
    const user = data.users?.[0];
    if (!user) return null;

    return {
      uid: user.localId,
      phone: user.phoneNumber ?? null,
      email: user.email ?? null,
    };
  } catch (err: any) {
    console.error("[Firebase] verifyFirebaseIdToken error:", err?.message);
    return null;
  }
}
