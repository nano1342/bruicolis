"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.json({ message: "Liste des artistes" });
});
router.get("/:id", (req, res) => {
    const artistId = req.params.id;
    res.json({ message: `Détails de l'artiste ${artistId}` });
});
exports.default = router;
