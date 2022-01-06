import {Kysely, Migration, MysqlDialect, Generated, Migrator, FileMigrationProvider} from 'kysely'
import {databaseConfig} from "../config/index.js";
import path, {dirname} from "path";
import {readdirSync} from "fs";
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Database {
    Tag: {
        id: Generated<number>,
        type: string,
        namespace: string,
        tagName: string
    },
    User: {
        id: Generated<number>,
        username: string,
        password: string
    },
    Media: {
        id: Generated<number>,
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
        id: Generated<number>,
        tagId: number,
        mediaId: number
    },
    Collection: {
        id: Generated<number>,
        name: string
    },
    CollectionMediaMapping: {
        id: Generated<number>,
        collectionId: number,
        mediaId: number
    },
    CollectionShare: {
        id: Generated<number>,
        collectionId: number,
        userId: number
    }
}

const database = new Kysely<Database>({
    dialect: new MysqlDialect(databaseConfig)
})

const migrator = new Migrator({
    db: database,
    provider: {
        async getMigrations(): Promise<Record<string, Migration>> {
            const migrationFiles = readdirSync(path.join(__dirname, 'migrations')).filter(fileName => fileName.endsWith('.js'));
            const migrations: {[key: string]: Migration} = {};
            for(let fileName of migrationFiles) {
                migrations[fileName.substring(0, fileName.length - 2)] = (await import('file://' + path.join(__dirname, 'migrations', fileName)));
            }
            return migrations;
        }
    }
});
await migrator.migrateToLatest();

export default database;