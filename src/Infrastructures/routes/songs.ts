import { Router, Request, Response } from "express";
import * as db from "../../db";
import Joi from 'joi';
import { PrismaClient, Song } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

/**
 * Route to get all songs.
 */
router.get("/", async (req: Request, res: Response) => {
  let options = null
  try {
    const page = Number.parseInt(req.query.page as string);
    const limit = Number.parseInt(req.query.limit as string);
    console.log(page, limit, typeof page, typeof limit);
    if (Number.isNaN(page) || Number.isNaN(limit)) {
      throw new Error();
    }

    
    options = {
      skip: (page-1)*limit,
      take: limit
    }
  } catch (error) {}

  let songs;
  console.log(options);
  
  if(options == null) {
    songs = await prisma.song.findMany();
  } else {
    songs = await prisma.song.findMany(options);
  }
  res.send(songs);
});

const reqBodyFormatSongPost = Joi.object({
  name: Joi.string().required(),
  release_date: Joi.date().required(),
  artist_id: Joi.number().required()
});

/**
 * Route to add a song made by one artist.
 * Requires a request body following reqBodyFormatSongPost.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { error, value } = reqBodyFormatSongPost.validate(req.body);
    if (error) {
      res.status(400).send({message: "Incorrect or missing arguments."});
      return;
    }
    if (typeof req.body.artist_id != "number") {
      res.status(400).send({message: "artist_id must be a number."});
      return;
    }
  
    
    const newSong = await prisma.song.create({
      data: {
        name: req.body.name,
        releaseDate: new Date(req.body.release_date), // Replace with the release date if needed
        songArtistLinks: {
          create: {
            artist: {
              connect: { id: req.body.artist_id }, // Connect to the existing artist by ID
            },
          },
        },
      },
    });
  
    res.send("New song inserted.");
    
  } catch (error) {
    res.status(500).send({message: "Something went wrong."});
  }
});

export default router;