import { Router, Request, Response } from "express";
import { albumController } from "../../dependencies";

const router = Router();

router.get("/", albumController.getAlbums.bind(albumController));

router.post("/", albumController.addAlbum.bind(albumController));

router.get("/:id", albumController.getAlbum.bind(albumController));

export default router;