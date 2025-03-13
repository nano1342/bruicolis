"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dependencies_1 = require("../../dependencies");
const router = (0, express_1.Router)();
router.get("/", dependencies_1.songController.getSongs.bind(dependencies_1.songController));
router.post("/", dependencies_1.songController.addSong.bind(dependencies_1.songController));
router.get("/:id", dependencies_1.songController.getSong.bind(dependencies_1.songController));
exports.default = router;
