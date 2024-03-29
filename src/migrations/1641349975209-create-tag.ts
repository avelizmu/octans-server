import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    return db.schema
        .createTable('Tag')
        .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
        .addColumn('type', 'varchar(64)')
        .addColumn('namespace', 'varchar(32)')
        .addColumn('tagName', 'varchar(256)')
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    return db.schema
        .dropTable('Tag')
        .execute();
}