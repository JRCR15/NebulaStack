# Presentación interactiva NebulaStack (Delivery 4)

SPA en español que ejecuta el demo E2E contra el API Gateway local y asocia cada paso con archivos del monorepo (`code-map.json`).

## Abrir

```powershell
cd deploy/compose
docker compose up --build -d
```

Luego abre [http://localhost:3000](http://localhost:3000).

Si cambiaste seeds, recrea la DB:

```powershell
docker compose down -v
docker compose up --build -d
```

## Guion sugerido (9 pasos)

1. Contexto D4 (narración)
2. Auth CDA → JWT
3. Catálogo CDA (servicios automotrices COP)
4. Hold CDA → `CONFIRMED`
5. Switch Odonto + catálogo distinto (aislamiento)
6. Hold Odonto → `CONFIRMED`
7. Saga fallo (`666000`) → `CANCELLED`
8. Circuit Breaker (`999000`) → `CANCELLED`
9. Cierre checklist

## Credenciales

- `client_id`: `demo-client`
- `client_secret`: `demo-secret`
- Tenants: `cda` | `odonto`
