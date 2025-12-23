"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  IconCurrencyRupee,
  IconCheck,
  IconClock,
  IconX,
  IconCalendar,
} from "@tabler/icons-react";
import { AddPaymentDialog } from "./add-payment-dialog";
import { api } from "@/trpc/react";

interface PaymentTrackerProps {
  dealId: string;
  dealAmount: number;
  totalPaid: number;
  paymentStatus: string;
}

const paymentStatusConfig: Record<
  string,
  { label: string; color: string; icon: typeof IconCheck }
> = {
  PENDING: {
    label: "Pending",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    icon: IconClock,
  },
  PARTIALLY_PAID: {
    label: "Partially Paid",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: IconClock,
  },
  COMPLETED: {
    label: "Paid",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: IconCheck,
  },
  FAILED: {
    label: "Failed",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: IconX,
  },
};

export function PaymentTracker({
  dealId,
  dealAmount,
  totalPaid,
  paymentStatus,
}: PaymentTrackerProps) {
  // TODO: Implement payment.getByDeal query in the router
  const payments: any[] = [];
  const isLoading = false;
  // const { data: payments, isLoading } = api.payment.getByDeal.useQuery({
  //   dealId,
  // });

  const config =
    paymentStatusConfig[paymentStatus] || paymentStatusConfig.PENDING!;
  const Icon = config.icon;
  const remainingAmount = dealAmount - totalPaid;
  const progressPercentage = (totalPaid / dealAmount) * 100;

  return (
    <div className="space-y-4">
      {/* Payment Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">
            Payment Status
          </CardTitle>
          <Badge className={config.color}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {config.label}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Total Amount
                </p>
                <p className="mt-1 text-lg font-bold">
                  ₹{dealAmount.toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Paid
                </p>
                <p className="mt-1 text-lg font-bold text-green-600">
                  ₹{totalPaid.toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Remaining
                </p>
                <p className="mt-1 text-lg font-bold text-orange-600">
                  ₹{remainingAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium">
                  Payment Progress
                </span>
                <span className="text-xs font-medium">
                  {progressPercentage.toFixed(0)}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            <AddPaymentDialog
              dealId={dealId}
              dealAmount={dealAmount}
              totalPaid={totalPaid}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : !payments || payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No payments recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <IconCurrencyRupee className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">
                        ₹{payment.amount.toLocaleString("en-IN")}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {payment.paymentMode}
                      </Badge>
                    </div>
                    {payment.transactionId && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        TXN: {payment.transactionId}
                      </p>
                    )}
                    {payment.notes && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {payment.notes}
                      </p>
                    )}
                    {payment.paymentDate && (
                      <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                        <IconCalendar className="h-3 w-3" />
                        {new Date(payment.paymentDate).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </div>
                    )}
                  </div>
                  <Badge
                    className={
                      payment.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : payment.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
