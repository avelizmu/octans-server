import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import {MysqlDialectConfig} from "kysely/dist/cjs/dialect/mysql/mysql-dialect";

export const databaseConfig: MysqlDialectConfig = yaml.parse(fs.readFileSync(path.resolve('config', 'database.yaml'), 'utf-8'));