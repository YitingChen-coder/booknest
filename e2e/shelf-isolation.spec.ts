import { clerk } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { USER_A, USER_B } from "./users";

async function signInAs(page: Page, emailAddress: string) {
  await page.goto("/");
  await clerk.signIn({ page, emailAddress });
  await page.goto("/shelf");
  await expect(page.getByRole("heading", { name: "My shelf" })).toBeVisible();
}

/** Removes the books this person can remove. Stops if a removal doesn't shrink the shelf. */
async function emptyShelf(page: Page) {
  await page.goto("/shelf");
  const books = page.getByTestId("shelf-book");
  for (let i = 0; i < 20; i++) {
    const before = await books.count();
    if (before === 0) return;
    await books.first().getByRole("link").nth(1).click();
    await page.getByRole("button", { name: "Remove from my shelf" }).click();
    await page.waitForURL("**/shelf");
    if ((await books.count()) >= before) return;
  }
}

async function shelfTitles(page: Page) {
  await page.goto("/shelf");
  await expect(page.getByRole("heading", { name: "My shelf" })).toBeVisible();
  return (await page.getByTestId("shelf-book-title").allTextContents()).map((t) => t.trim());
}

/** Searches, saves the first result, and returns its title and its /shelf/<id> URL. */
async function saveFirstResult(page: Page, query: string) {
  await page.goto(`/search?q=${encodeURIComponent(query)}`);
  const first = page.getByTestId("search-result").first();
  await expect(first).toBeVisible({ timeout: 20_000 });
  const title = (await first.getByRole("heading").textContent())!.trim();

  await first.getByRole("button", { name: "Save to shelf" }).click();
  const savedLink = first.getByRole("link", { name: /On your shelf/ });
  await expect(savedLink).toBeVisible();
  return { title, href: (await savedLink.getAttribute("href"))! };
}

test("two readers cannot see each other's shelves", async ({ browser }) => {
  // Separate browser contexts = two different people on two different devices.
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await signInAs(pageA, USER_A);
  await signInAs(pageB, USER_B);
  await emptyShelf(pageA);
  await emptyShelf(pageB);

  // A saves a book. B must not see it.
  const bookA = await saveFirstResult(pageA, "The Left Hand of Darkness");
  expect(await shelfTitles(pageB), "B can see A's book on B's shelf").not.toContain(bookA.title);

  // B saves a different book. A must not see it.
  const bookB = await saveFirstResult(pageB, "Things Fall Apart");
  expect(await shelfTitles(pageA), "A can see B's book on A's shelf").not.toContain(bookB.title);

  // Each shelf holds exactly that person's one book.
  expect(await shelfTitles(pageA), "A's shelf").toEqual([bookA.title]);
  expect(await shelfTitles(pageB), "B's shelf").toEqual([bookB.title]);

  // Even with the exact URL, A can't open B's book.
  await pageA.goto(bookB.href);
  await expect(pageA.getByText("This page could not be found."), "A opened B's book by URL").toBeVisible();

  await contextA.close();
  await contextB.close();
});

test("a signed-out visitor sees no shelf", async ({ page }) => {
  await page.goto("/shelf");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByTestId("shelf-book")).toHaveCount(0);
});
