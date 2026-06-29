import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/cifra-theme.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dincon.com.br"),
  title: {
    default: "DinCon - Fluxo de Caixa",
    template: "%s | DinCon"
  },
  description: "Plataforma pessoal de fluxo de caixa",
  applicationName: "DinCon",
  alternates: {
    canonical: "https://dincon.com.br"
  },
  openGraph: {
    title: "DinCon - Fluxo de Caixa",
    description: "Plataforma pessoal de fluxo de caixa",
    url: "https://dincon.com.br",
    siteName: "DinCon",
    locale: "pt_BR",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
