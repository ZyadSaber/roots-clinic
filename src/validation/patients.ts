import { z } from "zod";

export const patientFormSchema = z
  .object({
    // Required
    full_name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be at most 100 characters"),

    phone: z
      .string()
      .min(7, "Phone number is too short")
      .max(20, "Phone number is too long")
      .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format"),

    age: z.number(),

    // Personal Info
    email: z
      .string()
      .email("Invalid email address")
      .max(100)
      .optional()
      .or(z.literal("")),

    dob: z.date("Invalid date").optional().or(z.literal("")),

    gender: z.enum(["male", "female"]).optional(),

    address: z
      .string()
      .max(500, "Address is too long")
      .optional()
      .or(z.literal("")),

    // Emergency Contact
    emergency_contact_name: z.string().max(100).optional().or(z.literal("")),

    emergency_contact_phone: z
      .string()
      .max(20)
      .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format")
      .optional()
      .or(z.literal("")),

    // Insurance
    insurance_company_id: z.string().uuid().optional().or(z.literal("")),

    insurance_number: z.string().max(100).optional().or(z.literal("")),

    // Notes
    notes: z
      .string()
      .max(1000, "Notes must be at most 1000 characters")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      // If one insurance field is filled, the other must be too
      const hasProvider = !!data.insurance_company_id;
      const hasNumber = !!data.insurance_number;
      return hasProvider === hasNumber;
    },
    {
      message: "Please provide both insurance provider and insurance number",
      path: ["insurance_number"],
    },
  )
  .refine(
    (data) => {
      // If one emergency contact field is filled, the other must be too
      const hasName = !!data.emergency_contact_name;
      const hasPhone = !!data.emergency_contact_phone;
      return hasName === hasPhone;
    },
    {
      message: "Please provide both emergency contact name and phone",
      path: ["emergency_contact_phone"],
    },
  );

export type PatientFormValues = z.infer<typeof patientFormSchema>;
