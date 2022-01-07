import {Request, Response} from "express";
import Joi, {ValidationError} from "joi";
import bcrypt from 'bcrypt';
import database from "../database.js";

declare module 'express-session' {
    interface SessionData {
        user: number
    }
}

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

        const newUser = await database.transaction()
            .execute((async database => {
                // Create the new user
                await database
                    .insertInto('User')
                    .values({
                        username: username,
                        password: passwordHash
                    })
                    .execute();

                // Get the created user
                const newUser = await database
                    .selectFrom('User')
                    .select(['id', 'username'])
                    .where('username', '=', username)
                    .limit(1)
                    .executeTakeFirst()

                // Create the default collection
                await database
                    .insertInto('Collection')
                    .values({
                        name: 'Default Collection',
                        type: 'DEFAULT',
                        ownerId: newUser!.id
                    })
                    .execute();

                return newUser;
            }))

        req.session.user = newUser!.id;
        return res.status(201).send(newUser);
    }
    catch(err: any) {
        if(err.isJoi) {
            return res.status(400).send({message: (err as ValidationError).message})
        }
        console.error(err);
        return res.status(500).send({message: 'An error has occurred on the server.'});
    }
}

export const login = async function(req: Request, res: Response) {
    if(req.session.user) {
        const user = await database
            .selectFrom('User')
            .select(['username'])
            .where('id', '=', req.session.user)
            .executeTakeFirst();

        if(!user) {
            req.session.user = undefined;
        }
        else {
            return res.status(200).send({
                id: req.session.user,
                username: user.username
            })
        }
    }

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

        if(!existingUser) {
            return res.status(400).send({message: 'The username or password is incorrect.'})
        }

        const passwordsMatch = await bcrypt.compare(password, existingUser.password);
        if(!passwordsMatch) {
            return res.status(400).send({message: 'The username or password is incorrect.'})
        }

        req.session.user = existingUser.id;
        return res.status(200).send({
            id: existingUser.id,
            username
        })
    }
    catch(err: any) {
        if(err.isJoi) {
            return res.status(400).send({message: (err as ValidationError).message})
        }
        console.error(err);
        return res.status(500).send({message: 'An error has occurred on the server.'});
    }
}