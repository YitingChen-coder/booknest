import { auth } from "@clerk/nextjs/server";

export default async function ShelfPage() {
  // The proxy already blocks signed-out visitors; this is a second check on the server.
  await auth.protect();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">My shelf</h1>
      <p className="mt-2 text-muted">Your saved books will show up here.</p>
    </div>
  );
}
