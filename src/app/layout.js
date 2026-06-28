// app/layout.js
import "./globals.css";

export const metadata = {
  title: "Ming 明 — Mandarin Coach",
  description: "Learn to speak Mandarin through real conversations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
