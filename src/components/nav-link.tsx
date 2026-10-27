"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`whitespace-nowrap rounded-md px-1.5 py-1.5 hover:bg-accent-soft sm:px-2 ${active ? "font-medium text-accent" : ""}`}
    >
      {children}
    </Link>
  );
}
