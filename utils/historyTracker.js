const HistoryEvent = require('../models/HistoryEvent');

const fieldsToTrack = {
    'GitHub': ['bio_text', 'location', 'org', 'website', 'followers_count'],
    'Twitter': ['bio_text', 'location', 'website', 'followers_count', 'following_count'],
    'Instagram': ['bio_text', 'followers_count', 'following_count']
};

const checkForChange = (profileId, platform, field, oldValue, newValue) => {
    const oldStr = String(oldValue || '').trim();
    const newStr = String(newValue || '').trim();

    if (oldStr !== newStr) {
        console.log(`[HISTORY] Change detected for ${profileId} on ${platform}.${field}: "${oldStr}" -> "${newStr}"`);
        return new HistoryEvent({
            profileId,
            platform,
            field,
            oldValue: oldStr,
            newValue: newStr
        });
    }
    return null;
};

async function trackChanges(oldProfile, newProfile) {
    const changes = [];
    const profileId = newProfile._id;

    const platformDataMap = {
        'GitHub': { oldData: oldProfile.gitHubData, newData: newProfile.gitHubData },
        'Twitter': { oldData: oldProfile.twitterData, newData: newProfile.twitterData },
        'Instagram': { oldData: oldProfile.instagramData, newData: newProfile.instagramData }
    };
    
    for (const platform in fieldsToTrack) {
        const { oldData, newData } = platformDataMap[platform];
        if (!oldData || !newData) continue;

        for (const field of fieldsToTrack[platform]) {
            const event = checkForChange(profileId, platform, field, oldData[field], newData[field]);
            if (event) {
                changes.push(event);
            }
        }
    }

    if (changes.length > 0) {
        await HistoryEvent.insertMany(changes);
        console.log(`[HISTORY] Saved ${changes.length} change event(s) to the database.`);
    }
}

module.exports = { trackChanges };