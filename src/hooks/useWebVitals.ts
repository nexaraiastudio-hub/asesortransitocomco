import { useEffect } from 'react'
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'

export function useWebVitals() {
  useEffect(() => {
    const handleMetric = (metric: Metric) => {
      if (import.meta.env.DEV) {
        console.log('[Web Vitals]', {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
        })
      }
    }

    onCLS(handleMetric)
    onFCP(handleMetric)
    onINP(handleMetric)
    onLCP(handleMetric)
    onTTFB(handleMetric)
  }, [])
}

export function reportWebVitals(onPerfEntry?: (metric: Metric) => void) {
  if (onPerfEntry) {
    onCLS(onPerfEntry)
    onFCP(onPerfEntry)
    onINP(onPerfEntry)
    onLCP(onPerfEntry)
    onTTFB(onPerfEntry)
  }
}
