import {Kysely, Migration, MysqlDialect} from 'kysely'
import {databaseConfig} from "../config/index.js";
import path, {dirname} from "path";
import {readdirSync} from "fs";
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Database {
    Tag: {
        id: number,
        type: string,
        namespace: string,
        tagName: string
    },
    User: {
        id: number,
        username: string,
        password: string
    },
    Media: {
        id: number,
        hash: string,
        mediaType: string,
        width: number,
        height: number,
        duration: number,
        size: number,
        created: Date,
        createdBy: number
    },
    TagMediaMapping: {
        id: number,
        tagId: number,
        mediaId: number
    },
    Collection: {
        id: number,
        name: string
    },
    CollectionMediaMapping: {
        id: number,
        collectionId: number,
        mediaId: number
    },
    CollectionShare: {
        id: number,
        collectionId: number,
        userId: number
    }
}

const database = new Kysely<Database>({
    dialect: new MysqlDialect(databaseConfig)
})

const migrationFiles = readdirSync(path.join(__dirname, 'migrations')).filter(fileName => fileName.endsWith('.js'));
const migrations: {[key: string]: Migration} = {};
for(let fileName of migrationFiles) {
    migrations[fileName.substring(0, fileName.length - 2)] = (await import('file://' + path.join(__dirname, 'migrations', fileName)));
}
await database.migration.migrateToLatest(migrations);


export default database;