// Two test accounts. "+clerk_test" emails are Clerk test addresses: no real email is sent.
export const USER_A = process.env.E2E_USER_A_EMAIL ?? "booknest-reader-a+clerk_test@example.com";
export const USER_B = process.env.E2E_USER_B_EMAIL ?? "booknest-reader-b+clerk_test@example.com";
