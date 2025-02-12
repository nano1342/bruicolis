import { Router } from "express";
const router = Router();
router.get("/", (req, res) => {
    res.json({ message: "Liste des artistes" });
});
router.get("/:id", (req, res) => {
    const artistId = req.params.id;
    res.json({ message: `Détails de l'artiste ${artistId}` });
});
export default router;
