import { Kysely, MysqlDialect } from 'kysely'
import {databaseConfig} from "../config/index.js";

interface Database {
}

const database = new Kysely<Database>({
    dialect: new MysqlDialect(databaseConfig)
})

export default database;