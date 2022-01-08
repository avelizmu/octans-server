import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import {MysqlDialectConfig} from "kysely/dist/cjs/dialect/mysql/mysql-dialect";

type RedisConfig = {
    host: string
    port: number
    db: number
}

type SessionConfig = {
    sessionSecrets: string[]
}

type FileStorageConfig = {
    fileDirectory: string
}

export const databaseConfig: MysqlDialectConfig = yaml.parse(fs.readFileSync(path.resolve('config', 'database.yaml'), 'utf-8'));
export const redisConfig: RedisConfig = yaml.parse(fs.readFileSync(path.resolve('config', 'redis.yaml'), 'utf-8'));
export const sessionConfig: SessionConfig = yaml.parse(fs.readFileSync(path.resolve('config', 'session.yaml'), 'utf-8'));
export const fileStorageConfig: FileStorageConfig = yaml.parse(fs.readFileSync(path.resolve('config', 'fileStorage.yaml'), 'utf-8'));