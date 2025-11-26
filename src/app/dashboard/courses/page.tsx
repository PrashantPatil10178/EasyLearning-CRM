import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconPlus, IconCurrencyRupee, IconCalendar } from "@tabler/icons-react";

const modeColors: Record<string, string> = {
  ONLINE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  OFFLINE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  HYBRID: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export default async function CoursesPage() {
  const session = await auth();

  if (!session) {
    return redirect("/signin");
  }

  // Check if user has permission
  if (session.user.role !== "ADMIN") {
    return redirect("/dashboard");
  }

  const courses = await api.course.getAll({});
  const upcomingBatches = await api.course.getUpcomingBatches();

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
            <p className="text-muted-foreground">
              Manage your courses and batches
            </p>
          </div>
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        </div>

        {/* Upcoming Batches */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {upcomingBatches.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground py-4">
                  No upcoming batches scheduled.
                </p>
              ) : (
                upcomingBatches.map((batch) => (
                  <Card key={batch.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <h4 className="font-medium">{batch.name}</h4>
                      <p className="text-muted-foreground text-sm">
                        {batch.course.name}
                      </p>
                      <div className="mt-2 flex items-center text-sm">
                        <IconCalendar className="mr-1 h-3 w-3" />
                        Starts: {new Date(batch.startDate).toLocaleDateString()}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="flex items-center text-sm font-medium text-green-600">
                          <IconCurrencyRupee className="h-3 w-3" />
                          {batch.course.price.toLocaleString()}
                        </span>
                        <Badge variant="secondary">
                          {batch.enrolledCount}/{batch.maxStudents}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Courses Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Courses ({courses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No courses added yet. Add your first course to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-mono font-medium">
                        {course.code}
                      </TableCell>
                      <TableCell className="font-medium">{course.name}</TableCell>
                      <TableCell>{course.category ?? "-"}</TableCell>
                      <TableCell>
                        <Badge className={modeColors[course.mode] ?? ""}>
                          {course.mode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="flex items-center font-medium">
                            <IconCurrencyRupee className="h-3 w-3" />
                            {course.price.toLocaleString()}
                          </span>
                          {course.discountPrice && (
                            <span className="flex items-center text-sm text-green-600">
                              <IconCurrencyRupee className="h-3 w-3" />
                              {course.discountPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {course.durationDays
                          ? `${course.durationDays} days`
                          : course.durationHours
                          ? `${course.durationHours} hours`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{course._count.batches}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.isActive ? "default" : "secondary"}>
                          {course.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
