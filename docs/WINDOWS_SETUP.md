# Windows Setup Guide

## Prerequisites Installation

### 1. Install Python

- Download: https://www.python.org/ftp/python/3.11.4/python-3.11.4-amd64.exe
- Check "Add Python to PATH"
- Click "Install Now"

### 2. Install Node.js

- Download: https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi

### 3. Install Chrome

- Download from https://www.google.com/chrome/

### 4. Install ChromeDriver

- Download: https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/115.0.5790.102/win64/chromedriver-win64.zip
- Place chromedriver.exe into `drivers/`

### 5. Install MongoDB

- Download: https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.8-signed.msi

---

## Project Setup

### Automated

```batch
scripts\setup.bat
```

### Manual

```batch
git clone https://github.com/C0de-N1nja/OSINT-Recon-Dashboard.git
cd OSINT-Recon-Dashboard

python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download xx_ent_wiki_sm
npm install

copy .env.example .env
```

Edit `.env` with your keys

---

## Start MongoDB

```batch
net start MongoDB
```

## Run

```batch
npm start
```