import Head from "next/head";
import Image from "next/image";
import heroImg from "../../public/assets/hero.png";
import { Inter } from "next/font/google";
import type { GetStaticProps } from "next";
import { collection, getDocs } from "firebase/firestore";
import { firebase } from "@/services/firebase";
import { numberFormatter } from "@/utils/number-formatter";

interface HomeProps {
  posts: number;
  comments: number;
}

export const inter = Inter({
  subsets: ["latin"],
});

export default function Home({ comments, posts }: HomeProps) {
  return (
    <div
      className={`flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center bg-zinc-950 ${inter.className}`}
    >
      <Head>
        <title>Tarefas+ | Organize suas tarefas de forma fácil</title>
      </Head>

      <main className="w-full max-w-5xl">
        <div className="flex flex-col items-center justify-center">
          <Image
            priority
            src={heroImg}
            alt="Logo do Tarefas+"
            className="h-auto w-auto max-w-4/5 object-contain sm:max-w-lg"
          />
        </div>

        <h1 className="mt-16 mb-14 text-center text-2xl/relaxed font-extrabold text-white sm:text-3xl/relaxed">
          Sistema feito para você organizar
          <br />
          seus estudos e terefas
        </h1>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
          <section className="w-4/5 cursor-pointer rounded-lg bg-zinc-100 px-14 py-3 text-center text-base/tight font-bold transition-transform hover:scale-105 sm:w-auto sm:text-lg/tight">
            <span>+ {numberFormatter(posts)} posts</span>
          </section>
          <section className="w-4/5 cursor-pointer rounded-lg bg-zinc-100 px-14 py-3 text-center text-base/tight font-bold transition-transform hover:scale-105 sm:w-auto sm:text-lg/tight">
            <span>+ {numberFormatter(comments)} comentários</span>
          </section>
        </div>
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const commentsRef = collection(firebase, "comments");
  const comments = await getDocs(commentsRef);

  const postsRef = collection(firebase, "tasks");
  const posts = await getDocs(postsRef);

  return {
    props: {
      posts: posts.size || 0,
      comments: comments.size || 0,
    },
    revalidate: 3600,
  };
};
