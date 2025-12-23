import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader, StatusBadge, EmptyState } from "@/components/dashboard";
import {
  IconPlus,
  IconCurrencyRupee,
  IconCalendar,
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconUsers,
  IconBook,
  IconClock,
  IconEye,
} from "@tabler/icons-react";

const modeConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  ONLINE: {
    label: "Online",
    color: "text-blue-700",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  OFFLINE: {
    label: "Offline",
    color: "text-green-700",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  HYBRID: {
    label: "Hybrid",
    color: "text-purple-700",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
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
        <PageHeader
          title="Courses"
          description="Manage your courses and batches"
          action={{
            label: "Add Course",
            icon: IconPlus,
          }}
        />

        {/* Upcoming Batches */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Upcoming Batches</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {upcomingBatches.length === 0 ? (
              <Card className="col-span-full border-2 border-dashed">
                <CardContent className="p-8 text-center">
                  <IconCalendar className="text-muted-foreground mx-auto h-10 w-10" />
                  <p className="text-muted-foreground mt-3">
                    No upcoming batches scheduled.
                  </p>
                  <Button variant="outline" className="mt-4">
                    <IconPlus className="mr-2 h-4 w-4" />
                    Schedule Batch
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcomingBatches.map((batch) => (
                <Card
                  key={batch.id}
                  className="group border-l-4 border-l-blue-500 transition-all hover:shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="group-hover:text-primary font-semibold transition-colors">
                          {batch.name}
                        </h4>
                        <p className="text-muted-foreground mt-0.5 text-sm">
                          {batch.course.name}
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {batch.enrolledCount}/{batch.maxStudents}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-sm">
                      <IconCalendar className="h-4 w-4 text-blue-500" />
                      <span>
                        Starts:{" "}
                        {new Date(batch.startDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="flex items-center font-semibold text-green-600">
                        <IconCurrencyRupee className="h-4 w-4" />
                        {batch.course.price.toLocaleString()}
                      </span>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Courses Table */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <CardTitle>All Courses ({courses.length})</CardTitle>
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="inactive">Inactive</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="relative">
                <IconSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search courses..."
                  className="w-[250px] pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Course</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Mode</TableHead>
                  <TableHead className="font-semibold">Price</TableHead>
                  <TableHead className="font-semibold">Duration</TableHead>
                  <TableHead className="font-semibold">Batches</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="w-20 text-right font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-[400px]">
                      <EmptyState
                        icon={IconBook}
                        title="No courses added yet"
                        description="Add your first course to start managing your offerings."
                        action={{ label: "Add Course" }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map((course) => {
                    const mode = modeConfig[course.mode] ?? {
                      label: course.mode,
                      color: "text-gray-700",
                      bgColor: "bg-gray-100",
                    };

                    return (
                      <TableRow
                        key={course.id}
                        className="group hover:bg-muted/50 cursor-pointer"
                      >
                        <TableCell>
                          <span className="text-primary font-mono text-sm font-medium">
                            {course.code}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <span className="group-hover:text-primary font-medium transition-colors">
                              {course.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-sm">
                            {course.category ?? "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${mode.bgColor} ${mode.color}`}
                          >
                            {mode.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="flex items-center font-medium">
                              <IconCurrencyRupee className="h-3.5 w-3.5" />
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
                          <span className="flex items-center gap-1 text-sm">
                            <IconClock className="text-muted-foreground h-3.5 w-3.5" />
                            {course.durationDays
                              ? `${course.durationDays} days`
                              : course.durationHours
                                ? `${course.durationHours} hours`
                                : "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <IconUsers className="text-muted-foreground h-4 w-4" />
                            <Badge variant="secondary">
                              {course._count.batches}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={course.isActive ? "default" : "secondary"}
                            className={
                              course.isActive
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : ""
                            }
                          >
                            {course.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                              >
                                <IconDotsVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <IconEye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconEdit className="mr-2 h-4 w-4" />
                                Edit Course
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconPlus className="mr-2 h-4 w-4" />
                                Add Batch
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <IconTrash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
