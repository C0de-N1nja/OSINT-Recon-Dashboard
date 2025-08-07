const { exec, spawn } = require("child_process");
const reconProfile = require("../models/ReconProfile");
const { calculateRiskScore, enrichProfileEntities, generateGraphData } = require("../utils/enrichment");
const { performDeepScan } = require('../utils/reconService');
const puppeteer = require('puppeteer');
const HistoryEvent = require('../models/HistoryEvent');

function executeScript(command) {
    return new Promise((resolve) => {
        exec(command, { timeout: 90000, killSignal: 'SIGKILL' }, (err, stdout, stderr) => {
            if (err) {
                console.error(`Script failed: ${command}`, stderr);
                return resolve({ error: true, message: err.message });
            }
            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (parseError) {
                console.error(`Failed to parse JSON from: ${command}`, stdout);
                resolve({ error: true, message: "Invalid JSON response" });
            }
        });
    });
}

function executeScriptWithStdin(commandWithArgs, data) {
    return new Promise((resolve) => {
        const parts = commandWithArgs.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);
        const process = spawn(cmd, args);
        let stdout = '';
        let stderr = '';
        process.stdout.on('data', (data) => { stdout += data.toString(); });
        process.stderr.on('data', (data) => { stderr += data.toString(); });
        process.on('close', (code) => {
            if (code !== 0) {
                console.error(`Script with stdin failed: ${commandWithArgs}`, stderr);
                return resolve({ error: true, message: `Script exited with code ${code}. Error: ${stderr}` });
            }
            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (parseError) {
                console.error(`Failed to parse JSON from stdin script: ${commandWithArgs}`, stdout);
                resolve({ error: true, message: "Invalid JSON response" });
            }
        });
        process.on('error', (err) => {
             console.error('Failed to start subprocess.', err);
             resolve({ error: true, message: 'Failed to start subprocess.' });
        });
        process.stdin.write(data);
        process.stdin.end();
    });
}


// --- ROUTE HANDLERS ---

exports.renderHome = (req, res) => {
    res.render("index", { 
        pageName: 'home',
        user: req.user // <-- ADD THIS
    });
};

exports.startInitialScan = (req, res) => {
    const username = req.body.username.trim();
    if (!username) return res.status(400).send("Username is required");
    
    const pythonCmd = process.env.PYTHON_COMMAND || 'python3';
    const command = `${pythonCmd} ./python/username_tracker.py ${username}`;

    exec(command, { timeout: 240000 }, async (err, stdout) => {
        if (err) {
            console.log("Username tracker failed:", err);
            return res.status(500).send("Username search failed.");
        }
        try {
            const results = JSON.parse(stdout);
            const newProfile = new reconProfile({
                primaryUsername: username,
                usernameResults: results,
                status: 'initial_scan_complete'
            });
            await newProfile.save();
            res.redirect(`/profile/intermediate/${newProfile._id}`);
        } catch (e) {
            console.log("Error processing initial scan:", e, "Python stdout:", stdout);
            return res.status(500).send("Failed to process scan results.");
        }
    });
};

exports.renderIntermediateProfile = async (req, res) => {
    try {
        const profile = await reconProfile.findById(req.params.id).lean();
        if (!profile) return res.status(404).send("Profile not found");
        res.render("intermediate_profile", { 
            profile, pageName: 'intermediate', 
            user: req.user // <-- ADD THIS
        });
    } catch (err) {
        console.log("Error fetching intermediate profile:", err);
        res.status(500).send("Error fetching profile.");
    }
};

exports.runTargetedScrape = async (req, res) => {
    const { profileId, platforms } = req.body;
    if (!profileId || !platforms || platforms.length === 0) {
        return res.redirect(`/profile/${profileId}`);
    }
    try {
        await performDeepScan(profileId, platforms);
        res.redirect(`/profile/${profileId}`);
    } catch (err) {
        if (!res.headersSent) {
            res.status(500).send("Scraping failed.");
        }
    }
};

