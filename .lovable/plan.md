

## Desactivar pantalla de pago temporalmente

Se modificaran los archivos necesarios para que el flujo salte directamente al chat sin pasar por la verificacion de pago. Esto es temporal, para pruebas.

### Cambios a realizar

1. **`src/pages/Payment.tsx`** - En lugar de mostrar la pantalla de pago, redirigir automaticamente a `/chat` cuando el usuario este autenticado.

2. **`src/pages/Chat.tsx`** - Eliminar la verificacion de suscripcion activa que redirige a `/payment`. Solo mantener la verificacion de autenticacion (que el usuario haya iniciado sesion).

3. **`supabase/functions/legal-chat/index.ts`** - Comentar o eliminar temporalmente el bloque que verifica `has_active_subscription` y retorna error 403. Esto permite que el edge function responda sin importar el estado de suscripcion.

### Resultado esperado

- El usuario inicia sesion y llega directamente al chat legal
- No se muestra la pantalla de pago
- El chat funciona sin verificar suscripcion
- Cuando se quiera reactivar el pago, se revierten estos 3 cambios

