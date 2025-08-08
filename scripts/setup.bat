@echo off
echo Installing OSINT Dashboard...

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found!
    pause
    exit /b
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js not found!
    pause
    exit /b
)

REM Create venv
python -m venv venv
call venv\Scripts\activate

REM Install Python deps
pip install -r requirements.txt
python -m spacy download xx_ent_wiki_sm

REM Install Node deps
npm install

REM Create .env if missing
if not exist .env (
    copy .env.example .env
    echo Please edit .env before running.
)

REM Check ChromeDriver
if not exist drivers\chromedriver.exe (
    echo ChromeDriver missing in drivers/
    pause
    exit /b
)

echo Setup complete!
pause
