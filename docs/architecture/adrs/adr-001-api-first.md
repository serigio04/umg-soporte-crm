# ADR 001: Adopción de la Filosofía API-First y OpenAPI 3.0.3

**Fecha:** 24 de octubre de 2026
**Estado:** Aceptado

## Contexto
El desarrollo del Sistema de Soporte UMG requiere que los equipos de frontend (móvil/web) y backend trabajen en paralelo sin bloqueos mutuos[cite: 5]. Necesitamos una fuente única de verdad para la comunicación.

## Decisión
Se adopta el paradigma API-First, definiendo el contrato de comunicación utilizando la especificación OpenAPI 3.0.3 (YAML) antes de escribir la lógica de negocio[cite: 5].

## Consecuencias
*   **Positivas:** Desacoplamiento efectivo de los equipos, estandarización de variables y formatos de fechas (ISO 8601), y generación automática de documentación interactiva (Swagger UI)[cite: 5].
*   **Negativas:** Requiere un esfuerzo inicial mayor para definir y acordar el contrato técnico con todo el equipo antes de iniciar el desarrollo del código.
