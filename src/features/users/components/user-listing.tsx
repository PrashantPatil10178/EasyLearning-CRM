"use client";

import { api } from "@/trpc/react";
import { UserTable } from "./user-table";
import { columns } from "./columns";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

export function UserListing() {
  const searchParams = useSearchParams();
  const search = searchParams.get("name");

  const { data: users, isLoading } = api.user.getAll.useQuery({
    search: search || undefined,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Transform data if needed to match UserColumn
  const data =
    users?.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
    })) || [];

  return <UserTable data={data} totalItems={data.length} columns={columns} />;
}