exports.toggleMonitoring = async (req, res) => {
    try {
        const profileId = req.params.id;
        const profile = await reconProfile.findById(profileId);
        if (!profile) {
            return res.status(404).json({ success: false, message: "Profile not found." });
        }
        profile.isMonitoring = true;
        await profile.save();
        res.status(200).json({ success: true, isMonitoring: true });
    } catch (err) {
        console.error("Error toggling monitoring:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const profileId = req.params.id;
        const foundProfile = await reconProfile.findById(profileId);
        if (!foundProfile) {
            return res.status(404).send("Profile not found");
        }
        const graphData = generateGraphData(foundProfile);
        res.render("profile", { 
            profile: foundProfile.toObject(),
            graphData: JSON.stringify(graphData), 
            pageName: 'profile',
            user: req.user // <-- ADD THIS
        });
    } catch (err) {
        console.log("[ERROR] Error fetching profile:", err);
        if (!res.headersSent) {
            res.status(500).send("Error fetching profile.");
        }
    }
};

exports.exportProfileAsJson = async (req, res) => {
    try {
        const profile = await reconProfile.findById(req.params.id).lean();
        if (!profile) return res.status(404).send('Profile not found');
        
        const filename = `${profile.primaryUsername}_osint_report.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(JSON.stringify(profile, null, 2));
    } catch (err) {
        console.log('[ERROR] Exporting Profile:', err);
        res.status(500).send('Server error during file export.');
    }
};

exports.exportProfileAsPdf = async (req, res) => {
    let browser;
    try {
        console.log('[PDF] Starting PDF generation...');
        const profile = await reconProfile.findById(req.params.id).lean();
        if (!profile) return res.status(404).send('Profile not found');
        
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        const url = `http://localhost:3000/profile/${req.params.id}?print=true`;
        await page.goto(url, { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });
        console.log('[PDF] PDF buffer created successfully.');

        const filename = `${profile.primaryUsername}_osint_report.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(pdfBuffer);
    } catch (err) {
        console.log('[ERROR] PDF Export failed:', err);
        if (!res.headersSent) res.status(500).send('Server error during PDF export.');
    } finally {
        if (browser) {
            await browser.close();
            console.log('[PDF] Headless browser closed.');
        }
    }
};

exports.analyzeImage = async (req, res) => {
    const { profileId, imageUrl } = req.body;
    if (!profileId || !imageUrl) {
        return res.status(400).json({ error: "Profile ID and Image URL are required." });
    }
    try {
        const pythonCmd = process.env.PYTHON_COMMAND || 'python3';
        const command = `${pythonCmd} ./python/utils/image_metadata_analyzer.py`;
        const result = await executeScriptWithStdin(command, imageUrl);
        
        if (result.error || result.status === 'error') {
             return res.status(500).json({ status: 'error', message: result.message || "Failed to analyze image." });
        }
        const analysisRecord = { url: imageUrl, data: result, analyzedAt: new Date() };
        await reconProfile.findByIdAndUpdate(profileId, { $push: { imageMetadata: analysisRecord } });
        res.status(200).json(analysisRecord);
    } catch (err) {
        console.error("Image analysis controller error:", err);
        res.status(500).json({ status: 'error', message: "Server error." });
    }
};

exports.analyzeDomain = async (req, res) => {
    const { profileId, websiteUrl } = req.body;
    if (!profileId || !websiteUrl) {
        return res.status(400).json({ error: "Profile ID and Website URL are required." });
    }
    try {
        const pythonCmd = process.env.PYTHON_COMMAND || 'python3';
        const command = `${pythonCmd} ./python/utils/domain_analyzer.py "${websiteUrl}"`;
        const result = await executeScript(command);
        
        if (result.error || result.status === 'error') {
             return res.status(500).json({ status: 'error', message: result.message || "Failed to analyze domain." });
        }
        const analysisRecord = { url: websiteUrl, data: result, analyzedAt: new Date() };
        await reconProfile.findByIdAndUpdate(profileId, { $push: { domainIntelligence: analysisRecord } });
        res.status(200).json(analysisRecord);
    } catch (err) {
        console.error("Domain analysis controller error:", err);
        res.status(500).json({ status: 'error', message: "Server error." });
    }
};

exports.getProfileHistory = async (req, res) => {
    try {
        const profileId = req.params.id;
        // Find all events for this profile and sort them by most recent first
        const historyEvents = await HistoryEvent.find({ profileId: profileId }).sort({ timestamp: -1 });

        if (!historyEvents) {
            return res.status(404).json([]);
        }
        res.status(200).json(historyEvents);
    } catch (err) {
        console.error("Error fetching profile history:", err);
        res.status(500).json({ error: "Server error while fetching history." });
    }
};

exports.huntForLeaks = async function (req, res) {
    try {
        const profileId = req.body.profileId;
        const profile = await reconProfile.findById(profileId).lean();

        if (!profile) {
            return res.status(404).json({ error: "Profile not found." });
        }

        let keywords = new Set();
        keywords.add(profile.primaryUsername);
        if (profile.enrichedEntities && profile.enrichedEntities.PERSON) {
            profile.enrichedEntities.PERSON.forEach(p => keywords.add(p.text));
        }

        const pythonCmd = process.env.PYTHON_COMMAND || 'python3';
        const command = `${pythonCmd} ./python/utils/leak_hunter.py`;
        const keywordsJson = JSON.stringify(Array.from(keywords));

        const result = await executeScriptWithStdin(command, keywordsJson);

        if (result.error || result.status === 'error') {
            console.error("Leak hunter script returned an error:", result.message);
            return res.status(500).json({ status: 'error', message: "The leak hunter script failed." });
        }

        await reconProfile.findByIdAndUpdate(profileId, {
            $set: { pastebinLeaks: result.leaks_found }
        });

        res.status(200).json(result);

    } catch (err) {
        console.error("Leak hunt controller error:", err);
        res.status(500).json({ status: 'error', message: "Server error during leak hunt." });
    }
};