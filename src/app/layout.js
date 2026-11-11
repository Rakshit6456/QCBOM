import "./globals.css";
import { DataProvider } from "@/lib/store";
import Shell from "@/components/Shell";

export const metadata = { title: "QCBOM — Quantum Crypto Inventory", description: "CBOM and QBOM analysis dashboard by QNNX" };

const themeScript = `try{var t=localStorage.getItem("qcbom_theme");document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch(e){document.documentElement.dataset.theme="light"}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <DataProvider><Shell>{children}</Shell></DataProvider>
      </body>
    </html>
  );
}
