import "./globals.css";

export const metadata = {
  title: "Ming — Learn Mandarin by speaking it",
  description:
    "An AI Mandarin coach that builds lessons around your goal and deadline. Real conversations, not flashcards.",
  applicationName: "Ming",
  appleWebApp: { capable: true, title: "Ming", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a08" },
  ],
};

// Runs before first paint: applies the saved theme (no light flash in dark mode),
// captures the install prompt (it can fire before React loads), and registers the
// service worker outside local development.
const BOOT = `(function(){
try{var s=JSON.parse(localStorage.getItem('ming-settings')||'{}');
var t=s.theme||(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
document.documentElement.dataset.theme=t;}catch(e){}
window.addEventListener('beforeinstallprompt',function(e){window.__mingInstall=e;window.dispatchEvent(new Event('ming-install'));});
var h=location.hostname;
if('serviceWorker' in navigator&&h!=='localhost'&&h!=='127.0.0.1'){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}
})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
