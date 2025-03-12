import { Router, Request, Response } from "express";
import { tagController } from "../../dependencies";

const router = Router();

router.get("/", tagController.getTags.bind(tagController));

router.post("/", tagController.addTag.bind(tagController));

router.get("/:id", tagController.getTag.bind(tagController));

export default router;