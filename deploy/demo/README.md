# NebulaStack Workspace (pitch + PoC)

SPA en `http://localhost:3000`:

1. **Pitch comercial** — producto y arquitectura.
2. **Workspace** — login de usuario + agenda multi-empresa contra el API Gateway.

## Abrir

```powershell
cd deploy/compose
docker compose up -d --build
```

Abre [http://localhost:3000](http://localhost:3000).

Pitch: `←` / `→` o espacio. “Probar workspace” abre el **login**.

## Usuarios de prueba

| Organización | Correo | Contraseña |
|--------------|--------|------------|
| CDA Colombia | `admin@cda.example` | `Demo123!` |
| Sonrisa Andina | `admin@odonto.example` | `Demo123!` |

## Guion sugerido (clientes)

### Pitch

Producto → problema → solución → verticales → arquitectura → confianza → **Probar el workspace**.

### Workspace (flujo real)

1. Elegir organización, digitar correo y contraseña → **Iniciar sesión**  
2. Ver solo servicios de negocio (sin probes) → **Confirmar cita**  
3. Seguir estados: Reservada → Pagada → Confirmada  
4. **Cerrar sesión** → entrar como la otra organización  
5. Menú **Qué pasa si…** (escenarios internos; no aparecen en el catálogo)  
6. Panel **Actividad**; opcional **Ver detalle técnico**

### Presentadores / evaluadores

- Tecla **`?`**: asistente de demo.  
- **Ajustes**: URL del API, credenciales, volver al pitch.  
- Probes de saga/CB siguen en backend; la UI los oculta del listado.

## Archivos

| Archivo | Rol |
|---------|-----|
| `pitch-content.js` | Copy y SVG |
| `app.js` | Pitch + login + workspace + API |
| `styles.css` | Marca NebulaStack + temas por organización |
| `code-map.json` | Snippets (drawer técnico) |
| `logo-nebula-stack.png` | Logo |
