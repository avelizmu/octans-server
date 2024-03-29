import express from 'express';
import multer from 'multer';
import {fileStorageConfig} from "../../config/index.js";
import {upload as uploadMedia, list, download, listSubtitles, downloadSubtitle, getMedia} from "../controllers/media.js";

const upload = multer({
    dest: `${fileStorageConfig.fileDirectory}/in/`
})

const router = express.Router();

router.post('/upload', upload.single('file'), uploadMedia);
router.post('/list', list);
router.get('/download/:hash/:thumbnail?', download)
router.get('/listSubtitles/:hash', listSubtitles)
router.get('/downloadSubtitle/:hash/:index', downloadSubtitle)
router.get('/:hash', getMedia)

export default router;