## 5.3 Diagrama de Secuencia del Endpoint Principal (`POST /api/tickets`)

El siguiente diagrama refleja la implementación real del servicio `crearTicket`, incluyendo la gestión transaccional con la base de datos Neon PostgreSQL, la resolución de roles y el mapeo automático de agentes según el correo institucional:

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente / Frontend
    participant MW as AuthMiddleware (JWT)
    participant Ctrl as TicketController
    participant Svc as TicketService
    participant DB as Neon PostgreSQL

    Cliente->>MW: POST /api/tickets + Bearer Token + Body
    alt Token Invalido o Expirado
        MW-->>Cliente: HTTP 401 Unauthorized
    else Token Valido
        MW->>Ctrl: req.user { idUsuario, rol } + req.body
        Ctrl->>Svc: crearTicket({ tipologiaITIL, descripcion, carnetEstudiante, idUsuario, rol })
        
        alt Tipologia Invalida
            Svc-->>Ctrl: throw Error('Tipología inválida')
            Ctrl-->>Cliente: HTTP 400 Bad Request
        else Tipologia Valida
            Note over Svc: Prioridad SLA: Incidente=Alta, Solicitud=Media, Cambio=Baja
            Svc->>DB: pool.connect() y BEGIN
            
            alt rol === 'Estudiante'
                Svc->>DB: SELECT idestudiante FROM estudiante WHERE idusuario = $1
            else rol es Agente o Coordinador
                Svc->>DB: SELECT idestudiante FROM estudiante WHERE carne = $1
            end
            DB-->>Svc: est.rows

            alt Estudiante No Encontrado
                Svc->>DB: ROLLBACK y client.release()
                Svc-->>Ctrl: throw Error('ESTUDIANTE_NO_ENCONTRADO')
                Ctrl-->>Cliente: HTTP 404 Not Found
            else Estudiante Encontrado
                Svc->>DB: SELECT a.idagente FROM agentes JOIN usuarios WHERE correoinstitucional = $correoMap
                DB-->>Svc: agente.rows (idAgente o null)
                
                Svc->>DB: INSERT INTO tickets (...) VALUES (...) RETURNING idticket
                DB-->>Svc: idTicket
                
                Svc->>DB: INSERT INTO estadosticket (...) VALUES ('Abierto', NOW(), ...)
                DB-->>Svc: OK
                
                Svc->>DB: COMMIT y client.release()
                Svc-->>Ctrl: { idTicket, tipologiaITIL, prioridadSLA, estado: 'Abierto', idAgente }
                Ctrl-->>Cliente: HTTP 201 Created + Objeto Ticket
            end
        end
    end
```