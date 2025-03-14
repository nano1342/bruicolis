import { Router, Request, Response } from "express";
import { albumController } from "../../dependencies";

const router = Router();

router.get("/", albumController.getAlbums.bind(albumController));

router.post("/", albumController.addAlbum.bind(albumController));

router.get("/:id", albumController.getAlbum.bind(albumController));

router.get("/:id/songs", albumController.getAlbumSongs.bind(albumController));

router.post("/:id/songs", albumController.addAlbumSong.bind(albumController));

router.get("/:id/tags", albumController.getAlbumTags.bind(albumController));

router.post("/:id/tags", albumController.addAlbumTag.bind(albumController));

export default router;