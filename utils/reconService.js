const { exec, spawn } = require("child_process");
const reconProfile = require('../models/ReconProfile');
const { calculateRiskScore, enrichProfileEntities, generateGraphData } = require("./enrichment");

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

async function performDeepScan(profileId, platforms) {
    try {
        const profile = await reconProfile.findById(profileId);
        if (!profile) throw new Error("Profile not found during deep scan");

        const platformsToScrape = Array.isArray(platforms) ? platforms : [platforms];
        await reconProfile.findByIdAndUpdate(profileId, {
            $addToSet: { scrapesAttempted: { $each: platformsToScrape } }
        });

        const username = profile.primaryUsername;
        const pythonCmd = process.env.PYTHON_COMMAND || 'python3';

        // Build scraper commands
        const commands = [];
        const scrapePosts = platformsToScrape.includes('twitter_posts');

        if (platformsToScrape.includes('github')) {
            commands.push(`${pythonCmd} ./python/scrapers/github_scraper.py "${username}"`);
        }
        if (platformsToScrape.includes('twitter') || scrapePosts) {
            let twitterCmd = `${pythonCmd} ./python/scrapers/twitter_scraper.py "${username}"`;
            if (scrapePosts) twitterCmd += " --scrape-posts";
            commands.push(twitterCmd);
        }
        if (platformsToScrape.includes('instagram')) {
            commands.push(`${pythonCmd} ./python/scrapers/instagram_scraper.py "${username}"`);
        }

        // Execute scrapers
        const scrapeResults = await Promise.all(commands.map(cmd => executeScript(cmd)));

        // Process results
        scrapeResults.forEach(result => {
            if (result && !result.error) {
                if (result.url.includes('github')) profile.gitHubData = result;
                if (result.url.includes('twitter')) profile.twitterData = result;
                if (result.url.includes('instagram')) profile.instagramData = result;
            }
        });
        
        // Run NLP
        let textForNlp = [
            profile.gitHubData?.bio_text,
            profile.twitterData?.bio_text,
            profile.instagramData?.bio_text,
            ...(profile.twitterData?.recent_posts || [])
        ].filter(Boolean).join(" ");
        
        if (textForNlp) {
            const safeText = `'${JSON.stringify(textForNlp)}'`;
            const nlpCommand = `${pythonCmd} ./python/ai/bio_entity_extractor.py ${safeText}`;
            const nlpResult = await executeScript(nlpCommand);
            if (nlpResult && !nlpResult.error) profile.extractedEntities = nlpResult;
        }

        // Enrich entities
        profile.enrichedEntities = enrichProfileEntities(profile);
        
        // Generate Dorks
        const dorkInput = { primaryUsername: profile.primaryUsername, extractedEntities: profile.extractedEntities };
        const dorkCommand = `${pythonCmd} ./python/utils/google_dork_generator.py '${JSON.stringify(dorkInput)}'`;
        const dorkResult = await executeScript(dorkCommand);
        if (dorkResult && !dorkResult.error) profile.googleDorks = dorkResult;

        // Calculate Risk Score
        profile.riskScore = calculateRiskScore(profile);
        profile.status = 'scraping_complete';

        // Save final profile
        await profile.save();
        console.log(`[DEEP SCAN] Scan complete for ${profile.primaryUsername}.`);

    } catch (err) {
        console.error(`[ERROR] performDeepScan failed for profile ${profileId}:`, err);
        throw err;
    }
}

module.exports = { performDeepScan };