import { clerk } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { USER_A, USER_B } from "./users";

async function signInAs(page: Page, emailAddress: string) {
  await page.goto("/");
  await clerk.signIn({ page, emailAddress });
  await page.goto("/shelf");
  await expect(page.getByRole("heading", { name: "My shelf" })).toBeVisible();
}

async function emptyShelf(page: Page) {
  await page.goto("/shelf");
  const books = page.getByTestId("shelf-book");
  while ((await books.count()) > 0) {
    await books.first().getByRole("link").nth(1).click();
    await page.getByRole("button", { name: "Remove from my shelf" }).click();
    await page.waitForURL("**/shelf");
  }
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

  const bookA = await saveFirstResult(pageA, "The Left Hand of Darkness");
  const bookB = await saveFirstResult(pageB, "Things Fall Apart");

  // A sees only A's book.
  await pageA.goto("/shelf");
  const shelfA = pageA.getByTestId("shelf-book");
  await expect(shelfA.filter({ hasText: bookA.title })).toHaveCount(1);
  await expect(shelfA.filter({ hasText: bookB.title })).toHaveCount(0);
  await expect(shelfA).toHaveCount(1);

  // B sees only B's book.
  await pageB.goto("/shelf");
  const shelfB = pageB.getByTestId("shelf-book");
  await expect(shelfB.filter({ hasText: bookB.title })).toHaveCount(1);
  await expect(shelfB.filter({ hasText: bookA.title })).toHaveCount(0);
  await expect(shelfB).toHaveCount(1);

  // Even with the exact URL, A can't open B's book.
  await pageA.goto(bookB.href);
  await expect(pageA.getByText("This page could not be found.")).toBeVisible();

  await contextA.close();
  await contextB.close();
});

test("a signed-out visitor sees no shelf", async ({ page }) => {
  await page.goto("/shelf");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByTestId("shelf-book")).toHaveCount(0);
});
