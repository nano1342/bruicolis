import { Router, Request, Response } from "express";
import { PrismaClient, Artist } from "@prisma/client";
import { artistController } from "../../dependencies";

const prisma = new PrismaClient();
const router = Router();

router.get("/", artistController.getArtists.bind(artistController));

router.get("/:id", artistController.getArtist.bind(artistController));
// router.get("/:id", async (req: Request, res: Response) => {
//   const artist_id :number = +req.params.id;
  
//   try {
//     let artistFound = await prisma.artist.findUnique({
//       where: {
//         id: artist_id,
//       },
//     });

//     if (!artistFound) {
//       res.status(404).send({ message: "Artist not found" });
//       return;
//     }
//     res.send(artistFound);

//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ message: "An error occurred while fetching the artist" });
//   };

// });

/**
 * Route to add a song made by one artist.
 */
router.post("/", async (req: Request, res: Response) => {
  let newArtist: Artist = await prisma.artist.create({
    data: {
      name: req.body.name
    }
  });

  res.send("New artist inserted.");
});


export default router;