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
  const themeScript = `(function(){try{var key="dincon.theme";var saved=localStorage.getItem(key);var theme=saved==="dark"||saved==="light"?saved:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(e){}})();`;
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
