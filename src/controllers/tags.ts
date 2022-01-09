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
