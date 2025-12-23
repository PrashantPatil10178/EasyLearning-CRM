import UserViewPage from "@/features/users/components/user-view-page";
import { searchParamsCache } from "@/lib/searchparams";
import { SearchParams } from "nuqs/server";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page({ searchParams }: PageProps) {
  await searchParamsCache.parse(searchParams);

  return <UserViewPage />;
}
