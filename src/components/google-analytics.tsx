"use client";

import { useEffect } from "react";

const GA_ID = "G-NVYVM8YJZN";

export function GoogleAnalytics() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.gtag) return; // already initialized

    const script1 = document.createElement("script");
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}');
    `;
    document.head.appendChild(script2);
  }, []);

  return null;
}
