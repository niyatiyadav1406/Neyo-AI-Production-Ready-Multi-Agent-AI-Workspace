@SETLOCAL
@IF NOT DEFINED NODE_PATH (
  @SET "NODE_PATH=C:\Users\vijayyadav\Desktop\Untitled (3)\frontend\node_modules\.pnpm\vite@8.1.4_esbuild@0.28.0_jiti@2.6.1\node_modules\vite\node_modules;C:\Users\vijayyadav\Desktop\Untitled (3)\frontend\node_modules\.pnpm\vite@8.1.4_esbuild@0.28.0_jiti@2.6.1\node_modules;C:\Users\vijayyadav\Desktop\Untitled (3)\frontend\node_modules\.pnpm\node_modules"
) ELSE (
  @SET "NODE_PATH=C:\Users\vijayyadav\Desktop\Untitled (3)\frontend\node_modules\.pnpm\vite@8.1.4_esbuild@0.28.0_jiti@2.6.1\node_modules\vite\node_modules;C:\Users\vijayyadav\Desktop\Untitled (3)\frontend\node_modules\.pnpm\vite@8.1.4_esbuild@0.28.0_jiti@2.6.1\node_modules;C:\Users\vijayyadav\Desktop\Untitled (3)\frontend\node_modules\.pnpm\node_modules;%NODE_PATH%"
)
@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\vite\bin\vite.js" %*
) ELSE (
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "%~dp0\..\vite\bin\vite.js" %*
)
