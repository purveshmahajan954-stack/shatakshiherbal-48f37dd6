export const lovable = {
  auth: {
    signInWithOAuth: async (_provider: string, _opts?: unknown) => {
      return { error: new Error("OAuth is not supported in this environment.") };
    },
  },
};
