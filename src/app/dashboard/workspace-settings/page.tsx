"use client";

import { useState } from "react";
import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Type,
  Hash,
  List,
  Calendar,
  CheckSquare,
  Mail,
  Phone,
  GripVertical,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const fieldTypes = [
  {
    value: "TEXT",
    label: "Text",
    icon: Type,
    description: "Single line text input",
  },
  {
    value: "NUMBER",
    label: "Number",
    icon: Hash,
    description: "Numeric input field",
  },
  {
    value: "SELECT",
    label: "Dropdown",
    icon: List,
    description: "Select from options",
  },
  {
    value: "DATE",
    label: "Date",
    icon: Calendar,
    description: "Date picker",
  },
  {
    value: "BOOLEAN",
    label: "Checkbox",
    icon: CheckSquare,
    description: "Yes/No toggle",
  },
  {
    value: "EMAIL",
    label: "Email",
    icon: Mail,
    description: "Email address validation",
  },
  {
    value: "PHONE",
    label: "Phone",
    icon: Phone,
    description: "Phone number input",
  },
];

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  key: z
    .string()
    .min(1, "Key is required")
    .regex(
      /^[a-z0-9_]+$/,
      "Key must be lowercase alphanumeric with underscores",
    ),
  type: z.enum([
    "TEXT",
    "NUMBER",
    "SELECT",
    "DATE",
    "BOOLEAN",
    "EMAIL",
    "PHONE",
  ]),
  options: z.string().optional(), // Comma separated for UI, converted to JSON for API
  isVisible: z.boolean().default(true),
  isRequired: z.boolean().default(false),
});

export default function WorkspaceSettingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const utils = api.useUtils();
  const { data: fields, isLoading } = api.settings.getLeadFields.useQuery();
  const upsertMutation = api.settings.upsertLeadField.useMutation({
    onSuccess: () => {
      toast.success(editingField ? "Field updated" : "Field created");
      setIsDialogOpen(false);
      setEditingField(null);
      form.reset();
      utils.settings.getLeadFields.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const toggleVisibilityMutation =
    api.settings.toggleLeadFieldVisibility.useMutation({
      onSuccess: () => {
        utils.settings.getLeadFields.invalidate();
      },
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      key: "",
      type: "TEXT",
      options: "",
      isVisible: true,
      isRequired: false,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    let optionsJson = undefined;
    if (values.type === "SELECT" && values.options) {
      const opts = values.options
        .split(",")
        .map((o) => o.trim())
        .filter((o) => o);
      optionsJson = JSON.stringify(opts);
    }

    upsertMutation.mutate({
      ...values,
      options: optionsJson,
    });
  };

  const handleEdit = (field: any) => {
    setEditingField(field);
    let optionsStr = "";
    if (field.options) {
      try {
        const opts = JSON.parse(field.options);
        if (Array.isArray(opts)) {
          optionsStr = opts.join(", ");
        }
      } catch (e) {}
    }

    form.reset({
      id: field.id,
      name: field.name,
      key: field.key,
      type: field.type,
      options: optionsStr,
      isVisible: field.isVisible,
      isRequired: field.isRequired,
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingField(null);
    form.reset({
      name: "",
      key: "",
      type: "TEXT",
      options: "",
      isVisible: true,
      isRequired: false,
    });
    setIsDialogOpen(true);
  };

  const filteredFields = fields?.filter((field) => {
    const matchesSearch = field.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "ALL" || field.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getIcon = (type: string) => {
    const t = fieldTypes.find((ft) => ft.value === type);
    const Icon = t?.icon || Type;
    return <Icon className="text-muted-foreground h-4 w-4" />;
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Fields Settings
            </h2>
            <p className="text-muted-foreground">
              Manage custom fields for your leads.
            </p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Add a new field
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                Primary Fields (Assign)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="bg-muted/50 flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <div className="bg-background text-muted-foreground flex h-8 w-8 items-center justify-center rounded border font-mono text-xs">
                  H1
                </div>
                <Type className="text-muted-foreground h-4 w-4" />
                <span className="font-medium">Name</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" disabled>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="bg-muted/50 flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <div className="bg-background text-muted-foreground flex h-8 w-8 items-center justify-center rounded border font-mono text-xs">
                  H2
                </div>
                <Phone className="text-muted-foreground h-4 w-4" />
                <span className="font-medium">Phone</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" disabled>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Search..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {fieldTypes.map((ft) => (
                  <SelectItem key={ft.value} value={ft.value}>
                    {ft.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" /> Active Fields
            </Button>
          </div>

          <div className="text-muted-foreground text-sm">
            {filteredFields?.length || 0} results found
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </div>
            ) : (
              filteredFields?.map((field) => (
                <div
                  key={field.id}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-md border p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="text-muted-foreground h-4 w-4 cursor-move" />
                    <div className="bg-muted flex h-8 w-8 items-center justify-center rounded border">
                      {getIcon(field.type)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{field.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {field.key}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(field)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        toggleVisibilityMutation.mutate({
                          id: field.id,
                          isVisible: !field.isVisible,
                        })
                      }
                    >
                      {field.isVisible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="text-muted-foreground h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingField ? "Edit Field" : "Add New Field"}
              </DialogTitle>
              <DialogDescription>
                Configure the properties for this lead field.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Course Interested"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Key</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. course_interested"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for the field (lowercase,
                        underscores).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-auto py-2">
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fieldTypes.map((ft) => (
                            <SelectItem
                              key={ft.value}
                              value={ft.value}
                              className="py-2"
                            >
                              <div className="flex items-start gap-3">
                                <ft.icon className="text-muted-foreground mt-0.5 h-4 w-4" />
                                <div className="flex flex-col gap-0.5 text-left">
                                  <span className="font-medium">
                                    {ft.label}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {ft.description}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("type") === "SELECT" && (
                  <FormField
                    control={form.control}
                    name="options"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Options</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Option 1, Option 2, Option 3"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Comma separated list of options.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="isVisible"
                    render={({ field }) => (
                      <FormItem className="flex flex-1 flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Visible</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-1 flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Required</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={upsertMutation.isPending}>
                    {upsertMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Field
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
