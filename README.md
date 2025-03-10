# Bruicolis

## Development Setup

### Requirements

- Prisma
- PostgreSQL 17.2 (https://www.postgresql.org/download/)
- Postman (https://www.postman.com/downloads/)

```
> npm i
```

```
> npx prisma init
> npx prisma generate
> npx prisma migrate dev
```  

Change `.env` file :
```
DATABASE_URL="postgresql://postgres:root@localhost:5433/bruicolis_v2"
```

Créer une Database dans PgAdmin avec le nom de "bruicolis_v2".

## API - Prisma


## Asks
**Forgot Postgres Password | Reset Postgres Password in PgAdmin4**
See: https://www.youtube.com/watch?v=wfxrRxzm8jY

**Port 8000 already in use?**
Execute : 
```
netstat -aon | findstr :8000
```
You will see something like: 
```  
TCP    0.0.0.0:8000           0.0.0.0:0              LISTENING       XXXX
```
Execute : 
```
taskkill /PID XXXX /F
```