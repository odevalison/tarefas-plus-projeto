import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Inter } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
});

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header
      className={`${inter.className} flex h-20 w-full items-center justify-center bg-zinc-950`}
    >
      <nav className="flex w-full max-w-5xl items-center justify-between px-5">
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="text-2xl/tight font-extrabold text-white sm:text-3xl/tight"
          >
            <h1>
              Tarefas<span className="text-red-500">+</span>
            </h1>
          </Link>

          {session?.user && (
            <Link
              href="/dashboard"
              className="rounded-md bg-zinc-100 px-3 py-1 text-sm/tight sm:text-base/tight"
            >
              Meu painel
            </Link>
          )}
        </div>

        {status === "loading" ? (
          <></>
        ) : session ? (
          <button
            onClick={() => signOut()}
            className="cursor-pointer rounded-full border border-white bg-transparent px-5 py-2 text-xs/tight font-medium text-white transition-all hover:bg-white hover:text-zinc-950 sm:text-base/tight"
          >
            Olá {session?.user?.name}
          </button>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="cursor-pointer rounded-full border border-white bg-transparent px-5 py-2 text-xs/tight font-medium text-white transition-all hover:bg-white hover:text-zinc-950 sm:text-base/tight"
          >
            Minha conta
          </button>
        )}
      </nav>
    </header>
  );
}
