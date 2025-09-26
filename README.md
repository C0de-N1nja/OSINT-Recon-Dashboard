# Ethical OSINT Dashboard

<p align="center">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=nodedotjs">
  <img alt="Express.js" src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb">
  <img alt="Selenium" src="https://img.shields.io/badge/Selenium-4.x-43B02A?style=for-the-badge&logo=selenium">
  <img alt="SpaCy" src="https://img.shields.io/badge/spaCy-3.7-09A3D5?style=for-the-badge&logo=spacy">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge&logo=open-source-initiative&logoColor=white">
  <img alt="Contributions" src="https://img.shields.io/badge/Contributions-Welcome-brightgreen?style=for-the-badge&logo=github">
  <img alt="Last Commit" src="https://img.shields.io/github/last-commit/C0de-N1nja/OSINT-Recon-Dashboard?style=for-the-badge&logo=git&logoColor=white">
</p>


<p align="center">
  <i>An advanced, full-stack web application designed for comprehensive Open-Source Intelligence (OSINT) gathering and analysis</i>
</p>

## 📋 Table of Contents
- [🚀 Quick Start](#-quick-start)
- [🌟 Core Features](#-core-features)
- [🏗️ Project Structure](#️-project-structure)
- [🧩 Architecture Overview](#-architecture-overview)
- [🛠️ Technical Stack](#️-technical-stack)
- [📋 Prerequisites](#-prerequisites)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Configuration](#️-configuration)
- [🚀 Running the Application](#-running-the-application)
- [📊 Example Workflow](#-example-workflow)
- [🔧 Troubleshooting](#-troubleshooting)
- [📖 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [⚠️ Ethical Disclaimer](#️-ethical-disclaimer)
- [📄 License](#-license)

## 🚀 Quick Start

Get the OSINT Dashboard running in minutes with our automated setup scripts:

### Windows
```bash
scripts\setup.bat
```

### Linux
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

After setup, start the application:
```bash
npm start
```

Access the dashboard at `http://localhost:3000`

## 🌟 Core Features

The dashboard is built upon a progressive intelligence-gathering workflow, transforming raw data into actionable insights.

### Phase 1 & 2: Footprinting & Deep Scraping
- **🌐 Username Enumeration**: Scans 20+ high-traffic websites to rapidly identify a target's online presence
- **🕵️ Deep Profile Scraping**: Executes browser-level scraping on key platforms (GitHub, Twitter, Instagram) to extract rich metadata

### Phase 3: AI-Powered Intelligence Layer
- **🧠 NLP Entity Extraction**: Custom-trained **SpaCy** AI model identifies `PERSON`, `ORGANIZATION`, `LOCATION`
- **🔗 Entity Enrichment**: Cross-references entities against internal knowledge base
- **🎯 Smart Google Dorking**: Generates advanced search queries to pivot investigations

### Phase 4: Advanced Data Vector Analysis
- **📸 Image Metadata Analysis**: Extracts EXIF data (GPS, camera model, timestamps)
- **🔄 Reverse Image Search**: One-click pivot to **Google Lens**
- **🔍 Domain Intelligence**: Performs **WHOIS** and **DNS** lookups

### Phase 5: Correlation & Reporting
- **🕸️ Interactive Relationship Graph**: Dynamic node graph using **Vis.js**
- **📄 Professional Reporting**: PDF & JSON export via **Puppeteer**

### Phase 6 & 7: Automation & Security
- **🤖 Continuous Monitoring**: Scheduled re-scans via `node-cron`
- **⏳ History Tracking**: Logs changes to monitored profiles
- **🚨 Pastebin Leak Hunting**: Searches for credential leaks
- **🔒 Authentication System**: JWT sessions, Google OAuth, protected routes

## 🏗️ Project Structure

```
OSINT-Recon-Dashboard/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── models/         # Database models
├── python/         # Analysis engine
├── public/         # Static assets
├── routes/         # API routes
├── utils/          # Utility modules
├── views/          # EJS templates
└── docs/           # Documentation
```

## 🧩 Architecture Overview

The OSINT Dashboard follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Analysis      │
│   (EJS/JS/CSS)  │◄──►│   (Node.js)     │◄──►│   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   Database      │    │   External      │
         │              │   (MongoDB)     │    │   APIs          │
         │              └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         └─────────────►│   Authentication│    │   Scraping      │
                        │   (Passport)    │    │   (Selenium)    │
                        └─────────────────┘    └─────────────────┘
```

### Data Flow:
1. **User Input** → Frontend captures target information
2. **API Requests** → Backend processes requests and authenticates users
3. **Analysis Tasks** → Python engine performs OSINT operations
4. **Data Storage** → Results stored in MongoDB with change tracking
5. **Visualization** → Frontend displays interactive graphs and reports

## 🛠️ Technical Stack

| Category                  | Technology                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Backend**               | Node.js, Express.js, MongoDB (with Mongoose)                                                              |
| **Authentication**        | Passport.js (Google OAuth), JWT, bcrypt.js, Express Session, Cookie Parser                                |
| **Python Analysis Engine**| Selenium (Undetected Chromedriver), BeautifulSoup4, SpaCy, Requests, python-whois, dnspython, Pillow    |
| **Frontend**              | EJS (Embedded JavaScript), Vanilla JS (ES6+), CSS3                                                        |
| **Automation & Reporting**| node-cron, Puppeteer, Vis.js                                                                              |

## 📋 Prerequisites

- **Node.js** (v18.x or later)
- **Python** (v3.9 or later)
- **MongoDB** (v6.x or later)
- **Google Chrome / Chromium** browser installed
- **ChromeDriver** (matching your Chrome version)

### Platform-Specific Requirements
- **Windows**: Visual C++ Build Tools (if compilation fails)
- **Linux**: build-essential, python3-dev

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/C0de-N1nja/OSINT-Recon-Dashboard.git
cd OSINT-Recon-Dashboard
```

### 2. Automated Setup (Recommended)

#### Windows
```bash
scripts\setup.bat
```

#### Linux
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 3. Manual Setup

#### Install Node.js Dependencies
```bash
npm install
```

#### Setup Python Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux:
source venv/bin/activate

# Install Python packages
pip install -r requirements.txt

# Install SpaCy model
python -m spacy download xx_ent_wiki_sm
```

#### Configure ChromeDriver
1. Check your Chrome version (e.g., `Help > About Google Chrome`)
2. Download the matching `chromedriver` from the [Chrome for Testing Dashboard](https://googlechromels.github.io/chrome-for-testing/)
3. Place the `chromedriver` executable in the `/drivers` directory

#### Start MongoDB
```bash
# Windows:
net start MongoDB

# Linux:
sudo systemctl start mongod
```

## ⚙️ Configuration

Create a `.env` file in the project root and populate it with the following:

```env
# Define the python command for your system (python or python3)
PYTHON_COMMAND=python

# Use long, random strings for secrets
SESSION_SECRET=your_super_long_and_random_session_secret
JWT_SECRET=your_other_super_long_and_random_jwt_secret

# Credentials from your Google Cloud Console project
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

To generate secure secrets, you can use:
- [Online Random Key Generator](https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx)

## 🚀 Running the Application

```bash
# Start the server with hot-reloading
npx nodemon server.js

# Or without hot-reloading
npm start
```

The application will be accessible at `http://localhost:3000`

## 📊 Example Workflow

Here's a typical OSINT investigation workflow using the dashboard:

### Step 1: Initial Reconnaissance
```
1. Enter target username: "john_doe"
2. Click "Start Scan"
3. System scans 20+ platforms for accounts
```

### Step 2: Deep Analysis
```
1. Review found accounts (GitHub, Twitter, Instagram)
2. Select platforms for deep scraping
3. Click "Run Deep Scrape"
4. System extracts detailed profile information
```

### Step 3: AI Analysis
```
1. NLP processes bio text and extracts entities:
   - PERSON: ["Jane Smith", "Alex Johnson"]
   - ORG: ["TechCorp", "University XYZ"]
   - LOCATION: ["San Francisco", "California"]
2. System cross-references entities with knowledge base
3. Generates Google dorks for further investigation
```

### Step 4: Advanced Analysis
```
1. Analyze profile pictures for EXIF data
2. Perform domain intelligence on discovered websites
3. Generate relationship graph showing connections
```

### Step 5: Reporting & Monitoring
```
1. Export findings as PDF report
2. Enable continuous monitoring
3. Set up alerts for profile changes
4. Hunt for potential credential leaks
```

## 🔧 Troubleshooting

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| **ChromeDriver errors** | Ensure ChromeDriver version matches your Chrome browser version |
| **MongoDB connection failed** | Verify MongoDB service is running and accessible |
| **Python module import errors** | Activate virtual environment before running Python scripts |
| **Authentication fails** | Check .env file configuration and Google OAuth settings |
| **Scraping timeouts** | Increase timeout values in scraper configuration |
| **SpaCy model not found** | Run: `python -m spacy download xx_ent_wiki_sm` |
| **Port already in use** | Kill processes using the port or change PORT in .env |

### Getting Help

- Check the [documentation](docs/SETUP.md) for detailed setup guides
- Review [troubleshooting guides](docs/TROUBLESHOOTING.md)
- Open an [issue on GitHub](https://github.com/C0de-N1nja/OSINT-Recon-Dashboard/issues)

## 📖 Documentation

For detailed setup instructions and troubleshooting, see:
- [Setup Guide](docs/SETUP.md)
- [Windows Setup Guide](docs/WINDOWS_SETUP.md)
- [Linux Setup Guide](docs/LINUX_SETUP.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [API Documentation](docs/API.md)
- [Developer Guide](docs/DEVELOPER.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⚠️ Ethical Disclaimer

This tool is intended for **educational, research, and professional security purposes only**. Unauthorized reconnaissance or scraping may violate the terms of service of the targeted websites. The user assumes all responsibility for complying with applicable laws and ethical guidelines. The creators of this tool are not liable for any misuse.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/C0de-N1nja">C0de-N1nja</a>
</p>
