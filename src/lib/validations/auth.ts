import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
});

export const registerSchema = z
  .object({
    display_name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
    email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein"),
    password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirm_password"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirm_password"],
  });

export const profileSchema = z.object({
  display_name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
});

export const ingredientSchema = z.object({
  name: z.string().min(1, "Zutat erforderlich"),
  amount: z.number().min(0),
  unit: z.string(),
});

export const stepSchema = z.object({
  instruction: z.string().min(1, "Schritt erforderlich"),
});

export const recipeSchema = z.object({
  title: z.string().min(2, "Titel muss mindestens 2 Zeichen haben"),
  description: z.string().optional(),
  category_id: z.string().min(1, "Kategorie erforderlich"),
  custom_category_id: z.string().optional(),
  servings: z.number().min(1, "Mindestens 1 Portion"),
  cook_time_minutes: z.number().min(0),
  difficulty: z.enum(["einfach", "mittel", "schwer"]),
  is_public: z.boolean(),
  tags: z.array(z.string()),
  ingredients: z.array(ingredientSchema).min(1, "Mindestens eine Zutat"),
  steps: z.array(stepSchema).min(1, "Mindestens ein Schritt"),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Kommentar darf nicht leer sein").max(1000),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type RecipeFormValues = z.infer<typeof recipeSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
