# Developer Guide

This guide explains how to set up the development environment, run the project locally, and contribute to the OSINT Dashboard.

## Prerequisites

Before starting, make sure you have installed:

- **Node.js** (v18+ recommended)
- **Python 3** (3.9+ recommended)
- **MongoDB** (local or Atlas cluster)
- **Git**
- **Google Cloud Console credentials** for OAuth (optional but recommended)

## 1. Clone the repository

```bash
git clone https://github.com/yourusername/osint-dashboard.git
cd osint-dashboard
```

## 2. Install dependencies

```bash
npm install
pip install -r requirements.txt
```

## 3. Environment variables

Create a .env file by copying .env.example:

```bash
cp .env.example .env
```

Edit .env with your local settings.

## 4. Database setup

Make sure MongoDB is running locally or you have an Atlas URI in .env:

```bash
MONGODB_URI=mongodb://localhost:27017/osint-dashboard
```

## 5. Running in development

Run both the Node.js backend and the frontend watcher:

```bash
npm run dev
```

This will:

- Start the backend server on the port specified in .env (default: 5000)
- Watch for file changes and auto-restart the server
- Serve EJS templates from the views directory

## 6. Python integration

This project uses Python scripts for:

- Username tracking
- Social media scraping
- NLP entity extraction

Make sure your .env has the correct Python command:

```ini
PYTHON_COMMAND=python
```

On some systems (Linux/macOS), this may need to be:

```ini
PYTHON_COMMAND=python3
```

## 7. Project structure

```
project/
├── controllers/        # Express route controllers
├── models/             # Mongoose schemas
├── public/             # Static assets
├── python/             # Python scripts
├── routes/             # API route definitions
├── views/              # EJS templates
└── docs/               # Documentation
```

## 8. Code style

Follow these guidelines:

- Use ESLint for JS/Node code
- Follow PEP8 for Python scripts
- Use meaningful commit messages
- Avoid pushing directly to main — create a feature branch

## 9. Testing

Run tests with:

```bash
npm test
```

Python scripts can be tested individually:

```bash
python python/username_tracker.py
```

## 10. Contribution workflow

1. Fork the repo
2. Create a feature branch:

```bash
git checkout -b feature/your-feature
```

3. Commit and push changes:

```bash
git commit -m "Add your feature"
git push origin feature/your-feature
```

4. Open a pull request

## 11. Debugging tips

- Check logs in the terminal for Python/Node errors
- Ensure MongoDB is running and accessible
- If Python scripts fail, run them manually to see errors
- Use console.log for Node and print for Python debugging

## 12. Deployment

For production:

- Set NODE_ENV=production
- Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js
```

- Ensure environment variables are set on the server
- Use HTTPS for all external traffic

## 13. Support

For issues:

- Open a GitHub issue
- Check the TROUBLESHOOTING.md file in docs/