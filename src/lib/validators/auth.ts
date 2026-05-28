import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha muito curta"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const requestResetSchema = z.object({
  email: z.string().email("Email inválido"),
});
export type RequestResetInput = z.infer<typeof requestResetSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(32, "Token inválido"),
    password: z
      .string()
      .min(8, "Senha precisa ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "Inclua ao menos 1 maiúscula")
      .regex(/[a-z]/, "Inclua ao menos 1 minúscula")
      .regex(/\d/, "Inclua ao menos 1 número"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Nome muito curto").max(120),
    crp: z.string().trim().min(3, "CRP inválido").max(40),
    email: z.string().email("Email inválido").toLowerCase(),
    password: z
      .string()
      .min(8, "Senha precisa ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "Inclua ao menos 1 maiúscula")
      .regex(/[a-z]/, "Inclua ao menos 1 minúscula")
      .regex(/\d/, "Inclua ao menos 1 número"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });
export type SignupInput = z.infer<typeof signupSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z
      .string()
      .min(8, "Senha precisa ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "Inclua ao menos 1 maiúscula")
      .regex(/[a-z]/, "Inclua ao menos 1 minúscula")
      .regex(/\d/, "Inclua ao menos 1 número"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "A nova senha não pode ser igual à atual",
    path: ["newPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
