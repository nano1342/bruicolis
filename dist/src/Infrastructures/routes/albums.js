"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dependencies_1 = require("../../dependencies");
const router = (0, express_1.Router)();
router.get("/", dependencies_1.albumController.getAlbums.bind(dependencies_1.albumController));
router.post("/", dependencies_1.albumController.addAlbum.bind(dependencies_1.albumController));
router.get("/:id", dependencies_1.albumController.getAlbum.bind(dependencies_1.albumController));
exports.default = router;
