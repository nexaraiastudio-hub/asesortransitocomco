

# Abogado Experto en Tránsito y Transporte Col

## Visión General
Aplicación web móvil profesional de asesoría legal automatizada especializada en tránsito y transporte en Colombia. Diseño corporativo elegante con fondo azul navy (#002147) y acentos dorados (#D4AF37).

---

## Pantalla 1: Bienvenida
- Logo proporcionado centrado en la pantalla
- Nombre de la app "Abogado Experto en Tránsito y Transporte Col"
- Botón dorado "INICIAR ASESORÍA" que lleva a la pantalla de pago
- Fondo azul navy oscuro, diseño minimalista y elegante

## Pantalla 2: Muro de Pago
- Diseño premium con el logo visible
- Texto "Acceso Premium: $4.900 COP / mes"
- Integración real con **Stripe** para procesar el pago mensual recurrente (suscripción)
- Al pagar exitosamente, se desbloquea el acceso al chat de IA
- Los usuarios que ya pagaron pasan directo al chat

## Pantalla 3: Chat de IA
- Interfaz limpia de chat con el logo visible
- El usuario escribe sus consultas legales
- La IA responde **exclusivamente** con base en la fuente de datos cargada por el administrador
- **Regla de oro**: si la pregunta no se puede responder con la información cargada, la IA indica que no tiene información al respecto
- Se usa **Lovable AI** como motor del chat, con instrucciones estrictas de solo usar el contenido administrado

## Pantalla 4: Panel de Administrador
- Acceso protegido solo para el rol de administrador
- Interfaz para cargar y gestionar documentos en formato **Markdown** que servirán como fuente de conocimiento para la IA
- Posibilidad de agregar, editar y eliminar contenido
- Los documentos se almacenan en Supabase Storage y su contenido se usa como contexto para las respuestas del chat

---

## Backend (Lovable Cloud + Supabase)
- **Autenticación**: Registro/login de usuarios con Supabase Auth
- **Base de datos**: Tabla de documentos de conocimiento, roles de usuario (admin/user)
- **Storage**: Bucket para almacenar los archivos markdown del administrador
- **Edge Function**: Función para el chat que toma la fuente de datos y la pasa como contexto a Lovable AI
- **Stripe**: Suscripción mensual de $4.900 COP para acceso premium

## Diseño
- Mobile-first, optimizado para uso en celular
- Paleta: Azul navy (#002147), dorado (#D4AF37), texto blanco
- Tipografía elegante y espaciado generoso
- Logo presente en todas las pantallas sin alteración

