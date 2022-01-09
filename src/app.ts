import express from "express";
import cookieParser from 'cookie-parser';
import session from 'express-session';
import redis from 'redis';
import connectRedis from 'connect-redis';
import {redisConfig, sessionConfig} from "../config/index.js";

const RedisStore = connectRedis(session);
const redisClient = redis.createClient(redisConfig)

const app = express();

const sessionOptions = {
    cookie: {
        maxAge: 3600000,
        httpOnly: false,
        secure: false
    },
    name: 'sessId',
    saveUninitialized: true,
    secret: sessionConfig.sessionSecrets,
    resave: true,
    rolling: true,
    store: new RedisStore({
        client: redisClient
    })
}
if (app.get('env') === 'production') {
    app.set('trust proxy', 1);
    sessionOptions.cookie.secure = true;
}
app.use(session(sessionOptions));

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

import usersRouter from "./routes/users.js"
import mediaRouter from "./routes/media.js"
import tagsRouter from "./routes/tags.js"

app.use('/users', usersRouter);
app.use('/media', mediaRouter);
app.use('/tags', tagsRouter);

export default app;