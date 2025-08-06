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

// POST Routes for processing actions
router.post("/recon/start", reconController.startInitialScan)
router.post("/recon/scrape", reconController.runTargetedScrape)
router.post("/recon/analyze-image", reconController.analyzeImage);
router.post("/recon/analyze-domain", reconController.analyzeDomain);

module.exports = router