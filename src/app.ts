import express from "express";

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

import usersRouter from "./routes/users.js"

app.use('/users', usersRouter);

export default app;