const fs = require('fs');
const path = require('path');

const universityDataPath = path.join(__dirname, '../python/data/hec_universities_data.json');
const universitiesData = JSON.parse(fs.readFileSync(universityDataPath, 'utf8'));

function enrichProfileEntities(profile) {
    const enrichedData = {
        ORG: [],
        GPE: [],
        LOC: [],
        PERSON: []
    };

    const extracted = profile.extractedEntities || {};
    
    const potentialOrgKeywords = ['corp', 'ltd', 'inc', 'university', 'solutions', 'foundation', 'group'];

    const orgs = new Set(extracted.ORG || []);
    
    (extracted.LOC || []).forEach(loc => {
        if (potentialOrgKeywords.some(keyword => loc.toLowerCase().includes(keyword))) {
            orgs.add(loc); 
        } else {
            if (!enrichedData.LOC.find(e => e.text.toLowerCase() === loc.toLowerCase())) {
                 enrichedData.LOC.push({ text: loc, info: null, isEnriched: false });
            }
        }
    });

    orgs.forEach(orgName => {
        const foundUni = universitiesData.find(uni => 
            uni.name.toLowerCase().includes(orgName.toLowerCase()) || 
            orgName.toLowerCase().includes(uni.name.toLowerCase())
        );

        if (foundUni) {
            enrichedData.ORG.push({ text: orgName, info: `${foundUni.sector} University in ${foundUni.city}`, isEnriched: true });
        } else {
            enrichedData.ORG.push({ text: orgName, info: null, isEnriched: false });
        }
    });

    (extracted.GPE || []).forEach(gpe => {
         if (!enrichedData.GPE.find(e => e.text.toLowerCase() === gpe.toLowerCase())) {
            enrichedData.GPE.push({ text: gpe, info: null, isEnriched: false });
         }
    });
    
    (extracted.PERSON || []).forEach(person => {
        if (!enrichedData.PERSON.find(e => e.text.toLowerCase() === person.toLowerCase())) {
           enrichedData.PERSON.push({ text: person, info: null, isEnriched: false });
        }
    });

    return enrichedData;
}

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

    if (Array.isArray(profile.usernameResults)) {
        const platformCount = profile.usernameResults.filter(
            result => result.status === "Found"
        ).length;
        breakdown.initialScan = platformCount * 2;
        score += breakdown.initialScan;
    }

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

    if (profile.extractedEntities?.ORG?.length > 0) {
        breakdown.professional.organization = Math.min(profile.extractedEntities.ORG.length, 2) * 15;
        score += breakdown.professional.organization;
    }

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

    score = Math.min(score, 100);

    let label = "Low";
    if (score > 70) label = "High";
    else if (score > 30) label = "Medium";

    return {
        score,
        label,
        breakdown,
    };
}

module.exports = {
    calculateRiskScore,
    enrichProfileEntities
};