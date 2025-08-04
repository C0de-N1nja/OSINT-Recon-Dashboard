const { exec } = require("child_process");
const reconProfile = require("../models/ReconProfile");
const path = require('path');

exports.renderHome = function (req, res) {
    res.render("index", { pageName: 'home' });
};

exports.startInitialScan = function (req, res) {
    const username = req.body.username.trim();

    if (!username || username.length < 1) {
        return res.status(400).send("Username is required");
    }

    const file_path = `python3 ./python/username_tracker.py ${username}`;

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
    const profileId = req.body.profileId;
    const platforms = req.body.platforms;

    const responseTimeout = setTimeout(function () {
        if (!res.headersSent) {
            console.log('[ERROR] Scraping timeout - sending error response');
            res.status(500).send("Scraping timeout. Please try again.");
        }
    }, 300000);

    let platformsToScrape = [];
    if (platforms) {
        if (Array.isArray(platforms)) {
            platformsToScrape = platforms;
        } else {
            platformsToScrape = [platforms];
        }
    }

    if (platformsToScrape.length === 0) {
        clearTimeout(responseTimeout);
        return res.redirect(`/profile/intermediate/${profileId}`);
    }

    try {
        await reconProfile.findByIdAndUpdate(profileId, {
            $addToSet: { scrapesAttempted: { $each: platformsToScrape } }
        });

        const profile = await reconProfile.findById(profileId);
        if (!profile) {
            clearTimeout(responseTimeout);
            return res.status(404).send("Profile not found");
        }
        const username = profile.primaryUsername;

        let isCompleted = false;

        function safeRespond(callback) {
            if (!isCompleted && !res.headersSent) {
                isCompleted = true;
                clearTimeout(responseTimeout);
                callback();
            }
        }

        function runGitHubScraper() {
            if (isCompleted) return;

            console.log(`[SCRAPE] Running GitHub scraper for ${username}...`);
            const command = `python3 ./python/scrapers/github_scraper.py "${username}"`;

            exec(command, { timeout: 90000, killSignal: 'SIGKILL' }, async function (err, stdout) {
                if (isCompleted) return;

                if (err) {
                    console.log("GitHub scraper failed:", err.message);
                } else {
                    try {
                        if (stdout && stdout.trim()) {
                            const githubData = JSON.parse(stdout);
                            profile.gitHubData = githubData;
                            await profile.save();
                        }
                    } catch (e) {
                        console.log("Failed to parse GitHub JSON:", stdout);
                    }
                }

                if (platformsToScrape.includes("twitter")) {
                    runTwitterScraper();
                } else if (platformsToScrape.includes("instagram")) {
                    runInstagramScraper();
                } else {
                    runNlpAndFinish();
                }
            });
        }

        function runTwitterScraper() {
            if (isCompleted) return;

            console.log(`[SCRAPE] Running Twitter scraper for ${username}...`);
            const command = `python3 ./python/scrapers/twitter_scraper.py "${username}"`;

            exec(command, { timeout: 90000, killSignal: 'SIGKILL' }, async function (err, stdout) {
                if (isCompleted) return;

                if (err) {
                    console.log("Twitter scraper failed:", err.message);
                } else {
                    try {
                        if (stdout && stdout.trim()) {
                            const twitterData = JSON.parse(stdout);
                            profile.twitterData = twitterData;
                            await profile.save();
                        }
                    } catch (e) {
                        console.log("Failed to parse Twitter JSON:", stdout);
                    }
                }

                if (platformsToScrape.includes("instagram")) {
                    runInstagramScraper();
                } else {
                    runNlpAndFinish();
                }
            });
        }

        function runInstagramScraper() {
            if (isCompleted) return;

            console.log(`[SCRAPE] Running Instagram scraper for ${username}...`);
            const command = `python3 ./python/scrapers/instagram_scraper.py "${username}"`;

            exec(command, { timeout: 90000, killSignal: 'SIGKILL' }, async function (err, stdout) {
                if (isCompleted) return;

                if (err) {
                    console.log("Instagram scraper failed:", err.message);
                } else {
                    try {
                        if (stdout && stdout.trim()) {
                            const instagramData = JSON.parse(stdout);
                            profile.instagramData = instagramData;
                            await profile.save();
                        }
                    } catch (e) {
                        console.log("Failed to parse Instagram JSON:", stdout);
                    }
                }

                runNlpAndFinish();
            });
        }

        async function runNlpAndFinish() {
            if (isCompleted) return;

            try {
                const updatedProfile = await reconProfile.findById(profileId);
                if (!updatedProfile) {
                    return safeRespond(function () {
                        res.status(404).send("Profile not found during final step");
                    });
                }

                let allBiosText = [
                    updatedProfile.gitHubData?.bio_text,
                    updatedProfile.twitterData?.bio_text,
                    updatedProfile.instagramData?.bio_text
                ].filter(Boolean).join(" ");

                if (allBiosText) {
                    console.log('[NLP] Running entity extraction...');
                    const safeBioText = `"${allBiosText.replace(/"/g, '\\"')}"`;
                    const command = `python3 ./python/ai/bio_entity_extractor.py ${safeBioText}`;

                    exec(command, { timeout: 30000, killSignal: 'SIGKILL' }, async function (err, stdout) {
                        if (isCompleted) return;

                        if (err) {
                            console.log("NLP script failed:", err.message);
                        } else {
                            try {
                                if (stdout && stdout.trim()) {
                                    const extractedEntities = JSON.parse(stdout);
                                    if (extractedEntities && typeof extractedEntities === 'object' &&
                                        ['PERSON', 'ORG', 'GPE', 'LOC'].every(key => Array.isArray(extractedEntities[key]))) {
                                        updatedProfile.extractedEntities = extractedEntities;
                                    } else {
                                        console.log("Invalid NLP JSON structure:", stdout);
                                    }
                                }
                            } catch (e) {
                                console.log("Failed to parse NLP JSON:", stdout);
                            }
                        }

                        try {
                            let score = 0;
                            const factors = [];

                            if (Array.isArray(updatedProfile.usernameResults)) {
                                const platformCount = updatedProfile.usernameResults.filter(
                                    result => result.status === "Found"
                                ).length;
                                score += platformCount * 10;
                                factors.push(`${platformCount} platforms: ${platformCount * 10}`);
                            }

                            if (allBiosText) {
                                score += 10;
                                factors.push("Bio present: 10");
                                if (allBiosText.length > 50) {
                                    score += 5;
                                    factors.push("Bio >50 chars: 5");
                                }
                            }

                            const orgCount = (updatedProfile.extractedEntities?.ORG?.length || 0) +
                                (updatedProfile.enrichedEntities?.ORG?.length || 0);
                            if (orgCount > 0) {
                                const orgPoints = Math.min(orgCount, 2) * 15;
                                score += orgPoints;
                                factors.push(`${orgCount} ORG entities: ${orgPoints}`);
                            }

                            const locCount = (updatedProfile.extractedEntities?.GPE?.length || 0) +
                                (updatedProfile.extractedEntities?.LOC?.length || 0);
                            let locPoints = locCount * 10;
                            const enrichedLocCount = (updatedProfile.enrichedEntities?.GPE?.length || 0) +
                                (updatedProfile.enrichedEntities?.LOC?.length || 0);
                            if (enrichedLocCount > 0) {
                                locPoints += 5;
                            }
                            locPoints = Math.min(locPoints, 15);
                            if (locCount > 0 || enrichedLocCount > 0) {
                                score += locPoints;
                                factors.push(`${locCount} GPE/LOC + ${enrichedLocCount} enriched: ${locPoints}`);
                            }

                            score = Math.min(score, 100);

                            let label = "Low";
                            if (score > 70) label = "High";
                            else if (score > 30) label = "Medium";

                            updatedProfile.riskScore = { score, label };
                            console.log(`Risk score for ${username}: ${score} (${label}), Factors: ${factors.join(", ")}`);
                        } catch (scoreErr) {
                            console.log("Risk scoring failed:", scoreErr.message);
                        }

                        try {
                            updatedProfile.status = 'scraping_complete';
                            await updatedProfile.save();
                            console.log(`[SUCCESS] Full scrape complete. Redirecting to final profile...`);
                            safeRespond(function () {
                                res.redirect(`/profile/${profileId}`);
                            });
                        } catch (saveErr) {
                            console.log("Failed to save final profile:", saveErr);
                            safeRespond(function () {
                                res.status(500).send("Failed to save final results");
                            });
                        }
                    });
                } else {
                    try {
                        let score = 0;
                        const factors = [];

                        if (Array.isArray(updatedProfile.usernameResults)) {
                            const platformCount = updatedProfile.usernameResults.filter(
                                result => result.status === "Found"
                            ).length;
                            score += platformCount * 10;
                            factors.push(`${platformCount} platforms: ${platformCount * 10}`);
                        }

                        score = Math.min(score, 100);
                        let label = score > 30 ? "Medium" : "Low";
                        updatedProfile.riskScore = { score, label };
                        console.log(`Risk score for ${username}: ${score} (${label}), Factors: ${factors.join(", ")}`);

                        updatedProfile.status = 'scraping_complete';
                        await updatedProfile.save();
                        console.log(`[SUCCESS] Scrape complete (no bios found). Redirecting to final profile...`);
                        safeRespond(function () {
                            res.redirect(`/profile/${profileId}`);
                        });
                    } catch (saveErr) {
                        console.log("Failed to save final profile:", saveErr);
                        safeRespond(function () {
                            res.status(500).send("Failed to save final results");
                        });
                    }
                }
            } catch (nlpErr) {
                console.log("NLP processing failed:", nlpErr);
                safeRespond(function () {
                    res.status(500).send("Final processing failed");
                });
            }
        }

        if (platformsToScrape.includes("github")) {
            runGitHubScraper();
        } else if (platformsToScrape.includes("twitter")) {
            runTwitterScraper();
        } else if (platformsToScrape.includes("instagram")) {
            runInstagramScraper();
        } else {
            runNlpAndFinish();
        }
    } catch (err) {
        console.log("Targeted scrape failed:", err);
        clearTimeout(responseTimeout);
        if (!res.headersSent) {
            return res.status(500).send("Scraping failed. Please try again.");
        }
    }
};

exports.getProfile = async function (req, res) {
    try {
        const profileId = req.params.id;
        const foundProfile = await reconProfile.findById(profileId).lean();

        if (!foundProfile) {
            return res.status(404).send("Profile not found");
        }

        res.render("profile", { profile: foundProfile, pageName: 'profile' });
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