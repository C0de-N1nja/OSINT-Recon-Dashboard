const express = require("express")
const reconController = require("../controllers/reconController")
const router = express.Router()

// GET Routes for rendering pages
router.get("/", reconController.renderHome)
router.get("/profile/:id", reconController.getProfile)
router.get("/profile/intermediate/:id", reconController.renderIntermediateProfile);

// GET Route for exporting data
router.get("/profile/:id/export/json", reconController.exportProfileAsJson);
router.get("/profile/:id/export/pdf", reconController.exportProfileAsPdf);
router.get("/recon/profile/:id/history", reconController.getProfileHistory);


// POST Routes for processing actions
router.post("/recon/start", reconController.startInitialScan)
router.post("/recon/scrape", reconController.runTargetedScrape)
router.post("/recon/analyze-image", reconController.analyzeImage);
router.post("/recon/analyze-domain", reconController.analyzeDomain);
router.post("/recon/profile/:id/monitor", reconController.toggleMonitoring);
router.post("/recon/hunt-for-leaks", reconController.huntForLeaks);

module.exports = router