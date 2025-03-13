import Database from "better-sqlite3";
import { getArtistsService, getSongsService } from "../src/dependencies";
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

const MAX_ARTISTS = 10_000;
const MAX_SONGS = 10_000;
const MAX_MAPPINGS = 200_000;

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

    importArtists();
}

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

            let name = r[2]; // name is the 3rd field in the csv
            if (name.length > 255) {
                name = name.substring(0, 255);
                console.warn("truncated name", r[2], name);
            }
            try {
                getArtistsService.addArtist({
                    id: 0, // ignored by service,
                    name,
                    musicbrainzId: parseInt(r[0]),
                });
            } catch (e) {
                console.error("failed to import artist", r, e);
            }
        },
        onendorclose: () => {
            console.log("artists imported.");
            buildArtistCreditMappings();
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

let songPromises: Promise<void>[] = [];
function importSongs() {
    console.log("=== preparing song imports...");
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

            let name = r[2]; // name is the 3rd field in the csv
            if (name.length > 255) {
                name = name.substring(0, 255);
                console.warn(`truncated name${r[2]}\n\t==> ${name}`);
            }
            const artistCredit = parseInt(r[3]);
            const artistIds = mapArtistCreditToArtists(artistCredit);
            if (!artistIds || artistIds.length === 0) {
                // console.warn(
                //     `Cannot import song "${name} because it doesn't have any bound artist in the database."`
                // );
                // TODO uncomment this line
                return;
            }

            songPromises.push(
                new Promise((resolve, reject) => {
                    const f = async () => {
                        // map musicbrainz id to db id
                        let dbArtistIds: number[] = [];
                        for (const id of artistIds) {
                            const dbArtistId =
                                await getArtistsService.findArtistIdByMusicBrainzId(
                                    id
                                );
                            if (dbArtistId) {
                                dbArtistIds.push(dbArtistId.id);
                            }
                        }
                        if (dbArtistIds.length === 0) {
                            // console.warn(
                            //     `Cannot import song "${name} because it doesn't have any bound artist (with corresponding musicbrainz id) in the database."`
                            // );
                            // TODO uncomment this line
                            return;
                        }
                        const recordingId = parseInt(r[0]);
                        const releaseDate =
                            getRecordingFirstReleaseDate(recordingId);
                        const date = new Date();
                        if (releaseDate !== null) {
                            date.setUTCFullYear(releaseDate?.year);
                            date.setUTCMonth(releaseDate.month);
                            date.setUTCDate(releaseDate.day);
                        }
                        //  TODO FIXME: https://musicbrainz.org/doc/Medium album
                        try {
                            await getSongsService.addSongWithMultipleArtists(
                                {
                                    id: 0, // ignored by service,
                                    name,
                                    release_date: date,
                                },
                                dbArtistIds
                            );
                        } catch (e) {
                            console.error("failed to import song", r, e);
                        }
                    };
                    f().then(resolve).catch(reject);
                })
            );
        },
        onendorclose: () => {
            console.log("songs imports prepared.");
            importAlbums();
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

type ReleaseDateOrNull = ReleaseDate | null;
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
}

function mapArtistCreditToArtists(artistCredit: number): number[] {
    return db
        .prepare(
            "SELECT artist FROM artist_credit_to_artist WHERE artist_credit = ?"
        )
        .all(artistCredit)
        .map((v) => (v as { artist: number }).artist);
}

function importAlbums() {
    finish();
}

async function finish() {
    console.log(`${songPromises.length} song promises to process...`)
    // https://stackoverflow.com/questions/42341331/es6-promise-all-progress
    function* settledOrder(promises: Promise<void>[]) {
        let i = 0;
        interface NextResolveParam {
            status: string;
            reason?: any;
            value?: any;
            original_index: number;
            index: number;
        }
        let next_resolve: (v: NextResolveParam) => void;
        const callback =
            (
                original_index: number,
                status: string,
                field: "value" | "reason"
            ) =>
            (arg: any) => {
                next_resolve({
                    status,
                    [field]: arg,
                    original_index,
                    index: i++,
                });
            };
        promises.forEach((promise, index) =>
            promise
                .then(callback(index, "fullfiled", "value"))
                .catch(callback(index, "rejected", "reason"))
        );
        while (i < promises.length) {
            yield new Promise<NextResolveParam>((r) => (next_resolve = r));
        }
    }

    let progress = 0;
    const progressMax = songPromises.length;

    for await (const {
        index,
        original_index,
        status,
        value,
        reason,
    } of settledOrder(songPromises)) {
        console.log(index, original_index, status, value, reason);
        progress = index + 1;
        if (progress % 100 === 0) {
            console.log(progress);
        }
    }
    console.log("=== done ===");
}

start();
