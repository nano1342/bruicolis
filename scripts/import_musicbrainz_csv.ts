import Database from "better-sqlite3";
import { getArtistsService, getSongsService, albumsService } from "../src/dependencies";
import { Artist } from "../src/Domains/Models/Artist";

// import artists csv from file
import { parse } from "csv-parse";
import { release } from "os";
import { ReadStream } from "fs";
import { resolve } from "path";
const fs = require("fs");
const path = require("path");
let db: Database.Database;

// __dirname is in dist !!!
const root = path.resolve(__dirname, "..", "..", "musicbrainz_csv");
const artistsCsv = path.resolve(root, "out_artist.csv");
const songsCsv = path.resolve(root, "out_recording.csv");
const artistCreditNameCsv = path.resolve(root, "out_artist_credit_name.csv");
const trackCsv = path.resolve(root, "out_track.csv");
const mediumCsv = path.resolve(root, "out_medium.csv");
const releaseCsv = path.resolve(root, "out_release.csv");
const releaseCountryCsv = path.resolve(root, "out_release_country.csv");

interface ReleaseDate {
    year: number;
    month: number;
    day: number;
}

// not enough memory, using sqlite
// const artistCreditToArtist = new Map<number, number[]>();
// const recordingToMedium = new Map<number, number[]>();
// const mediumToRelease = new Map<number, number[]>();
// const releaseToReleaseDate = new Map<number, ReleaseDate[]>();

const MAX_ARTISTS = 50_000;
const MAX_SONGS = 5_000;
const MAX_MAPPINGS = 200_000;
const MAX_ALBUMS = 5_000;

function read(
    path: unknown,
    callbacks: {
        ondata: (r: string[], s: ReadStream) => void;
        onendorclose: () => void;
    }
) {
    const stream: ReadStream = fs.createReadStream(path);
    let endOrCloseSent = false; // both events are not mutually exclusive
    const sendEndOrClose = () => {
        if (!endOrCloseSent) {
            callbacks.onendorclose();
            endOrCloseSent = true;
        }
    };
    stream
        .on("close", sendEndOrClose)
        .pipe(parse({ delimiter: "," }))
        .on("data", (r: string[]) => callbacks.ondata(r, stream))
        .on("end", sendEndOrClose);
}

function start() {
    // remove existing database if any
    if (fs.existsSync("musicbrainzMapping.db")) {
        fs.unlinkSync("musicbrainzMapping.db");
    }
    db = new Database("musicbrainzMapping.db");
    db.pragma("journal_mode = WAL");

    // setup maps
    db.exec(
        "CREATE TABLE artist_credit_to_artist (artist_credit INTEGER, artist INTEGER)"
    );
    db.exec(
        "CREATE TABLE recording_to_medium (recording INTEGER, medium INTEGER)"
    );
    db.exec("CREATE TABLE medium_to_release (medium INTEGER, release INTEGER)");
    db.exec(
        "CREATE TABLE release_to_release_date (release INTEGER, year INTEGER, month INTEGER, day INTEGER)"
    );
    db.exec(
        "CREATE TABLE artist_musicbrainz_to_db_id (musicbrainz_id INTEGER, id INTEGER)"
    );

    importArtists();
}

function getTruncatedName(name: string, maxLength: number) {
    let n = name;
    if (n.length > 255) {
        n = n.substring(0, 255);
        console.warn(`truncated name: ${name}\n\t-->${n}`);
    }
    return n;
}

let expectedArtists = 0;
let acknowledgedArtists = 0;
function importArtists() {
    console.log("=== importing artists...");
    let i = 0;
    read(artistsCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 10000 === 0 && i <= MAX_ARTISTS) {
                console.log(i);
            }
            if (i > MAX_ARTISTS) {
                stream.destroy();
                return;
            }

            let name = getTruncatedName(r[2], 255); // name is the 3rd field in the csv
            const musicbrainzId = parseInt(r[0]);
            try {
                expectedArtists++;
                getArtistsService
                    .addArtist({
                        id: 0, // ignored by service,
                        name,
                        musicbrainzId,
                    })
                    .then((artist) => {
                        if (artist !== null) {
                            db.prepare(
                                "INSERT INTO artist_musicbrainz_to_db_id VALUES (?, ?)"
                            ).run(musicbrainzId, artist.id);
                        }
                        acknowledgedArtists++;
                    });
            } catch (e) {
                expectedArtists--;
                console.error("failed to import artist", r, e);
            }
        },
        onendorclose: () => {
            const interval = setInterval(() => {
                console.log(
                    `acknowledged artists: ${acknowledgedArtists}/${expectedArtists}`
                );
                if (acknowledgedArtists === expectedArtists) {
                    clearInterval(interval);
                    console.log("artists imports prepared.");
                    buildArtistCreditMappings();
                }
            }, 1000);
        },
    });
}

