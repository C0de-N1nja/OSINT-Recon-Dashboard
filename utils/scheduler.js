const cron = require('node-cron');
const reconProfile = require('../models/ReconProfile');
const { performDeepScan } = require('./reconService');


// Schedule a task to run at 2:00 AM every day.
// Format: minute hour day-of-month month day-of-week
const start = () => {
    // cron.schedule('*/15 * * * * *', async () => {
    cron.schedule('0 2 * * *', async () => {
        console.log('[SCHEDULER] Running daily monitoring scan...');
        try {
            const profilesToMonitor = await reconProfile.find({ isMonitoring: true });

            if (profilesToMonitor.length === 0) {
                console.log('[SCHEDULER] No profiles are marked for monitoring. Task complete.');
                return;
            }

            console.log(`[SCHEDULER] Found ${profilesToMonitor.length} profile(s) to monitor.`);

            for (const profile of profilesToMonitor) {
                const platformsToRescan = profile.scrapesAttempted;
                console.log(`[SCHEDULER] Rescanning ${profile.primaryUsername} for platforms: [${platformsToRescan.join(', ')}]`);
                
                await performDeepScan(profile._id, platformsToRescan);
                
                await new Promise(resolve => setTimeout(resolve, 5000)); 
            }
            console.log('[SCHEDULER] Daily monitoring scan finished.');

        } catch (error) {
            console.error('[SCHEDULER] An error occurred during the monitoring task:', error);
        }
    });

    console.log('[SCHEDULER] Continuous monitoring service has been started.');
};

module.exports = { start };