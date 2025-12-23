import { ProfileForm } from "@/features/profile/components/profile-form";
import PageContainer from "@/components/layout/page-container";

export const metadata = {
  title: "Dashboard : Profile",
};

export default function Page() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <ProfileForm />
      </div>
    </PageContainer>
  );
}
