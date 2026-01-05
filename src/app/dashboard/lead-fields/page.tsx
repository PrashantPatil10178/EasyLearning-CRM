import { Suspense } from "react";
import PageContainer from "@/components/layout/page-container";
import { LeadFieldsView } from "./_components/lead-fields-view";
import { Loader2 } from "lucide-react";

export default function LeadFieldsPage() {
  return (
    <PageContainer>
      <Suspense
        fallback={
          <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        }
      >
        <LeadFieldsView />
      </Suspense>
    </PageContainer>
  );
}
