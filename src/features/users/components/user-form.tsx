"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useEffect } from "react";

const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MANAGER", "AGENT", "VIEWER"]),
  phone: z.string().optional(),
  teamId: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  onSuccess?: () => void;
}

export function UserForm({ onSuccess }: UserFormProps) {
  const utils = api.useUtils();
  const createUser = api.user.create.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      utils.user.getAll.invalidate();
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      // Show detailed error message
      const errorMessage = error.message || "Failed to create user";
      toast.error(errorMessage);
      console.error("User creation error:", error);
    },
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "AGENT",
      phone: "",
    },
  });

  const onSubmit = (data: UserFormValues) => {
    createUser.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {createUser.error && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              {createUser.error.message}
            </p>
          </div>
        )}
        <FormInput
          control={form.control}
          name="name"
          label="Name"
          placeholder="John Doe"
        />
        <FormInput
          control={form.control}
          name="email"
          label="Email"
          placeholder="john@example.com"
          type="email"
        />
        <FormInput
          control={form.control}
          name="password"
          label="Password"
          placeholder="******"
          type="password"
        />
        <FormSelect
          control={form.control}
          name="role"
          label="Role"
          options={[
            { label: "Admin", value: "ADMIN" },
            { label: "Manager", value: "MANAGER" },
            { label: "Agent", value: "AGENT" },
            { label: "Viewer", value: "VIEWER" },
          ]}
        />
        <FormInput
          control={form.control}
          name="phone"
          label="Phone (Optional)"
          placeholder="+1234567890"
        />
        <Button
          type="submit"
          className="w-full"
          disabled={createUser.isPending}
        >
          {createUser.isPending ? "Creating..." : "Create User"}
        </Button>
      </form>
    </Form>
  );
}
