import "./globals.css";

export const metadata = {
  title: "Ming 明 — Mandarin Coach",
  description: "Learn to speak Mandarin through real conversations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}