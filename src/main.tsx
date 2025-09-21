import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Remove Lovable badge
const removeLovableBadge = () => {
  const observer = new MutationObserver(() => {
    const badge = document.querySelector('[data-lovable-badge]');
    if (badge) {
      badge.remove();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also remove on load
  setTimeout(() => {
    const badge = document.querySelector('[data-lovable-badge]');
    if (badge) {
      badge.remove();
    }
  }, 1000);
};

removeLovableBadge();

createRoot(document.getElementById("root")!).render(<App />);
