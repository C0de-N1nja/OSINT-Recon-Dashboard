# Ethical OSINT Dashboard

<div align="center">
  <img src="https://via.placeholder.com/800x400.png/1a1a1a/00aaff?text=Ethical+OSINT+Dashboard" alt="Project Banner">
</div>

<p align="center">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=nodedotjs">
  <img alt="Express.js" src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb">
  <img alt="Selenium" src="https://img.shields.io/badge/Selenium-4.x-43B02A?style=for-the-badge&logo=selenium">
  <img alt="SpaCy" src="https://img.shields.io/badge/spaCy-3.7-09A3D5?style=for-the-badge&logo=spacy">
</p>

An advanced, full-stack web application designed for comprehensive Open-Source Intelligence (OSINT) gathering and analysis. This platform provides a modular suite of tools to enumerate a target's digital footprint, perform deep analysis on discovered profiles, and visualize correlated intelligence in a secure, multi-user environment.

## 🌟 Core Features

The dashboard is built upon a progressive intelligence-gathering workflow, transforming raw data into actionable insights.

#### `Phase 1 & 2: Footprinting & Deep Scraping`
-   **🌐 Username Enumeration:** Scans 20+ high-traffic websites to rapidly identify a target's online presence.
-   **🕵️ Deep Profile Scraping:** Executes browser-level scraping on key platforms (GitHub, Twitter, Instagram) to extract rich metadata, including bios, follower counts, and associated links.

#### `Phase 3: AI-Powered Intelligence Layer`
-   **🧠 NLP Entity Extraction:** A custom-trained **SpaCy** AI model processes scraped text to automatically identify and extract key entities: `PERSON`, `ORGANIZATION`, `LOCATION`.
-   **🔗 Entity Enrichment:** Cross-references found entities against an internal knowledge base to add contextual information.
-   **🎯 Smart Google Dorking:** For unverified entities, the system programmatically generates advanced Google search queries to pivot the investigation and uncover new leads.

#### `Phase 4: Advanced Data Vector Analysis`
-   **📸 Image Metadata (EXIF) Analysis:** On-demand analysis of profile pictures to extract hidden EXIF data, including GPS coordinates, camera models, and timestamps.
-   **🔄 Reverse Image Search:** Provides a one-click pivot to **Google Lens** for any scraped image, connecting identities across different platforms.
-   **🔍 Domain Intelligence:** Performs on-demand **WHOIS** and **DNS** record lookups on discovered websites, revealing technical infrastructure, mail servers, and domain ownership details.

#### `Phase 5: Correlation & Reporting`
-   **🕸️ Interactive Relationship Graph:** Generates a dynamic node graph using **Vis.js** to visually map the connections between the target, their accounts, and all extracted entities.
-   **📄 Professional PDF & JSON Reporting:** Exports the complete intelligence report into clean, portable formats. PDF generation is handled by a headless browser (**Puppeteer**) for high-fidelity, print-ready output.

#### `Phase 6 & 7: Automation & Secure Access`
-   **🤖 Continuous Monitoring:** Profiles can be "monitored," triggering automated, scheduled re-scans via `node-cron` to track a target's digital footprint over time.
-   **⏳ History Tracking:** Automatically detects and logs changes to key data points on monitored profiles, creating a complete timeline of a target's digital evolution.
-   **🚨 Pastebin Leak Hunting:** An on-demand module that searches for potential credential or data leaks associated with the target's identifiers.
-   **🔒 Full Authentication System:**
    -   Secure user registration and login with password hashing via **bcrypt**.
    -   Third-party authentication using **Google OAuth 2.0**.
    -   Stateless session management with **JSON Web Tokens (JWT)** stored in secure, `httpOnly` cookies.
    -   Protected routes ensure that all OSINT capabilities are restricted to authenticated users.

---

## 🛠️ Technical Stack

| Category                  | Technology                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Backend**               | Node.js, Express.js, MongoDB (with Mongoose)                                                              |
| **Authentication**        | Passport.js (Google OAuth), JWT, bcrypt.js, Express Session, Cookie Parser                                |
| **Python Analysis Engine**| Selenium (Undetected Chromedriver), BeautifulSoup4, SpaCy, Requests, python-whois, dnspython, Pillow    |
| **Frontend**              | EJS (Embedded JavaScript), Vanilla JS (ES6+), CSS3                                                        |
| **Automation & Reporting**| node-cron, Puppeteer, Vis.js                                                                              |

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites
-   Node.js (v18.x or later)
-   Python (v3.9 or later)
-   MongoDB running locally
-   Google Chrome / Chromium browser installed

### 1. Clone & Setup
```bash
# Clone the repository
git https://github.com/C0de-N1nja/OSINT-Recon-Dashboard.git
cd OSINT-Recon-Dashboard

# Install Node.js dependencies
npm install

# Setup Python virtual environment and install dependencies
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure ChromeDriver
This project requires a `chromedriver` that matches your installed Chrome/Chromium version.
1.  Check your browser version (e.g., `Help > About Google Chrome`).
2.  Download the matching `chromedriver` from the [Chrome for Testing Dashboard](https://googlechromels.github.io/chrome-for-testing/).
3.  Unzip and place the `chromedriver` executable in the `/drivers` directory of this project.

### 3. Environment Variables
Create a `.env` file in the project root and populate it with the following:
```
# Define the python command for your system (python or python3)
PYTHON_COMMAND=python

# Use long, random strings for secrets
SESSION_SECRET=your_super_long_and_random_session_secret
JWT_SECRET=your_other_super_long_and_random_jwt_secret

# Credentials from your Google Cloud Console project
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Run the Application
```bash
# Start the server (with hot-reloading)
nodemon server.js
```
The application will be accessible at `http://localhost:3000`.

---

## ⚠️ Ethical Disclaimer
This tool is intended for **educational, research, and professional security purposes only**. Unauthorized reconnaissance or scraping may violate the terms of service of the targeted websites. The user assumes all responsibility for complying with applicable laws and ethical guidelines. The creators of this tool are not liable for any misuse.