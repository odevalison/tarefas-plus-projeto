import { Textarea } from "@/components/textarea";
import { firebase } from "@/services/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import type { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaTrash } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import { z } from "zod";
import { Inter } from "next/font/google";
import Link from "next/link";

export const inter = Inter({
  subsets: ["latin"],
});

interface DashboardProps {
  user: {
    email: string;
    name: string;
    image: string;
  };
}

type TasksListProps = Array<{
  id: string;
  task: string;
  createdAt: string;
  isPublic: boolean;
  user: {
    email: string;
    name: string;
    image: string;
  };
}>;

const schema = z.object({
  task: z.string().nonempty("Digite alguma tarefa."),
  isPublic: z.boolean().optional(),
});

type FormSchemaType = z.infer<typeof schema>;

export default function Dashboard({ user }: DashboardProps) {
  const [tasks, setTasks] = useState<TasksListProps>([]);

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      task: "",
      isPublic: false,
    },
  });

  useEffect(() => {
    const tasksRef = collection(firebase, "tasks");
    const tasksQuery = query(
      tasksRef,
      orderBy("createdAt", "desc"),
      where("user", "==", user),
    );

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const tasksList = [] as TasksListProps;

      snapshot.forEach((doc) => {
        const taskMiliseconds = doc.data().createdAt.seconds * 1000;
        tasksList.push({
          id: doc.id,
          task: doc.data().task,
          createdAt: new Date(taskMiliseconds).toLocaleDateString("pt-BR"),
          isPublic: doc.data().isPublic,
          user: doc.data().user,
        });
      });

      setTasks(tasksList);
    });

    return () => unsubscribe();
  }, [user, tasks]);

  async function handleSubmitForm(data: FormSchemaType) {
    try {
      await addDoc(collection(firebase, "tasks"), {
        isPublic: data.isPublic,
        createdAt: new Date(),
        task: data.task,
        user: user,
      });

      reset();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleShareTask(id: string) {
    await navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_URL}/task/${id}`,
    );
  }

  async function handleDeleteTask(id: string) {
    const docRef = doc(firebase, "tasks", id);

    await deleteDoc(docRef);
  }

  return (
    <div className={`w-full ${inter.className}`}>
      <Head>
        <title>Meu painel de tarefas</title>
      </Head>

      <main>
        <section className="flex w-full items-center justify-center bg-zinc-950 py-5">
          <div className="mx-auto w-full max-w-5xl px-5">
            <h1 className="mb-2 text-2xl/tight font-bold text-white">
              Qual sua tarefa?
            </h1>

            <form onSubmit={handleSubmit(handleSubmitForm)} className="w-full">
              <Textarea
                placeholder="Digite sua tarefa..."
                {...register("task")}
              />
              {errors.task && (
                <p className="mt-1 font-medium text-red-500">
                  {errors.task.message}
                </p>
              )}

              <label className="flex items-center gap-2 font-medium text-white">
                <input
                  type="checkbox"
                  className="my-3 size-5"
                  {...register("isPublic")}
                />
                Deixar tarefa pública?
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer rounded-md border-none bg-blue-500 py-2 text-lg font-medium text-white disabled:cursor-default disabled:bg-blue-400 disabled:text-zinc-100"
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </button>
            </form>
          </div>
        </section>

        <section className="mx-auto mt-9 w-full max-w-5xl">
          <h1 className="mb-8 text-center text-3xl/tight font-bold">
            Minhas tarefas
          </h1>

          {!!tasks &&
            tasks.map((task) => (
              <article
                key={task.id}
                className="mx-5 mb-4 flex flex-col items-start rounded-md border border-zinc-400 p-4 text-base/relaxed"
              >
                {task.isPublic && (
                  <div className="mb-3 flex items-center justify-center gap-2">
                    <label className="rounded-md bg-blue-500 px-3 py-1 text-sm/tight text-white">
                      Tarefa pública
                    </label>
                    <button
                      onClick={() => handleShareTask(task.id)}
                      className="cursor-pointer"
                    >
                      <FiShare2 size={20} color="#3183ff" />
                    </button>
                  </div>
                )}

                <div className="flex w-full items-center justify-between">
                  {task.isPublic ? (
                    <Link
                      href={`/task/${task.id}`}
                      className="flex flex-col gap-2"
                    >
                      <p className="text-base/relaxed whitespace-pre-wrap">
                        {task.task}
                      </p>
                      <p className="text-sm/tight text-black/45">
                        Criada em {task.createdAt}
                      </p>
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-base/relaxed whitespace-pre-wrap">
                        {task.task}
                      </p>
                      <p className="text-sm/tight text-black/45">
                        Criada em {task.createdAt}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="cursor-pointer text-red-500"
                  >
                    <FaTrash size={20} />
                  </button>
                </div>
              </article>
            ))}
        </section>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });

  if (!session?.user) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: { ...session.user },
    },
  };
};