function buildArtistCreditMappings() {
    console.log("=== building artist credit mappings...");
    let i = 0;
    read(artistCreditNameCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 50000 === 0 && i <= MAX_MAPPINGS) {
                console.log(i);
            }
            if (i > MAX_MAPPINGS) {
                stream.destroy();
                return;
            }

            // artist credit name : link between [artist credit (array), position] and artist.
            // so we can directly map one artist credti to n artists

            const artistCredit = parseInt(r[0]);
            const artist = parseInt(r[2]);
            // pushToArrayOrInitInMap(artistCreditToArtist, artistCredit, artist);
            db.prepare("INSERT INTO artist_credit_to_artist VALUES (?, ?)").run(
                artistCredit,
                artist
            );
        },
        onendorclose: () => {
            console.log("artist credit mappings done.");
            buildTrackMappings();
        },
    });
}

function buildTrackMappings() {
    console.log("=== building track mappings...");
    let i = 0;
    read(trackCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 50000 === 0 && i <= MAX_MAPPINGS) {
                console.log(i);
            }
            if (i > MAX_MAPPINGS) {
                stream.destroy();
                return;
            }

            const recording = parseInt(r[2]);
            const medium = parseInt(r[3]);
            // pushToArrayOrInitInMap(recordingToMedium, recording, medium);
            db.prepare("INSERT INTO recording_to_medium VALUES (?, ?)").run(
                recording,
                medium
            );
        },
        onendorclose: () => {
            console.log("recording to medium mappings done.");
            buildMediumToReleaseMappings();
        },
    });
}

function buildMediumToReleaseMappings() {
    console.log("=== building medium to release mappings...");
    let i = 0;
    read(mediumCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 50000 === 0 && i <= MAX_MAPPINGS) {
                console.log(i);
            }
            if (i > MAX_MAPPINGS) {
                stream.destroy();
                return;
            }

            const medium = parseInt(r[0]);
            const release = parseInt(r[1]);
            // pushToArrayOrInitInMap(mediumToRelease, medium, release);
            db.prepare("INSERT INTO medium_to_release VALUES (?, ?)").run(
                medium,
                release
            );
        },
        onendorclose: () => {
            console.log("medium to release mappings done.");
            buildReleaseToReleaseCountryMappings();
        },
    });
}

function buildReleaseToReleaseCountryMappings() {
    console.log("=== building release to release date mappings...");
    let i = 0;
    read(releaseCountryCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 50000 === 0 && i <= MAX_MAPPINGS) {
                console.log(i);
            }
            if (i > MAX_MAPPINGS) {
                stream.destroy();
                return;
            }

            const release = parseInt(r[0]);
            const releaseDate = {
                year: parseInt(r[2]),
                month: parseInt(r[3]),
                day: parseInt(r[4]),
            };
            // pushToArrayOrInitInMap(releaseToReleaseDate, release, releaseDate);
            db.prepare(
                "INSERT INTO release_to_release_date VALUES (?, ?, ?, ?)"
            ).run(
                release,
                releaseDate.year,
                releaseDate.month,
                releaseDate.day
            );
        },
        onendorclose: () => {
            console.log("release to release date mappings done.");
            importSongs();
        },
    });
}

// function pushToArrayOrInitInMap<K, V>(map: Map<K, V[]>, key: K, value: V) {
//     if (!map.has(key)) {
//         map.set(key, []);
//     }
//     let array = map.get(key)!;
//     array.push(value);
//     map.set(key, array);
// }

let expectedSongs = 0;
let acknowledgedSongs = 0;

