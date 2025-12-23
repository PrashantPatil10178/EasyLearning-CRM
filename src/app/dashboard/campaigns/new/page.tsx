import PageContainer from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateCampaignForm } from "@/components/forms/create-campaign-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default function CreateCampaignPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <Breadcrumbs />
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Create Campaign</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateCampaignForm />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
