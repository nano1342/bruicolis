import { Router, Request, Response } from "express";
import * as db from "../src/db";
import Joi from 'joi';
import { PrismaClient, Song } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const sqlRes = await db.sqlRequest('SELECT * FROM "Song"');
    
    res.send(sqlRes.rows);
    
  } catch (error) {
    console.error(error);
    res.send(error);
  }
});

const reqBodyFormatSongPost = Joi.object({
  name: Joi.string().required(),
  release_date: Joi.date().required(),
  artist_id: Joi.number().required()
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
  
  let newSong: Song = await prisma.song.create({
    data: {
      name: req.body.name,
      releaseDate: new Date(req.body.release_date)
    }
  });

  // let newSongArtistLink = prisma.songArtistLink.create({

  // })

  res.send("New song inserted.");
});

export default router;