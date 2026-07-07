@echo off
cd /d "%~dp0"
echo Menjalankan server lokal untuk Gacha Waifu...
echo.
echo Buka browser ke:
echo http://127.0.0.1:8000/index.html
echo.
echo Jangan tutup jendela ini selama aplikasi dipakai.
echo Tekan Ctrl+C untuk menghentikan server.
echo.
python -m http.server 8000 --bind 127.0.0.1
if errorlevel 1 (
  echo.
  echo Python tidak ditemukan lewat command "python". Mencoba command "py"...
  py -m http.server 8000 --bind 127.0.0.1
)
