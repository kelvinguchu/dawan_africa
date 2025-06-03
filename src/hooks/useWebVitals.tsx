'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Use window.gtag if Google Analytics is loaded
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value), // values must be integers
        event_label: metric.id, // id unique to current page load
        non_interaction: true, // avoids affecting bounce rate
      })
    }

    // Also log to console for debugging (remove in production)
    console.log('Web Vitals:', metric)
  })

  return null
}

// Type declaration for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}
