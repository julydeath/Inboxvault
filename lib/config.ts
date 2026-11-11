export function integrationReady() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.NEXTAUTH_SECRET &&
      process.env.DATABASE_URL &&
      /^[a-f\d]{64}$/i.test(process.env.TOKEN_ENCRYPTION_KEY || ""),
  );
}
