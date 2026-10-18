// Google Analytics 4 integration utility

export const initGA = () => {
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!gaId || typeof window === 'undefined') return;

  // Check if script already injected
  if (document.getElementById('ga-gtag')) return;

  const script = document.createElement('script');
  script.id = 'ga-gtag';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', gaId, {
    page_path: window.location.pathname,
  });
};

export const trackPageView = (path) => {
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!gaId || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', gaId, {
    page_path: path || window.location.pathname,
  });
};

export const trackEvent = (action, category, label, value) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
