import {Request, Response} from "express";
import Joi, {ValidationError} from "joi";
import bcrypt from 'bcrypt';
import database from "../database.js";
import fs from "fs";
import imageSize from "image-size";
import ffmpeg, {FfprobeData} from 'fluent-ffmpeg';
import {promisify} from "util";
import crypto from "crypto";
import {fileStorageConfig} from "../../config/index.js";
import sharp from "sharp";

export const upload = async function(req: Request, res: Response) {
    if(!req.file) {
        return res.status(400).send({message: 'This path must be used for a file upload only.'});
    }

    // Delete file and return if not the right media type
    if(!(req.file.mimetype.startsWith('video/') || req.file.mimetype.startsWith('image/'))) {
        fs.unlink(req.file.path, err => {
            console.error(err);
        });
        return res.status(400).send({message: 'File can only be an image or video type.'});
    }

    // Get the width, height, and duration from the file
    let width = 0;
    let height = 0;
    let duration = 0;
    try {
        if(req.file.mimetype.startsWith('image/')) {
            const dimensions = imageSize(req.file.path);
            width = dimensions.width || 0;
            height = dimensions.height || 0;
        }
        else if(req.file.mimetype.startsWith('video/')) {
            const metadata = (await promisify(ffmpeg.ffprobe)(req.file.path)) as FfprobeData;
            metadata.streams.forEach(stream => {
                if(stream.width && stream.width > width) {
                    width = stream.width;
                }
                if(stream.height && stream.height > height) {
                    height = stream.height;
                }
            });
            duration = metadata.format.duration!;
        }
    }
    catch(err) {
        console.error(err);
        return res.status(500).send({message: 'An error has occurred on the server.'})
    }

    // Get the hash of the file
    let hashCode: string;
    try {
        const readStream = fs.createReadStream(req.file.path);
        const hash = crypto.createHash('sha1');
        hash.setEncoding('hex');
        hashCode = await new Promise((resolve, reject) => {
            readStream.on('end', async function() {
                hash.end();
                resolve(hash.read());
            });
            readStream.on('error', err => reject(err));
            readStream.pipe(hash);
        })
    }
    catch(err) {
        console.error(err);
        return res.status(500).send({message: 'An error has occurred on the server.'});
    }

    // Move the file from input to storage
    try {
        await fs.promises.rename(req.file.path, `${fileStorageConfig.fileDirectory}/storage/${hashCode}`);
    }
    catch(err) {
        console.error(err);
        return res.status(500).send({message: 'An error has occurred on the server.'});
    }

    // Add the entry to the database and return it
    try {
        const media = await database
            .transaction()
            .execute((async database => {
                await database
                    .insertInto('Media')
                    .values({
                        hash: hashCode,
                        mediaType: req.file!.mimetype,
                        width,
                        height,
                        duration,
                        size: req.file!.size,
                        created: new Date(),
                        createdBy: req.session.user!
                    })
                    .execute();

                const media = await database
                    .selectFrom('Media')
                    .selectAll()
                    .where('hash', '=', hashCode)
                    .executeTakeFirst();

                const defaultCollection = await database
                    .selectFrom('Collection')
                    .selectAll()
                    .where('type', '=', 'DEFAULT')
                    .where('ownerId', '=', req.session.user!)
                    .executeTakeFirst();

                await database
                    .insertInto('CollectionMediaMapping')
                    .values({
                        collectionId: defaultCollection!.id,
                        mediaId: media!.id
                    })
                    .execute();

                return media;
            }))

        res.status(200).send(media);
    }
    catch(err) {
        console.error(err);
        return res.status(500).send({message: 'An error has occurred on the server.'});
    }

    // Calculate the thumbnail dimensions
    let thumbnailDimensions: [number, number];
    if(width > height) {
        thumbnailDimensions = [192, Math.floor((192 / width) * height)]
    }
    else {
        thumbnailDimensions = [Math.floor((192 / height) * width), 192]
    }

    // Generate the thumbnail
    if(duration) {
        ffmpeg(`${fileStorageConfig.fileDirectory}/storage/${hashCode}`)
            .screenshots({
                folder: `${fileStorageConfig.fileDirectory}/storage`,
                filename: `${hashCode}.thumbnail.png`,
                timestamps: ['50%'],
                size: `${thumbnailDimensions[0]}x${thumbnailDimensions[1]}`
            });
    }
    else {
        await sharp(`${fileStorageConfig.fileDirectory}/storage/${hashCode}`)
            .resize(...thumbnailDimensions)
            .toFile(`${fileStorageConfig.fileDirectory}/storage/${hashCode}.thumbnail.png`)
    }
}

