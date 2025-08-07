// routes/reconRoutes.js
const express = require("express");
const router = express.Router();
const reconController = require("../controllers/reconController");
const { ensureAuth } = require('../middleware/auth'); // Import our gatekeeper

// VIVA POINT: Every route below this line is now protected. A user MUST be logged in
// to access any of these endpoints. The `ensureAuth` middleware runs first.

// GET Routes for rendering pages
router.get("/", ensureAuth, reconController.renderHome);
router.get("/profile/:id", ensureAuth, reconController.getProfile);
router.get("/profile/intermediate/:id", ensureAuth, reconController.renderIntermediateProfile);

// GET Route for exporting data
router.get("/profile/:id/export/json", ensureAuth, reconController.exportProfileAsJson);
router.get("/profile/:id/export/pdf", ensureAuth, reconController.exportProfileAsPdf);
router.get("/recon/profile/:id/history", ensureAuth, reconController.getProfileHistory);

// POST Routes for processing actions
router.post("/recon/start", ensureAuth, reconController.startInitialScan);
router.post("/recon/scrape", ensureAuth, reconController.runTargetedScrape);
router.post("/recon/analyze-image", ensureAuth, reconController.analyzeImage);
router.post("/recon/analyze-domain", ensureAuth, reconController.analyzeDomain);
router.post("/recon/profile/:id/monitor", ensureAuth, reconController.toggleMonitoring);
router.post("/recon/hunt-for-leaks", ensureAuth, reconController.huntForLeaks);

module.exports = router;