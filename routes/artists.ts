import { Router, Request, Response } from "express";
import { PrismaClient, Artist } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Liste des artistes" });
});

router.get("/:id", (req: Request, res: Response) => {
  const artistId = req.params.id;
  res.json({ message: `Détails de l'artiste ${artistId}` });
});

/**
 * Route to add a song made by one artist.
 */
router.post("/", async (req: Request, res: Response) => {
  // // SQL request to add the SongArtistLink object : INSERT INTO "SongArtistLink"(song_id, artist_id) VALUES(songId, artistId);
  // let resJson = {};
  // const { error, value } = reqBodyFormatSongPost.validate(req.body);
  
  // if (error) {
  //   res.status(400);
  //   resJson = {error: "Incorrect or missing arguments."}

  // } else {
  //   let reqStr1 = "INSERT INTO \"Song\"(name, release_date) VALUES('" + req.body.name + "', '" + req.body.release_date + "')";
  //   console.log(reqStr1);

    
  //   const sqlRes1 = await db.sqlRequest(reqStr1);
  //   console.log(sqlRes1);
    
  //   // const sqlRes2 = await db.sqlRequest('INSERT INTO "SongArtistLink"(song_id, artist_id) VALUES(1, 2)');
  // }
  // res.send(resJson);

  console.log(req.body);
  
  let newArtist: Artist = await prisma.artist.create({
    data: {
      name: req.body.name
    }
  });

  res.send("New artist inserted.");
});


export default router;