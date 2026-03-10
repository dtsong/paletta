import "./globals.css";

export const metadata = {
  title: "Paletta",
  description: "Interactive color palette tool — explore harmonies, export to CSS/JSON/AI prompts.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
