const { exec, spawn } = require("child_process");
const reconProfile = require("../models/ReconProfile");
const path = require('path');
const { calculateRiskScore, enrichProfileEntities, generateGraphData } = require("../utils/enrichment");
const puppeteer = require('puppeteer');

function executeScript(command) {
    return new Promise((resolve, reject) => {
        exec(command, { timeout: 90000, killSignal: 'SIGKILL' }, (err, stdout, stderr) => {
            if (err) {
                console.error(`Script failed: ${command}`, stderr);
                return resolve({ error: true, message: err.message, platform: command.split('/').pop().split('.')[0] });
            }
            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (parseError) {
                console.error(`Failed to parse JSON from: ${command}`, stdout);
                resolve({ error: true, message: "Invalid JSON response", platform: command.split('/').pop().split('.')[0] });
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

        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });

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

exports.renderHome = function (req, res) {
    res.render("index", { pageName: 'home' });
};

exports.startInitialScan = function (req, res) {
    const username = req.body.username.trim();

    if (!username || username.length < 1) {
        return res.status(400).send("Username is required");
    }

    const file_path = `${process.env.PYTHON_COMMAND} ./python/username_tracker.py ${username}`;

    exec(file_path, { timeout: 240000 }, async function (err, stdout) {
        if (err) {
            console.log("Username tracker failed:", err);
            return res.status(500).send("Username search failed. Please try again.");
        }

        let results;
        try {
            results = JSON.parse(stdout);
        } catch (err) {
            console.log("Invalid JSON from Python:", err);
            return res.status(500).send("Username search failed: Invalid response from scanner.");
        }

        const newProfile = new reconProfile({
            primaryUsername: username,
            usernameResults: results,
            reconDate: new Date(),
            status: 'initial_scan_complete'
        });

        try {
            await newProfile.save();
            res.redirect(`/profile/intermediate/${newProfile._id}`);
        } catch (err) {
            console.log("Failed to save profile:", err);
            return res.status(500).send("Failed to save scan results to database.");
        }
    });
};

exports.renderIntermediateProfile = async function (req, res) {
    try {
        const profileId = req.params.id;
        const foundProfile = await reconProfile.findById(profileId).lean();

        if (!foundProfile) {
            return res.status(404).send("Profile not found");
        }

        res.render("intermediate_profile", { profile: foundProfile, pageName: 'intermediate' });
    } catch (err) {
        console.log("Error fetching profile:", err);
        return res.status(500).send("Error fetching profile.");
    }
};

exports.runTargetedScrape = async function (req, res) {
    const { profileId, platforms } = req.body;

    if (!profileId || !platforms || platforms.length === 0) {
        return res.redirect(`/profile/${profileId}`);
    }

    try {
        const profile = await reconProfile.findById(profileId);
        if (!profile) {
            return res.status(404).send("Profile not found");
        }

        await reconProfile.findByIdAndUpdate(profileId, {
            $addToSet: { scrapesAttempted: { $each: Array.isArray(platforms) ? platforms : [platforms] } }
        });

        const username = profile.primaryUsername;
        const pythonCmd = process.env.PYTHON_COMMAND || 'python3';

        const commands = [];
        if (platforms.includes('github')) {
            commands.push(`${pythonCmd} ./python/scrapers/github_scraper.py "${username}"`);
        }
        if (platforms.includes('twitter')) {
            commands.push(`${pythonCmd} ./python/scrapers/twitter_scraper.py "${username}"`);
        }
        if (platforms.includes('instagram')) {
            commands.push(`${pythonCmd} ./python/scrapers/instagram_scraper.py "${username}"`);
        }

        console.log('[SCRAPE] Running scrapers in parallel...');
        const scrapeResults = await Promise.all(commands.map(cmd => executeScript(cmd)));
        console.log('[SCRAPE] All scrapers have completed.');

        scrapeResults.forEach(result => {
            if (result.error) return;
            if (result.url && result.url.includes('github')) profile.gitHubData = result;
            if (result.url && result.url.includes('twitter')) profile.twitterData = result;
            if (result.url && result.url.includes('instagram')) profile.instagramData = result;
        });

        let allBiosText = [
            profile.gitHubData?.bio_text,
            profile.twitterData?.bio_text,
            profile.instagramData?.bio_text
        ].filter(Boolean).join(" ");

        if (allBiosText) {
            console.log('[NLP] Running entity extraction...');
            const safeBioText = `"${allBiosText.replace(/"/g, '\\"')}"`;
            const nlpCommand = `${pythonCmd} ./python/ai/bio_entity_extractor.py ${safeBioText}`;

            const nlpResult = await executeScript(nlpCommand);
            if (!nlpResult.error) {
                profile.extractedEntities = nlpResult;
            }
        }

        const enrichedEntities = enrichProfileEntities(profile);
        profile.enrichedEntities = enrichedEntities;
        console.log('[ENRICH] Enrichment complete. Found context for ' + (enrichedEntities.ORG?.filter(o => o.info).length || 0) + ' organizations.');

        console.log('[DORK] Generating Google Dorks...');
        const dorkInput = {
            primaryUsername: profile.primaryUsername,
            extractedEntities: profile.extractedEntities
        };
        const dorkCommand = `${pythonCmd} ./python/utils/google_dork_generator.py '${JSON.stringify(dorkInput)}'`;
        
        const dorkResult = await executeScript(dorkCommand);
        if (dorkResult && !dorkResult.error) {
            profile.googleDorks = dorkResult;
        }

        const riskScoreResult = calculateRiskScore(profile);
        profile.riskScore = {
            score: riskScoreResult.score,
            label: riskScoreResult.label,
            breakdown: riskScoreResult.breakdown
        };

        profile.status = 'scraping_complete';
        await profile.save();
        console.log(`[SUCCESS] Full process complete. Redirecting to final profile...`);

        res.redirect(`/profile/${profileId}`);

    } catch (err) {
        console.log("Targeted scrape failed:", err);
        if (!res.headersSent) {
            return res.status(500).send("Scraping failed. Please try again.");
        }
    }
};

exports.getProfile = async function (req, res) {
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
            pageName: 'profile' 
        });

    } catch (err) {
        console.log("[ERROR] Error fetching profile:", err);
        if (!res.headersSent) {
            return res.status(500).send("Error fetching profile.");
        }
    }
};

exports.exportProfileAsJson = async function (req, res) {
    try {
        const profile = await reconProfile.findById(req.params.id).lean();

        if (!profile) {
            return res.status(404).send('Profile not found');
        }

        const filename = `${profile.primaryUsername}_osint_report.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(JSON.stringify(profile, null, 2));
    } catch (err) {
        console.log('[ERROR] Exporting Profile:', err);
        if (!res.headersSent) {
            res.status(500).send('Server error during file export.');
        }
    }
};

exports.analyzeImage = async function (req, res) {
    const { profileId, imageUrl } = req.body;

    if (!profileId || !imageUrl) {
        return res.status(400).json({ error: "Profile ID and Image URL are required." });
    }

    try {
        const pythonCmd = process.env.PYTHON_COMMAND || 'python3';
        const command = `${pythonCmd} ./python/utils/image_metadata_analyzer.py "${imageUrl}"`;

        const result = await executeScriptWithStdin(command, imageUrl);
        
        if (result.error || result.status === 'error') {
             return res.status(500).json({ status: 'error', message: result.message || "Failed to analyze image." });
        }

        const analysisRecord = {
            url: imageUrl,
            data: result,
            analyzedAt: new Date()
        };

        await reconProfile.findByIdAndUpdate(profileId, {
            $push: { imageMetadata: analysisRecord }
        });

        res.status(200).json(analysisRecord);

    } catch (err) {
        console.error("Image analysis controller error:", err);
        res.status(500).json({ status: 'error', message: "Server error during image analysis." });
    }
};

exports.analyzeDomain = async function (req, res) {
    const { profileId, websiteUrl } = req.body;

    if (!profileId || !websiteUrl) {
        return res.status(400).json({ error: "Profile ID and Website URL are required." });
    }

    try {
        const pythonCmd = process.env.PYTHON_COMMAND || 'python3';
        const command = `${pythonCmd} ./python/utils/domain_analyzer.py "${websiteUrl}"`;

        const result = await executeScript(command); // Using our original exec helper
        
        if (result.error || result.status === 'error') {
             return res.status(500).json({ status: 'error', message: result.message || "Failed to analyze domain." });
        }

        const analysisRecord = {
            url: websiteUrl,
            data: result,
            analyzedAt: new Date()
        };

        await reconProfile.findByIdAndUpdate(profileId, {
            $push: { domainIntelligence: analysisRecord }
        });

        res.status(200).json(analysisRecord);

    } catch (err) {
        console.error("Domain analysis controller error:", err);
        res.status(500).json({ status: 'error', message: "Server error during domain analysis." });
    }
};

exports.exportProfileAsPdf = async function (req, res) {
    let browser;
    try {
        console.log('[PDF] Starting PDF generation...');
        const profile = await reconProfile.findById(req.params.id).lean();

        if (!profile) {
            return res.status(404).send('Profile not found');
        }

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
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        console.log('[PDF] PDF buffer created successfully.');

        const filename = `${profile.primaryUsername}_osint_report.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(pdfBuffer);

    } catch (err) {
        console.log('[ERROR] PDF Export failed:', err);
        if (!res.headersSent) {
            res.status(500).send('Server error during PDF export.');
        }
    } finally {
        if (browser) {
            await browser.close();
            console.log('[PDF] Headless browser closed.');
        }
    }
};