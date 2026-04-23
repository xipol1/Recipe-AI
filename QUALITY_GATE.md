# Quality Gate (obligatorio para merge)

A partir de este cambio, **no se aprueba merge** si falla cualquiera de estos checks:

1. `npm run lint`
2. `npm test`
3. `npm run build`

## Regla de aprobación

- ✅ Merge permitido: todos los checks en verde.
- ❌ Merge bloqueado: al menos un check en rojo.

## Ejecución local recomendada

```bash
npm run lint && npm test && npm run build
```

## CI

El workflow `.github/workflows/ci.yml` ejecuta exactamente estos 3 pasos como gate en cada `pull_request` y en pushes a ramas principales.
