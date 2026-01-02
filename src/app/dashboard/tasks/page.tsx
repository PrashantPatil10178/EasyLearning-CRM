import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/server";
import { TaskView } from "./_components/task-view";

export default async function TasksPage() {
  const session = await auth();

  if (!session) {
    return redirect("/signin");
  }

  const { tasks, total } = await api.task.getAll({ page: 1, limit: 50 });
  const stats = await api.task.getStats();

  return (
    <PageContainer>
      <TaskView initialTasks={tasks} initialStats={stats} total={total} />
    </PageContainer>
  );
}
