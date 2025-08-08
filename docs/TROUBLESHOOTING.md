# Troubleshooting Guide

This guide covers common issues and solutions when setting up and running the OSINT Dashboard.

## Common Issues

### ChromeDriver Errors

**Problem**: ChromeDriver version mismatch or not found

**Solution**:
1. Check your Chrome version (Help > About Google Chrome)
2. Download matching ChromeDriver from [Chrome for Testing Dashboard](https://googlechromels.github.io/chrome-for-testing/)
3. Place in `/drivers` directory
4. Ensure file is named `chromedriver` (Windows: `chromedriver.exe`)

### MongoDB Connection Failed

**Problem**: Cannot connect to MongoDB database

**Solution**:
- **Windows**: Run `net start MongoDB` in Command Prompt as Administrator
- **Linux**: Run `sudo systemctl start mongod`
- Verify MongoDB is installed and running
- Check connection string in `config/db.js`

### Python Module Import Errors

**Problem**: Python modules not found when running scrapers

**Solution**:
1. Activate virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux: `source venv/bin/activate`
2. Install requirements: `pip install -r requirements.txt`
3. Install SpaCy model: `python -m spacy download xx_ent_wiki_sm`

### Authentication Failures

**Problem**: Google OAuth not working or JWT errors

**Solution**:
1. Verify `.env` file has correct Google credentials
2. Ensure Google OAuth is configured in Google Cloud Console
3. Check redirect URI matches: `http://localhost:3000/auth/google/callback`
4. Verify SESSION_SECRET and JWT_SECRET are set

### Scraping Timeouts

**Problem**: Scrapers timing out or failing to complete

**Solution**:
1. Check internet connection
2. Increase timeout values in scraper configuration
3. Verify target profiles are public and accessible
4. Check if target platform has rate limiting

### SpaCy Model Not Found

**Problem**: Error about missing SpaCy model

**Solution**:
```bash
python -m spacy download xx_ent_wiki_sm
```

### Port Already in Use

**Problem**: Error that port 3000 is already in use

**Solution**:

Find process using the port:
- **Windows**: `netstat -ano | findstr :3000`
- **Linux**: `lsof -i :3000`

Kill the process or change PORT in .env

### Virtual Environment Issues

**Problem**: Python commands not working after setup

**Solution**:
1. Delete existing venv folder: `rm -rf venv`
2. Recreate: `python -m venv venv`
3. Reactivate and reinstall packages

## Getting Additional Help

If you're still having issues:

- Check the setup guides for your platform
- Search existing GitHub issues
- Create a new issue with:
  - Your operating system
  - Error messages
  - Steps to reproduce the problem
  - What you've already tried