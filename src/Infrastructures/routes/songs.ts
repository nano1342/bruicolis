import { Router, Request, Response } from "express";
import { songController } from "../../dependencies";

const router = Router();

router.get("/", songController.getSongs.bind(songController));

router.post("/", songController.addSong.bind(songController));

router.get("/:id", songController.getSong.bind(songController));

export default router;