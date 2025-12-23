import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { UserListing } from "./user-listing";
import { UserCreateDialog } from "./user-create-dialog";

export default function UserViewPage() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex h-full flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading title="Users" description="Manage users and their roles." />
          <UserCreateDialog />
        </div>
        <Separator />
        <UserListing />
      </div>
    </PageContainer>
  );
}
