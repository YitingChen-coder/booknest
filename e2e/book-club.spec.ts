import { clerk } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { USER_A, USER_B } from "./users";

async function signInAs(page: Page, emailAddress: string) {
  await page.goto("/");
  await clerk.signIn({ page, emailAddress });
}

/** Removes every book on this person's shelf (which also removes their shares). */
async function emptyShelf(page: Page) {
  await page.goto("/shelf");
  const heading = page.getByRole("heading", { name: "My shelf" });
  const books = page.getByTestId("shelf-book");
  for (let i = 0; i < 20; i++) {
    await expect(heading).toBeVisible();
    const before = await books.count();
    if (before === 0) return;
    await books.first().getByRole("link").nth(1).click();
    await page.getByRole("button", { name: "Remove from my shelf" }).click();
    await page.getByRole("button", { name: "Yes, remove" }).click();
    await page.waitForURL("**/shelf");
  }
}

async function shelfTitles(page: Page) {
  await page.goto("/shelf");
  await expect(page.getByRole("heading", { name: "My shelf" })).toBeVisible();
  return (await page.getByTestId("shelf-book-title").allTextContents()).map((t) => t.trim());
}

test("a shared book shows in the club, but the sharer's shelf and notes stay private", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  await signInAs(pageA, USER_A);
  await signInAs(pageB, USER_B);
  await emptyShelf(pageA);
  await emptyShelf(pageB);

  // A saves a book, writes a private note, and shares it with a public comment.
  const stamp = Date.now();
  const privateNote = `private note ${stamp}`;
  const comment = `club pick ${stamp}`;
  await pageA.goto(`/search?q=${encodeURIComponent("The Dispossessed")}`);
  const first = pageA.getByTestId("search-result").first();
  await expect(first).toBeVisible({ timeout: 20_000 });
  const title = (await first.getByRole("heading").textContent())!.trim();
  await first.getByRole("button", { name: "Save to shelf" }).click();
  await first.getByRole("link", { name: /On your shelf/ }).click();
  await pageA.getByPlaceholder("A quote, a thought, where you left off…").fill(privateNote);
  await pageA.getByRole("button", { name: "Add note" }).click();
  await expect(pageA.getByTestId("note").filter({ hasText: privateNote })).toBeVisible();
  await pageA.getByLabel("Show my name as").fill("Reader A");
  await pageA.getByLabel(/Why you recommend it/).fill(comment);
  await pageA.getByRole("button", { name: "Share to book club" }).click();
  await expect(pageA.getByTestId("my-share")).toBeVisible();

  // B sees the share in the club, with A's comment but not A's note.
  await pageB.goto("/club");
  const card = pageB.getByTestId("club-share").filter({ hasText: comment });
  // Streamed pages can briefly hold a second, hidden copy; wait for exactly one.
  await expect(card, "B can't see A's shared book in the club").toHaveCount(1);
  await expect(card).toBeVisible();
  await expect(card).toContainText(title);
  await expect(card).toContainText("Shared by Reader A");
  await expect(card.getByRole("button", { name: "Stop sharing" }), "B can remove A's share").toHaveCount(0);
  await expect(pageB.getByText(privateNote), "B can see A's private note").toHaveCount(0);

  // Sharing doesn't put the book on B's shelf; B saving it makes B's own copy.
  expect(await shelfTitles(pageB), "A's shared book leaked onto B's shelf").not.toContain(title);
  await pageB.goto("/club");
  await card.getByRole("button", { name: "Save to shelf" }).click();
  await expect(card.getByRole("link", { name: /On your shelf/ })).toBeVisible();
  expect(await shelfTitles(pageB), "B's shelf").toEqual([title]);
  expect(await shelfTitles(pageA), "A's shelf").toEqual([title]);

  // When A stops sharing, it leaves the club.
  await pageA.goto("/club");
  await pageA.getByTestId("club-share").filter({ hasText: comment }).getByRole("button", { name: "Stop sharing" }).click();
  await expect(pageA.getByTestId("club-share").filter({ hasText: comment })).toHaveCount(0);
  await pageB.goto("/club");
  await expect(pageB.getByTestId("club-share").filter({ hasText: comment })).toHaveCount(0);

  await contextA.close();
  await contextB.close();
});

test("a signed-out visitor can't see the book club", async ({ page }) => {
  await page.goto("/club");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByTestId("club-share")).toHaveCount(0);
});