export const list = async function(req: Request, res: Response) {
    const schema = Joi.object({
        type: Joi.string()
            .equal('Self', 'Shared', 'All')
            .required(),
        tags: Joi.array()
            .has(Joi.number().integer().positive())
            .optional(),
        offset: Joi.number()
            .min(0)
            .optional()
    });

    try {
        let {type, tags, offset}: {type: string, tags?: number[], offset?: number} = await schema.validateAsync(req.query);
        if(!offset) {
            offset = 0;
        }

        if(type === 'Self') {
            let query = database
                .selectFrom('Media')
                .select(['Media.id', 'Media.mediaType', 'Media.created', 'Media.createdBy', 'Media.hash', 'Media.duration', 'Media.height', 'Media.width', 'Media.duration'])
                .where('createdBy', '=', req.session.user!)
                .limit(100)
                .offset(offset);
            if(tags) {
                query = query
                    .innerJoin('TagMediaMapping', 'TagMediaMapping.mediaId', 'Media.id')
                    .groupBy('Media.id')
                    .where('TagMediaMapping.tagId', 'in', tags)
                    .having(database.raw('count(*)'), '>=', tags.length);
            }
            const media = await query.execute();
            return res.status(200).send(media);
        }
        else if(type === 'Shared') {
            let query = database
                .selectFrom('Media')
                .innerJoin('CollectionMediaMapping', 'CollectionMediaMapping.mediaId', 'Media.id')
                .innerJoin('Collection', 'Collection.id', 'CollectionMediaMapping.collectionId')
                .innerJoin('CollectionShare', 'CollectionShare.collectionId', 'Collection.id')
                .select(['Media.id', 'Media.mediaType', 'Media.created', 'Media.createdBy', 'Media.hash', 'Media.duration', 'Media.height', 'Media.width', 'Media.duration'])
                .where('CollectionShare.userId', '=', req.session.user!)
                .limit(100)
                .offset(offset);
            if(tags) {
                query = query
                    .innerJoin('TagMediaMapping', 'TagMediaMapping.mediaId', 'Media.id')
                    .groupBy('Media.id')
                    .where('TagMediaMapping.tagId', 'in', tags)
                    .having(database.raw('count(*)'), '>=', tags.length);
            }
            const media = await query.execute();
            return res.status(200).send(media);
        }
        else {
            let query = await database
                .selectFrom('Media')
                .innerJoin('CollectionMediaMapping', 'CollectionMediaMapping.mediaId', 'Media.id')
                .innerJoin('Collection', 'Collection.id', 'CollectionMediaMapping.collectionId')
                .innerJoin('CollectionShare', 'CollectionShare.collectionId', 'Collection.id')
                .select(['Media.id', 'Media.mediaType', 'Media.created', 'Media.createdBy', 'Media.hash', 'Media.duration', 'Media.height', 'Media.width', 'Media.duration'])
                .where(qb =>
                    qb
                        .where('CollectionShare.userId', '=', req.session.user!)
                        .orWhere('Media.createdBy', '=', req.session.user!)
                )
                .limit(100)
                .offset(offset);
            if(tags) {
                query = query
                    .innerJoin('TagMediaMapping', 'TagMediaMapping.mediaId', 'Media.id')
                    .groupBy('Media.id')
                    .where('TagMediaMapping.tagId', 'in', tags)
                    .having(database.raw('count(*)'), '>=', tags.length);
            }
            const media = await query.execute();

            return res.status(200).send(media);
        }
    }
    catch(err: any) {
        if(err.isJoi) {
            return res.status(400).send({message: (err as ValidationError).message})
        }
        console.error(err);
        return res.status(500).send({message: 'An error has occurred on the server.'});
    }
}