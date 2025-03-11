import { Router, Request, Response } from "express";
import { artistController } from "../../dependencies";

const router = Router();

router.get("/", artistController.getArtists.bind(artistController));

router.post("/", artistController.addArtist.bind(artistController));

router.get("/:id", artistController.getArtist.bind(artistController));


export default router;