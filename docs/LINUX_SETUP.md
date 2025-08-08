# Linux Setup Guide (Ubuntu/Debian)

## Prerequisites Installation

### 1. Install System Dependencies

```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv build-essential python3-dev curl -y
```

### 2. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
```

### 3. Install Chrome

```bash
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install google-chrome-stable -y
```

### 4. Install ChromeDriver

```bash
CHROME_VERSION=$(google-chrome --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
echo "Chrome version: $CHROME_VERSION"

wget -O /tmp/chromedriver.zip "https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/115.0.5790.102/linux64/chromedriver-linux64.zip"
sudo unzip /tmp/chromedriver.zip chromedriver-linux64/chromedriver -d /usr/local/bin/
sudo chmod +x /usr/local/bin/chromedriver

mkdir -p drivers
cp /usr/local/bin/chromedriver drivers/
```

### 5. Install MongoDB

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install mongodb-org -y
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## Project Setup

### Automated

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Manual

```bash
git clone https://github.com/C0de-N1nja/OSINT-Recon-Dashboard.git
cd OSINT-Recon-Dashboard

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download xx_ent_wiki_sm
npm install

cp .env.example .env
```

Edit `.env` with your keys

---

## Run

```bash
npm start
```