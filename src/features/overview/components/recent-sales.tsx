import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const recentTestAttempts = [
  {
    name: "Rahul Sharma",
    email: "rahul.sharma@email.com",
    avatar: "https://api.slingacademy.com/public/sample-users/1.png",
    fallback: "RS",
    testName: "Physics Ch.1-5",
    score: "87%",
    status: "completed",
  },
  {
    name: "Priya Patel",
    email: "priya.patel@email.com",
    avatar: "https://api.slingacademy.com/public/sample-users/2.png",
    fallback: "PP",
    testName: "Chemistry Full",
    score: "92%",
    status: "completed",
  },
  {
    name: "Arjun Kumar",
    email: "arjun.kumar@email.com",
    avatar: "https://api.slingacademy.com/public/sample-users/3.png",
    fallback: "AK",
    testName: "Math Practice",
    score: "78%",
    status: "completed",
  },
  {
    name: "Sneha Reddy",
    email: "sneha.reddy@email.com",
    avatar: "https://api.slingacademy.com/public/sample-users/4.png",
    fallback: "SR",
    testName: "MHT CET Mock",
    score: "85%",
    status: "completed",
  },
  {
    name: "Vikram Singh",
    email: "vikram.singh@email.com",
    avatar: "https://api.slingacademy.com/public/sample-users/5.png",
    fallback: "VS",
    testName: "Physics Mock",
    score: "74%",
    status: "completed",
  },
];

export function RecentSales() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Test Attempts</CardTitle>
        <CardDescription>
          Latest test submissions from students.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {recentTestAttempts.map((attempt, index) => (
            <div key={index} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={attempt.avatar} alt="Avatar" />
                <AvatarFallback>{attempt.fallback}</AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm leading-none font-medium">
                  {attempt.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {attempt.testName}
                </p>
              </div>
              <div className="ml-auto">
                <Badge
                  variant={
                    parseInt(attempt.score) >= 85
                      ? "default"
                      : parseInt(attempt.score) >= 70
                        ? "secondary"
                        : "outline"
                  }
                >
                  {attempt.score}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
