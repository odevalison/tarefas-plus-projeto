import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { firebase } from "../../services/firebase";
import {
  doc,
  collection,
  query,
  where,
  getDoc,
  addDoc,
  orderBy,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { Inter } from "next/font/google";
import { Textarea } from "@/components/textarea";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FaTrash } from "react-icons/fa";

const inter = Inter({
  subsets: ["latin"],
});

const schema = z.object({
  comment: z.string().nonempty("Digite um comentário."),
});

type FormSchemaData = z.infer<typeof schema>;

type TaskProps = {
  task: {
    id: string;
    task: string;
    createdAt: string;
    isPublic: boolean;
    user: {
      name: string;
      email: string;
      image: string;
    };
  };
  allComments: CommentProps[];
};

type CommentProps = {
  id: string;
  comment: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    image: string;
  };
  taskId: string;
};

// Depois renderiza aqui, o client component.
export default function Task({ task, allComments }: TaskProps) {
  const [comments, setComments] = useState<CommentProps[]>(allComments || []);

  const { data: session } = useSession();

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormSchemaData>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      comment: "",
    },
  });

  async function handleMakeComment(data: FormSchemaData) {
    if (!session?.user) {
      return;
    }

    try {
      // 1 - Adiciona o documetno dentro da colletion "comments"
      const addedComment = await addDoc(collection(firebase, "comments"), {
        comment: data.comment,
        createdAt: new Date(),
        user: session.user,
        taskId: task.id,
      });

      // 2 - Cria uma referencia e pega o comentario adicionado
      const commentRef = await getDoc(
        doc(firebase, "comments", addedComment.id),
      );

      // 3 - Cria uma variavel p/ a data do comentario em milisegundos e adiciona dentro de um objeto
      const commentMiliseconds = commentRef.data()?.createdAt.seconds * 1000;
      const commentData = {
        id: commentRef.id,
        comment: data.comment,
        createdAt: new Date(commentMiliseconds).toLocaleDateString("pt-BR"),
        user: session.user as { name: string; email: string; image: string },
        taskId: task.id,
      };

      // 4 - Adiciona o objeto do comentario na useState e reseta os campos do formulario.
      setComments((oldComments) => [...oldComments, commentData]);
      reset();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDeleteComment(id: string) {
    const commentRef = doc(firebase, "comments", id);

    try {
      await deleteDoc(commentRef);

      const newCommentsList = comments.filter((comment) => comment.id !== id);
      setComments(newCommentsList);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div
      className={`${inter.className} mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-5 pt-12 pb-5 antialiased`}
    >
      <Head>
        <title>Detalhes da tarefa</title>
      </Head>

      <main className="w-full">
        <article className="flex flex-col justify-center gap-2 rounded-md border border-zinc-400 p-4 text-base/relaxed">
          <p className="w-full whitespace-pre-wrap">{task.task}</p>
          <p className="text-sm/tight text-black/45">
            Criada em {task.createdAt}
          </p>
        </article>
      </main>

      <section className="my-5 w-full">
        <h2 className="mt-16 mb-4 text-2xl/tight font-bold">
          Deixar comentário
        </h2>

        <form onSubmit={handleSubmit(handleMakeComment)}>
          <Textarea
            border
            {...register("comment")}
            placeholder="Digite seu comentário..."
          />
          {errors.comment && (
            <p className="mt-1 text-base/tight font-medium text-red-500">
              {errors.comment.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !session?.user}
            className="mt-6 w-full cursor-pointer rounded-md border-none bg-blue-500 py-3 text-lg/tight font-bold text-white disabled:cursor-not-allowed disabled:bg-blue-400 disabled:text-zinc-100"
          >
            {isSubmitting ? "Enviando comentário..." : "Enviar comentário"}
          </button>
        </form>
      </section>

      <section className="mt-14 w-full">
        <h2 className="mb-5 text-2xl/tight font-bold">Todos comentários</h2>

        {!comments.length && (
          <p className="text-lg/tight text-zinc-500">
            Nenhum comentário foi encontrado...
          </p>
        )}
        {comments &&
          comments.map((comment) => (
            <article
              key={comment.id}
              className="w-full rounded-md border border-zinc-300 p-4 has-[+*]:mb-3"
            >
              <div className="flex items-center gap-2">
                <label className="rounded bg-zinc-300 px-2 py-1 text-sm/tight">
                  {comment.user.name}
                </label>

                {session?.user?.email === comment.user.email && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="cursor-pointer text-red-500"
                  >
                    <FaTrash size={18} />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <p className="mt-4 text-base/relaxed whitespace-pre-wrap">
                  {comment.comment}
                </p>
                <p className="text-sm/tight text-black/45">
                  Criado em {comment.createdAt}
                </p>
              </div>
            </article>
          ))}
      </section>
    </div>
  );
}

// Primeiro passa por aqui: Server side
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.id as string;
  const docRef = doc(firebase, "tasks", id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.data()) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  } else if (!snapshot.data()?.isPublic) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const miliseconds = snapshot.data()?.createdAt?.seconds * 1000;
  const task = {
    task: snapshot.data()?.task,
    isPublic: snapshot.data()?.isPublic,
    createdAt: new Date(miliseconds).toLocaleDateString("pt-BR"),
    user: snapshot.data()?.user,
    id: snapshot.id,
  };

  const commentsQuery = query(
    collection(firebase, "comments"),
    where("taskId", "==", id),
  );

  const snapshotComments = await getDocs(commentsQuery);
  const commentsList = [] as CommentProps[];

  snapshotComments.forEach((comment) => {
    const commentMiliseconds = comment.data().createdAt.seconds * 1000;
    commentsList.push({
      id: comment.id,
      createdAt: new Date(commentMiliseconds).toLocaleDateString("pt-BR"),
      comment: comment.data().comment,
      taskId: comment.data().taskId,
      user: comment.data().user,
    });
  });

  return {
    props: {
      task: task,
      allComments: commentsList,
    },
  };
};
