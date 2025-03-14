import { Router, Request, Response } from "express";
import { songController } from "../../dependencies";

const router = Router();

router.get("/", songController.getSongs.bind(songController));

router.post("/", songController.addSong.bind(songController));

router.get("/:id", songController.getSong.bind(songController));

router.post("/:id/add_tag", songController.addTag.bind(songController));

router.get("/:id/tags", songController.getTags.bind(songController));

export default router;