import {Request, Response} from "express";
import Joi, {ValidationError} from "joi";
import database from "../database.js";

export const create = async function(req: Request, res: Response) {
    const schema = Joi.object({
        namespace: Joi.string()
            .min(1)
            .max(32)
            .required(),
        tagName: Joi.string()
            .min(1)
            .max(256)
            .required()
    });

    try {
        const {namespace, tagName}: {namespace: string, tagName: string} = await schema.validateAsync(req.body);

        const existingTag = await database
            .selectFrom('Tag')
            .selectAll()
            .where('namespace', '=', namespace)
            .where('tagName', '=', tagName)
            .executeTakeFirst();

        if(existingTag) {
            return res.status(200).send(existingTag);
        }

        await database
            .insertInto('Tag')
            .values({
                namespace,
                tagName,
                type: 'USER'
            })
            .execute();
        const tag = await database
            .selectFrom('Tag')
            .selectAll()
            .where('namespace', '=', namespace)
            .where('tagName', '=', tagName)
            .executeTakeFirst();
        return res.status(201).send(tag);
    }
    catch(err: any) {
        if(err.isJoi) {
            return res.status(400).send({message: (err as ValidationError).message})
        }
        console.error(err);
        return res.status(500).send({message: 'An error has occurred on the server.'});
    }
}

export const search = async function(req: Request, res: Response) {
    const schema = Joi.object({
        search: Joi.string()
            .min(1)
            .max(289)
            .required(),
        exclude: Joi.array()
            .has(Joi.number().integer().positive())
            .optional()
    });


    try {
        const {search, exclude}: {search: string, exclude: number[] | undefined} = await schema.validateAsync(req.query);

        let namespace = '';
        let tagName = '';
        if(search.includes(':')) {
            namespace = search.split(':')[0];
            tagName = search.split(':')[1];

            if(namespace.length > 32) {
                return res.status(400).send({message: 'Namespace cannot be longer than 32 characters'});
            }
            if(tagName.length > 256) {
                return res.status(400).send({message: 'Tag cannot be longer than 256 characters'});
            }
        }

        if(namespace) {
            let query = database
                .selectFrom('Tag')
                .selectAll()
                .where('namespace', '=', namespace)
                .where('tagName', 'like', `%${tagName}%`)
                .limit(10);
            if(exclude?.length) {
                query = query.where('id', 'not in', exclude);
            }
            const tags = await query.execute();
            return res.status(200).send(tags);
        }
        else {
            let query =  database
                .selectFrom('Tag')
                .selectAll()
                .where(qb =>
                    qb
                        .where('tagName', 'like', `%${search}%`)
                        .orWhere('namespace', 'like', `%${search}%`)
                )
                .limit(10);
            if(exclude?.length) {
                query = query.where('id', 'not in', exclude);
            }
            const tags = await query.execute();
            return res.status(200).send(tags);
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