function importSongs() {
    console.log("=== importing songs...");
    let i = 0;
    read(songsCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 1000 === 0 && i <= MAX_SONGS) {
                console.log(i);
            }
            if (i > MAX_SONGS) {
                stream.destroy();
                return;
            }

            let name = getTruncatedName(r[2], 255); // name is the 3rd field in the csv
            const artistCredit = parseInt(r[3]);
            const artistIds = mapArtistCreditToArtists(artistCredit);
            if (!artistIds || artistIds.length === 0) {
                // console.warn(
                //     `Cannot import song "${name} because it doesn't have any bound artist in the database."`
                // );
                // TODO uncomment this line
                return;
            }

            // map musicbrainz id to db id
            let dbArtistIds: number[] = artistIdsToDbIds(artistIds);
            if (dbArtistIds.length === 0) {
                // console.warn(
                //     `Cannot import song "${name} because it doesn't have any bound artist (with corresponding musicbrainz id) in the database."`
                // );
                // TODO uncomment this line
                return;
            }
            const recordingId = parseInt(r[0]);
            const releaseDate = getRecordingFirstReleaseDate(recordingId);
            const date = convertToDate(releaseDate);

            try {
                expectedSongs++;
                getSongsService
                    .addSongWithMultipleArtists(
                        {
                            id: 0, // ignored by service,
                            name,
                            release_date: date,
                        },
                        dbArtistIds
                    )
                    .then(() => {
                        acknowledgedSongs++;
                    });
            } catch (e) {
                console.error("failed to import song", r, e);
            }
        },
        onendorclose: () => {
            const interval = setInterval(() => {
                console.log(
                    `acknowledged songs: ${acknowledgedSongs}/${expectedSongs}`
                );
                if (acknowledgedSongs === expectedSongs) {
                    clearInterval(interval);
                    console.log("songs imported.");
                    importAlbums();
                }
            }, 1000);
        },
    });
}

// function getRecordingFirstReleaseDate(recordingId: number): ReleaseDate | null {
//     const medium = recordingToMedium.get(recordingId);
//     if (medium === undefined || medium.length === 0) {
//         return null;
//     }

//     let releases: number[] = [];
//     for (const m of medium) {
//         const mediumReleases = mediumToRelease.get(m);
//         if (mediumReleases !== undefined) {
//             releases.concat(mediumReleases);
//         }
//     }
//     if (releases.length === 0) {
//         return null;
//     }

//     let releaseDates: ReleaseDate[] = [];
//     for (const r of releases) {
//         const rDates = releaseToReleaseDate.get(r);
//         if (rDates !== undefined) {
//             releaseDates.concat(rDates);
//         }
//     }
//     if (releaseDates.length === 0) {
//         return null;
//     } else {
//         return releaseDates.reduce((acc, current) => {
//             // find the earliest date
//             if (acc.year < current.year) {
//                 return acc;
//             } else if (acc.year > current.year) {
//                 return current;
//             } else {
//                 if (acc.month < current.month) {
//                     return acc;
//                 } else if (acc.month > current.month) {
//                     return current;
//                 } else {
//                     if (acc.day < current.day) {
//                         return acc;
//                     } else {
//                         return current;
//                     }
//                 }
//             }
//         })
//     }
// }

function getRecordingFirstReleaseDate(recordingId: number): ReleaseDate | null {
    const releaseDates: ReleaseDate[] = [];
    const stmt = db.prepare(
        "SELECT year,month,day FROM recording_to_medium NATURAL JOIN medium_to_release NATURAL JOIN release_to_release_date WHERE recording = ?"
    );
    for (const row of stmt.iterate(recordingId)) {
        const r = row as { year: number; month: number; day: number };
        releaseDates.push({
            year: r.year,
            month: r.month,
            day: r.day,
        });
    }

    if (releaseDates.length === 0) {
        return null;
    } else {
        return getMinimumDate(releaseDates);
    }
}

function getReleaseFirstReleaseDate(releaseId: number): ReleaseDate | null {
    const releaseDates: ReleaseDate[] = [];
    const stmt = db.prepare(
        "SELECT year,month,day FROM release_to_release_date WHERE release = ?"
    );
    for (const row of stmt.iterate(releaseId)) {
        const r = row as { year: number; month: number; day: number };
        releaseDates.push({
            year: r.year,
            month: r.month,
            day: r.day,
        });
    }

    if (releaseDates.length === 0) {
        return null;
    } else {
        return getMinimumDate(releaseDates);
    }
}

