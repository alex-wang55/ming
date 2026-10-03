import { useState, useEffect } from "react";

export const MOBILE_QUERY = "(max-width: 768px)";

export function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return mobile;
}

// Install-as-app support. The beforeinstallprompt event is captured early by the
// boot script in layout.js (it fires before React mounts) and stored on window.
export function useInstallPrompt() {
  const [state, setState] = useState({ event: null, standalone: false, ios: false });

  useEffect(() => {
    const read = () =>
      setState({
        event: window.__mingInstall || null,
        standalone:
          window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true,
        ios: /iphone|ipad|ipod/i.test(window.navigator.userAgent),
      });
    read();
    window.addEventListener("ming-install", read);
    window.addEventListener("appinstalled", read);
    return () => {
      window.removeEventListener("ming-install", read);
      window.removeEventListener("appinstalled", read);
    };
  }, []);

  async function install() {
    const evt = window.__mingInstall;
    if (!evt) return;
    evt.prompt();
    await evt.userChoice.catch(() => {});
    window.__mingInstall = null;
    setState((s) => ({ ...s, event: null }));
  }

  return { ...state, install };
}
