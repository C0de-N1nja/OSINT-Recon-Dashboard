const mongoose = require("mongoose");

const ReconProfileSchema = new mongoose.Schema({
	primaryUsername: {
		type: String,
		required: true
	},
	reconDate: {
		type: Date,
		default: Date.now
	},
	status: {
		type: String,
		default: 'initial_scan_complete'
	},
	usernameResults: {
		type: Array,
		default: []
	},
	gitHubData: {
		bio_text: { type: String, default: "" },
		org: { type: String, default: "" },
		location: { type: String, default: "" },
		website: { type: String, default: "" },
		social_media: { type: Map, of: String, default: {} },
		followers_count: { type: String, default: "" },
		following_count: { type: String, default: "" }
	},
	twitterData: {
		display_name: { type: String, default: "" },
		username_handle: { type: String, default: "" },
		bio_text: { type: String, default: "" },
		location: { type: String, default: "" },
		website: { type: String, default: "" },
		join_date: { type: String, default: "" },
		birth_date: { type: String, default: "" },
		following_count: { type: String, default: "" },
		followers_count: { type: String, default: "" },
		verified_badge: { type: Boolean, default: false }
	},
	instagramData: {
		username: { type: String, default: "" },
		display_name: { type: String, default: "" },
		profile_pic_url: { type: String, default: "" },
		bio_text: { type: String, default: "" },
		posts_count: { type: String, default: "" },
		followers_count: { type: String, default: "" },
		following_count: { type: String, default: "" },
		is_private: { type: Boolean, default: false },
		is_verified: { type: Boolean, default: false },
		social_media: { type: Map, of: String, default: {} }
	},
	extractedEntities: {
		PERSON: { type: [String], default: [] },
		ORG: { type: [String], default: [] },
		GPE: { type: [String], default: [] },
		LOC: { type: [String], default: [] }
	},
	enrichedEntities: {
		type: Object,
		default: {}
	},
	riskScore: {
		score: { type: Number, default: 0 },
		label: { type: String, default: "Low" }
	},
	scrapesAttempted: {
		type: [String],
		default: []
	},
});

module.exports = mongoose.model("ReconProfile", ReconProfileSchema);