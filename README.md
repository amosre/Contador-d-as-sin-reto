# Contador de días global (GitHub Pages + Cloudflare Workers)

Página web con contador de días que se actualiza automáticamente y botón para reiniciar de forma global.

## Despliegue rápido
1. **Backend** (Cloudflare Workers)
   - Instala Wrangler: `npm i -g wrangler && wrangler login`.
   - Crea KV: `wrangler kv:namespace create COUNTER_KV` y `wrangler kv:namespace create COUNTER_KV --preview`.
   - Copia los IDs en `worker/wrangler.toml`.
   - Ajusta `ALLOWED_ORIGIN` y (opcional) `RESET_TOKEN`.
   - Publica: `cd worker && wrangler publish`.
2. **Frontend** (GitHub Pages)
   - Edita `frontend/script.js`: pon `API_BASE` a tu URL de Worker.
   - Publica en GitHub Pages la carpeta `frontend` como raíz del sitio.

## Seguridad
- CORS restringido por dominio.
- Token opcional para proteger el endpoint de reset.

## Notas
- El contador se calcula en **UTC** para evitar errores de horario de verano.
