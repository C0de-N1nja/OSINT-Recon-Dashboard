// utils/enrichment.js
function calculateRiskScore(profile) {
    let score = 0;
    const breakdown = {
        initialScan: 0,
        deepScrape: {
            github: 0,
            twitter: 0,
            instagram: 0,
        },
        pii: {
            person: 0,
            location: 0,
        },
        professional: {
            organization: 0,
        },
        engagement: {
            followers: 0,
            verified: 0,
        },
    };

    // 1. Initial Scan (Low Confidence, +2 per platform)
    if (Array.isArray(profile.usernameResults)) {
        const platformCount = profile.usernameResults.filter(
            result => result.status === "Found"
        ).length;
        breakdown.initialScan = platformCount * 2;
        score += breakdown.initialScan;
    }

    // 2. Deep Scrape Confirmation (High Confidence)
    if (profile.gitHubData && (profile.gitHubData.bio_text || profile.gitHubData.org)) {
        breakdown.deepScrape.github = 30;
        score += 30;
    }
    if (profile.twitterData && !profile.twitterData.error && 
        (profile.twitterData.bio_text || profile.twitterData.location || profile.twitterData.website)) {
        breakdown.deepScrape.twitter = 25;
        score += 25;
    }
    if (profile.instagramData && !profile.instagramData.error && 
        (profile.instagramData.bio_text || profile.instagramData.social_media.website)) {
        breakdown.deepScrape.instagram = 20;
        score += 20;
    }

    // 3. PII (from NLP and Deep Scrapes)
    if (profile.extractedEntities?.PERSON?.length > 0) {
        breakdown.pii.person = Math.min(profile.extractedEntities.PERSON.length, 2) * 10;
        score += breakdown.pii.person;
    }
    const locCount = (profile.extractedEntities?.GPE?.length || 0) + 
                     (profile.extractedEntities?.LOC?.length || 0);
    if (locCount > 0) {
        breakdown.pii.location = Math.min(locCount, 2) * 10;
        score += breakdown.pii.location;
    }

    // 4. Professional Context
    if (profile.extractedEntities?.ORG?.length > 0) {
        breakdown.professional.organization = Math.min(profile.extractedEntities.ORG.length, 2) * 15;
        score += breakdown.professional.organization;
    }

    // 5. Engagement Signals
    let totalFollowers = 0;
    if (profile.twitterData?.followers_count) {
        const followers = parseInt(profile.twitterData.followers_count.replace(/[,KMB]/g, '')) || 0;
        totalFollowers += followers;
    }
    if (profile.instagramData?.followers_count) {
        const followers = parseInt(profile.instagramData.followers_count.replace(/[,KMB]/g, '')) || 0;
        totalFollowers += followers;
    }
    if (totalFollowers > 1000) {
        breakdown.engagement.followers = 10;
        score += 10;
    } else if (totalFollowers > 100) {
        breakdown.engagement.followers = 5;
        score += 5;
    }
    if (profile.twitterData?.verified_badge || profile.instagramData?.is_verified) {
        breakdown.engagement.verified = 10;
        score += 10;
    }

    // Cap score at 100
    score = Math.min(score, 100);

    // Determine label
    let label = "Low";
    if (score > 70) label = "High";
    else if (score > 30) label = "Medium";

    return {
        score,
        label,
        breakdown,
    };
}

module.exports = { calculateRiskScore };