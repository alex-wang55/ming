import "./globals.css";

export const metadata = {
  title: "Ming — Learn Mandarin by speaking it",
  description:
    "An AI Mandarin coach that builds lessons around your goal and deadline. Real conversations, not flashcards.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
