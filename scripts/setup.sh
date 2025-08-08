#!/bin/bash
echo "Installing OSINT Dashboard..."

if ! command -v python3 &>/dev/null; then
    echo "Python3 not found!"
    exit 1
fi

if ! command -v node &>/dev/null; then
    echo "Node.js not found!"
    exit 1
fi

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
python -m spacy download xx_ent_wiki_sm

npm install

if [ ! -f .env ]; then
    cp .env.example .env
    echo "Please edit .env before running."
fi

if [ ! -f drivers/chromedriver ]; then
    echo "ChromeDriver missing in drivers/"
    exit 1
fi

echo "Setup complete!"
