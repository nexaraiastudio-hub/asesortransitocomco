/**
 * RevenueCat wrapper para compras nativas (iOS / Android).
 *
 * ⚠️  ANTES DE PUBLICAR en App Store o Google Play debes:
 *   1. Crear una cuenta en https://www.revenuecat.com
 *   2. Crear el producto en App Store Connect / Google Play Console con el
 *      identificador "asesor_legal_mensual" (o el que elijas).
 *   3. Configurar el entitlement "premium" en RevenueCat que apunte a ese producto.
 *   4. Reemplazar las constantes REVENUECAT_API_KEY_* con tus claves reales.
 *   5. Eliminar el modo "web fallback" de esta librería.
 */

import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";
import { Capacitor } from "@capacitor/core";

// ─── Configuración ────────────────────────────────────────────────────────────
// Sustituye estos valores con tus API Keys de RevenueCat cuando estén listos.
const REVENUECAT_API_KEY_IOS = "appl_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const REVENUECAT_API_KEY_ANDROID = "goog_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

/** ID del entitlement configurado en el dashboard de RevenueCat */
export const ENTITLEMENT_ID = "premium";

/** ID del paquete/oferta en RevenueCat (normalmente "$rc_monthly") */
export const PACKAGE_ID = "$rc_monthly";
// ─────────────────────────────────────────────────────────────────────────────

let initialized = false;

/** Inicializa el SDK de RevenueCat. Llama esto una sola vez al arrancar la app. */
export async function initPurchases(userId?: string) {
  if (!Capacitor.isNativePlatform()) return; // No hacer nada en web
  if (initialized) return;

  const apiKey =
    Capacitor.getPlatform() === "ios"
      ? REVENUECAT_API_KEY_IOS
      : REVENUECAT_API_KEY_ANDROID;

  await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
  await Purchases.configure({ apiKey });

  if (userId) {
    await Purchases.logIn({ appUserID: userId });
  }

  initialized = true;
}

/** Obtiene la oferta mensual activa de RevenueCat. */
export async function getMonthlyPackage() {
  if (!Capacitor.isNativePlatform()) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current?.monthly ?? null;
}

/**
 * Lanza el flujo nativo de compra.
 * @returns true si la compra fue exitosa, false si fue cancelada o falló.
 */
export async function purchaseMonthly(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const pkg = await getMonthlyPackage();
    if (!pkg) throw new Error("No se encontró el paquete mensual en RevenueCat");

    const result = await Purchases.purchasePackage({ aPackage: pkg });
    const entitlements = result.customerInfo.entitlements.active;
    return ENTITLEMENT_ID in entitlements;
  } catch (err: any) {
    if (err?.userCancelled) return false;
    throw err;
  }
}

/** Restaura compras previas (requerido por Apple). */
export async function restorePurchases(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  const { customerInfo } = await Purchases.restorePurchases();
  return ENTITLEMENT_ID in customerInfo.entitlements.active;
}

/** Verifica si el usuario tiene acceso Premium activo según RevenueCat. */
export async function checkPremiumStatus(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  const { customerInfo } = await Purchases.getCustomerInfo();
  return ENTITLEMENT_ID in customerInfo.entitlements.active;
}
