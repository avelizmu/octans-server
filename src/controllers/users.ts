import {Request, Response} from "express";
import Joi, {ValidationError} from "joi";
import bcrypt from 'bcrypt';
import database from "../database.js";

export const createUser = async function(req: Request, res: Response) {
    const schema = Joi.object({
        username: Joi.string()
            .min(1)
            .max(64)
            .required(),
        password: Joi.string()
            .min(1)
            .max(50)
            .regex(/[a-zA-Z0-9 `~!@#$%^&*()\-_+=[\]{};:'"<>,./?\\]+/)
            .required()
    });

    try {
        const {username, password}: {username: string, password: string} = await schema.validateAsync(req.body);

        const existingUser = await database
            .selectFrom('User')
            .selectAll()
            .where('username', '=', username)
            .limit(1)
            .executeTakeFirst();

        if(existingUser) {
            return res.status(400).send({message: 'An account with that username already exists.'})
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await database
            .insertInto('User')
            .values({
                username: username,
                password: passwordHash
            })
            .execute();

        return res.status(201).send(
            await database
                .selectFrom('User')
                .select(['id', 'username'])
                .where('username', '=', username)
                .limit(1)
                .executeTakeFirst()
        )
    }
    catch(err: any) {
        if(err.isJoi) {
            return res.status(400).send({message: (err as ValidationError).message})
        }
        console.error(err);
        return res.status(500).send({message: 'An error has occurred on the server.'});
    }
}