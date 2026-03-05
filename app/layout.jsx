import "./globals.css";
import AppShell from "./components/AppShell";

export const metadata = {
  title: "AI Content",
  description: "AI Content Analysis Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
