import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { NavLink } from "@/components/nav-link";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-serif text-xl font-semibold tracking-tight">
          BookNest
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-3">
          <Show when="signed-in">
            <NavLink href="/search">Search</NavLink>
            <NavLink href="/shelf">My shelf</NavLink>
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton>
              <button className="rounded-md px-3 py-1.5 hover:bg-accent-soft">Sign in</button>
            </SignInButton>
            <SignUpButton>
              <button className="rounded-md bg-accent px-3 py-1.5 font-medium text-background hover:opacity-90">
                Sign up
              </button>
            </SignUpButton>
          </Show>
        </nav>
      </div>
    </header>
  );
}
