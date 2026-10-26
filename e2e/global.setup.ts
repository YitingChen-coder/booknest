import { createClerkClient } from "@clerk/nextjs/server";
import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { USER_A, USER_B } from "./users";

setup.describe.configure({ mode: "serial" });

setup("get a Clerk testing token", async () => {
  // Lets the test browser get past Clerk's bot protection on the dev instance.
  await clerkSetup();
});

setup("make sure both test users exist", async () => {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  for (const emailAddress of [USER_A, USER_B]) {
    const { data } = await clerk.users.getUserList({ emailAddress: [emailAddress] });
    if (data.length === 0) {
      await clerk.users.createUser({
        emailAddress: [emailAddress],
        password: randomBytes(24).toString("base64url"),
        skipPasswordChecks: true,
      });
    }
  }
});
