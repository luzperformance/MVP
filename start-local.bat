@echo off
echo.
echo  ======================================================
echo   🏥 PRONTUARIO LUZPERFORMANCE - INICIANDO (SQLITE)
echo  ======================================================
echo.
echo   [Dica] Este modo nao precisa de Docker.
echo   [Dica] Backend: http://localhost:3222
echo   [Dica] Frontend: http://localhost:5173
echo.

:: Verifica se node_modules existe na raiz
if not exist "node_modules" (
    echo [ERROR] node_modules nao encontrados. Executando instalacao...
    call npm install
)

:: Inicia o servidor usando o script dev do package.json raiz
call npm run dev

pause
