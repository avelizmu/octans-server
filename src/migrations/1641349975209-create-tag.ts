import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    return db.schema
        .createTable('Tag')
        .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
        .addColumn('type', 'text')
        .addColumn('namespace', 'text')
        .addColumn('tagName', 'text')
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    return db.schema
        .dropTable('Tag')
        .execute();
}