function getMinimumDate(releaseDates: ReleaseDate[]): ReleaseDate {
    return releaseDates.reduce((acc, current) => {
        // find the earliest date
        if (acc.year < current.year) {
            return acc;
        } else if (acc.year > current.year) {
            return current;
        } else {
            if (acc.month < current.month) {
                return acc;
            } else if (acc.month > current.month) {
                return current;
            } else {
                if (acc.day < current.day) {
                    return acc;
                } else {
                    return current;
                }
            }
        }
    });
}

function findArtistIdByMusicBrainzId(id: number): { id: number } | undefined {
    return db
        .prepare(
            "SELECT id FROM artist_musicbrainz_to_db_id WHERE musicbrainz_id = ?"
        )
        .get(id) as { id: number } | undefined;
}

function mapArtistCreditToArtists(artistCredit: number): number[] {
    return db
        .prepare(
            "SELECT artist FROM artist_credit_to_artist WHERE artist_credit = ?"
        )
        .all(artistCredit)
        .map((v) => (v as { artist: number }).artist);
}

let expectedAlbums = 0;
let acknowledgedAlbums = 0;
/**
 * @see https://musicbrainz.org/doc/Medium
 */
function importAlbums() {
    // finish();
    console.log("=== importing albums...");
    let i = 0;

    read(releaseCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 1000 === 0 && i <= MAX_ALBUMS) {
                console.log(i);
            }
            if (i > MAX_ALBUMS) {
                stream.destroy();
                return;
            }

            let name = getTruncatedName(r[2], 255); // name is the 3rd field in the csv
            const artistCredit = parseInt(r[3]);
            const artistIds = mapArtistCreditToArtists(artistCredit);
            if (!artistIds || artistIds.length === 0) {
                // console.warn(
                //     `Cannot import album "${name} because it doesn't have any bound artist in the database."`
                // );
                // TODO uncomment this line
                return;
            }

            // map musicbrainz id to db id
            let dbArtistIds: number[] = artistIdsToDbIds(artistIds);
            if (dbArtistIds.length === 0) {
                // console.warn(
                //     `Cannot import album "${name} because it doesn't have any bound artist (with corresponding musicbrainz id) in the database."`
                // );
                // TODO uncomment this line
                return;
            }
            const recordingId = parseInt(r[0]);
            const releaseDate = getReleaseFirstReleaseDate(recordingId);
            const date = convertToDate(releaseDate);

            try {
                expectedAlbums++;
                albumsService
                    .addAlbumWithMultipleArtists(
                        {
                            id: 0, // ignored by service,
                            name,
                            release_date: date,
                        },
                        dbArtistIds
                    )
                    .then(() => {
                        acknowledgedAlbums++;
                    });
            } catch (e) {
                console.error("failed to import album", r, e);
            }
        },
        onendorclose: () => {
            const interval = setInterval(() => {
                console.log(
                    `acknowledged albums: ${acknowledgedAlbums}/${expectedAlbums}`
                );
                if (acknowledgedAlbums === expectedAlbums) {
                    clearInterval(interval);
                    console.log("albums imported.");
                    finish();
                }
            }, 1000);
        },
    });
    // // import album ===
    // let name = getTruncatedName(r[2], 255); // name is the 3rd field in the csv
    // const artistCredit = parseInt(r[3]);
}

function convertToDate(releaseDate: ReleaseDate | null): Date {
    const date = new Date();
    if (releaseDate !== null) {
        date.setUTCFullYear(Math.max(1970, releaseDate.year));
        date.setUTCMonth(releaseDate.month);
        date.setUTCDate(releaseDate.day);
    }
    return date;
}

const artistIdsToDbIdsCache = new Map<number, number | undefined>();
function artistIdsToDbIds(artistIds: number[]): number[] {
    let dbArtistIds: number[] = [];
    for (const id of artistIds) {
        let dbArtistId: number | undefined;
        if (artistIdsToDbIdsCache.has(id)) {
            dbArtistId = artistIdsToDbIdsCache.get(id)!;
            continue;
        } else {
            dbArtistId = findArtistIdByMusicBrainzId(id)?.id;
            artistIdsToDbIdsCache.set(id, dbArtistId);
        }
        if (dbArtistId !== undefined) {
            dbArtistIds.push(dbArtistId);
        }

    }
    return dbArtistIds;
}

async function finish() {
    console.log("=== done ===");
}

start();
