import { z } from "zod";

export const getDoctorSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, t("form.validation.nameRequired")),
    specialty_id: z.string().min(1, t("form.validation.specialtyRequired")),
    consultation_fee: z.number().min(0, t("form.validation.feePositive")),
    status: z.string(),
    avatar_url: z
      .string()
      .url(t("form.validation.invalidUrl"))
      .optional()
      .or(z.literal("")),
    years_experience: z.number().min(0, t("form.validation.expPositive")),
    phone: z.string().optional(),
    schedule: z.array(
      z.object({
        day: z.string(),
        day_of_week: z.number(),
        start_time: z.string(),
        end_time: z.string(),
        is_active: z.boolean(),
      }),
    ),
  });
