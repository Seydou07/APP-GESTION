@echo off
ECHO ========================================
ECHO   K.M. BOMI - INSTALLATION COMPLETE
ECHO ========================================
ECHO.

ECHO [1/4] Installation des dependances...
call npm install
IF %ERRORLEVEL% NEQ 0 (
    ECHO ERREUR: npm install a echoue
    PAUSE
    EXIT /B 1
)

ECHO.
ECHO [2/4] Generation Prisma Client...
call npx prisma generate
IF %ERRORLEVEL% NEQ 0 (
    ECHO ERREUR: prisma generate a echoue
    PAUSE
    EXIT /B 1
)

ECHO.
ECHO [3/4] Migration de la base de donnees...
call npx prisma migrate dev --name init
IF %ERRORLEVEL% NEQ 0 (
    ECHO ERREUR: prisma migrate a echoue
    PAUSE
    EXIT /B 1
)

ECHO.
ECHO [4/4] Seed de la base de donnees...
node seed_db.js
IF %ERRORLEVEL% NEQ 0 (
    ECHO ERREUR: seed a echoue
    PAUSE
    EXIT /B 1
)

ECHO.
ECHO ========================================
ECHO   INSTALLATION TERMINEE AVEC SUCCES !
ECHO.
ECHO   Connectez-vous avec :
ECHO   Email: admin@gmail.com
ECHO   Mot de passe: admin123
ECHO.
ECHO   Lancez le serveur :
ECHO   npm run dev
ECHO ========================================
PAUSE
