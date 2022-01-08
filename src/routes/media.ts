import express from 'express';
import multer from 'multer';
import {fileStorageConfig} from "../../config/index.js";
import {upload as uploadMedia} from "../controllers/media.js";

const upload = multer({
    dest: `${fileStorageConfig.fileDirectory}/in/`
})

const router = express.Router();

router.post('/upload', upload.single('file'), uploadMedia);

export default router;