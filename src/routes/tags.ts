import express from 'express';
import {create, search} from "../controllers/tags.js";

const router = express.Router();

router.post('/', create);
router.get('/search', search);

export default router;