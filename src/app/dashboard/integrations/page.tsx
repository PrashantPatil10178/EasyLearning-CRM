"use client";

import PageContainer from "@/components/layout/page-container";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CallerDeskForm } from "@/features/integrations/components/callerdesk-form";
import { AiSensyForm } from "@/features/integrations/components/aisensy-form";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

type IntegrationType = "callerdesk" | "aisensy" | null;

export default function IntegrationsPage() {
  const [selectedIntegration, setSelectedIntegration] =
    useState<IntegrationType>(null);

  const integrations = [
    {
      id: "callerdesk",
      name: "CallerDesk",
      description:
        "Cloud telephony integration for click-to-call and call logging.",
      logo: "/callerdesk.png",
      status: "available",
    },
    {
      id: "aisensy",
      name: "AiSensy",
      description: "WhatsApp Business API integration for automated messaging.",
      logo: "/AiSensy.png",
      status: "available",
    },
    {
      id: "razorpay",
      name: "Razorpay",
      description: "Payment gateway integration for collecting payments.",
      logo: null,
      status: "coming_soon",
    },
    {
      id: "zoom",
      name: "Zoom",
      description: "Video conferencing integration for meetings.",
      logo: null,
      status: "coming_soon",
    },
  ];

  return (
    <PageContainer>
      <div className="space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <div className="flex items-center gap-2">
            {selectedIntegration && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedIntegration(null)}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {selectedIntegration
                  ? selectedIntegration === "callerdesk"
                    ? "CallerDesk Configuration"
                    : "AiSensy Configuration"
                  : "Integrations"}
              </h2>
              <p className="text-muted-foreground">
                {selectedIntegration
                  ? "Manage your integration settings."
                  : "Manage your third-party integrations."}
              </p>
            </div>
          </div>
        </div>

        {!selectedIntegration ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => (
              <Card
                key={integration.id}
                className="flex flex-col transition-shadow hover:shadow-md"
              >
                <CardHeader className="flex flex-col items-center justify-center space-y-2 pb-2">
                  <div className="relative h-24 w-full overflow-hidden rounded-lg p-2">
                    {integration.logo ? (
                      <Image
                        src={integration.logo}
                        alt={integration.name}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center rounded-lg text-xl font-bold">
                        {integration.name}
                      </div>
                    )}
                  </div>
                  {integration.status === "coming_soon" && (
                    <Badge variant="secondary" className="mt-2">
                      Coming Soon
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="pb-4">
                  <CardDescription className="text-sm">
                    {integration.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="mt-auto pt-0">
                  <Button
                    className="w-full"
                    variant={
                      integration.status === "available" ? "default" : "outline"
                    }
                    disabled={integration.status !== "available"}
                    onClick={() => {
                      if (integration.status === "available") {
                        setSelectedIntegration(
                          integration.id as IntegrationType,
                        );
                      }
                    }}
                  >
                    {integration.status === "available"
                      ? "Configure"
                      : "Coming Soon"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {selectedIntegration === "callerdesk" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg border bg-white p-1">
                      <Image
                        src="/callerdesk.png"
                        alt="CallerDesk"
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div>
                      <CardTitle>CallerDesk Settings</CardTitle>
                      <CardDescription>
                        Configure API keys and call settings
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CallerDeskForm />
                </CardContent>
              </Card>
            )}
            {selectedIntegration === "aisensy" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg border bg-white p-1">
                      <Image
                        src="/AiSensy.png"
                        alt="AiSensy"
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div>
                      <CardTitle>AiSensy Settings</CardTitle>
                      <CardDescription>
                        Configure WhatsApp Business API settings
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <AiSensyForm />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
