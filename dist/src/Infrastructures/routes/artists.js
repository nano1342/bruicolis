"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dependencies_1 = require("../../dependencies");
const router = (0, express_1.Router)();
router.get("/", dependencies_1.artistController.getArtists.bind(dependencies_1.artistController));
router.post("/", dependencies_1.artistController.addArtist.bind(dependencies_1.artistController));
router.get("/:id", dependencies_1.artistController.getArtist.bind(dependencies_1.artistController));
exports.default = router;
