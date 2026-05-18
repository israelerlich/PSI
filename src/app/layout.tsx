import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clínica IA | Dashboard para Psicólogos",
  description:
    "Plataforma SaaS para psicólogos com agenda, pacientes, prontuários e WhatsApp IA administrativo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
