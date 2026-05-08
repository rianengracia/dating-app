import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Za-z]/, "Password must contain a letter.")
  .regex(/[0-9]/, "Password must contain a digit.");

export const registerSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: passwordSchema,
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be 2–32 characters.")
    .max(32, "Display name must be 2–32 characters."),
  age: z
    .number({ error: "Age is required." })
    .int("Age must be a whole number.")
    .min(18, "You must be 18 or older to register.")
    .max(99, "Enter a valid age."),
  bio: z
    .string()
    .trim()
    .min(1, "Bio is required.")
    .max(280, "Bio must be 280 characters or less."),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
