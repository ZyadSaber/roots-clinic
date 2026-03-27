import { z } from "zod";
import type { StaffRole } from "@/types/staff";

const StaffRoleSchema = z.enum([
  "admin",
  "doctor",
  "receptionist",
  "finance",
]) satisfies z.ZodType<StaffRole>;

export const CreateUserSchema = z
  .object({
    email: z.string().email("validation.emailInvalid"),
    password: z
      .string()
      .min(8, "validation.passwordMin")
      .max(72, "validation.passwordMax"), // bcrypt limit
    username: z
      .string()
      .min(2, "validation.usernameMin")
      .max(50, "validation.usernameMax")
      .regex(/^[a-zA-Z0-9._-]+$/, "validation.usernameRegex"),
    full_name: z
      .string()
      .min(2, "validation.fullNameMin")
      .max(100, "validation.fullNameMax"),
    role: StaffRoleSchema,
    phone: z
      .string()
      .max(20, "validation.phoneMax")
      .optional()
      .or(z.literal("")),
    specialty_id: z
      .string()
      .uuid("validation.specialtyInvalid")
      .optional()
      .or(z.literal("")),
  })
  // specialty_id is required when role is doctor
  .superRefine((data, ctx) => {
    if (data.role === "doctor" && !data.specialty_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["specialty_id"],
        message: "validation.specialtyRequired",
      });
    }
    if (data.role !== "doctor" && data.specialty_id && data.specialty_id !== "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["specialty_id"],
        message: "validation.specialtyOnlyDoctor",
      });
    }
  });

export const UpdateUserSchema = z.object({
  id: z.string().uuid("validation.staffIdInvalid"),
  username: z
    .string()
    .min(2, "validation.usernameMin")
    .max(50, "validation.usernameMax")
    .regex(/^[a-zA-Z0-9._-]+$/, "validation.usernameRegex")
    .optional(),
  full_name: z
    .string()
    .min(2, "validation.fullNameMin")
    .max(100, "validation.fullNameMax")
    .optional(),
  role: StaffRoleSchema.optional(),
  phone: z.string().max(20, "validation.phoneMax").optional().or(z.literal("")),
  avatar_url: z
    .string()
    .url("validation.urlInvalid")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().optional(),
  specialty_id: z
    .string()
    .uuid("validation.specialtyInvalid")
    .optional()
    .or(z.literal("")),
})
  .superRefine((data, ctx) => {
    if (data.role === "doctor" && !data.specialty_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["specialty_id"],
        message: "validation.specialtyRequired",
      });
    }
  });

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "validation.passwordMin")
      .max(72, "validation.passwordMax"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.passwordsMustMatch",
    path: ["confirmPassword"],
  });
