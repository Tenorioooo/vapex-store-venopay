/**
 * Meta Pixel (Facebook Pixel) utility
 * Pixel ID é lido da variável de ambiente VITE_META_PIXEL_ID
 */

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

/** Inicializa o pixel e injeta o script do Meta no <head> */
export function initMetaPixel(): void {
  if (!PIXEL_ID) {
    console.warn('[MetaPixel] VITE_META_PIXEL_ID não está definido. O pixel não será carregado.');
    return;
  }

  if (typeof window.fbq === 'function') return; // já inicializado

  // Snippet oficial do Meta Pixel (versão JS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fbq: any = function (...args: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((fbq as any).callMethod) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fbq as any).callMethod(...args);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fbq as any).queue.push(args);
    }
  };

  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;

  // Injeta o script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  // Noscript pixel fallback
  const noscript = document.createElement('noscript');
  const img = document.createElement('img');
  img.height = 1;
  img.width = 1;
  img.style.display = 'none';
  img.src = `https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`;
  noscript.appendChild(img);
  document.head.appendChild(noscript);

  window.fbq('init', PIXEL_ID);
}

/** Dispara PageView (chamar em cada mudança de rota) */
export function pixelPageView(): void {
  if (typeof window.fbq !== 'function') return;
  window.fbq('track', 'PageView');
}

/** Dispara InitiateCheckout */
export function pixelInitiateCheckout(value: number, currency = 'BRL'): void {
  if (typeof window.fbq !== 'function') return;
  window.fbq('track', 'InitiateCheckout', { value, currency });
}

/** Dispara Purchase */
export function pixelPurchase(value: number, currency = 'BRL', orderId?: string): void {
  if (typeof window.fbq !== 'function') return;
  window.fbq('track', 'Purchase', {
    value,
    currency,
    ...(orderId ? { order_id: orderId } : {}),
  });
}

/** Dispara AddToCart */
export function pixelAddToCart(value: number, contentName?: string, currency = 'BRL'): void {
  if (typeof window.fbq !== 'function') return;
  window.fbq('track', 'AddToCart', {
    value,
    currency,
    ...(contentName ? { content_name: contentName } : {}),
  });
}
