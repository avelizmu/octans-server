import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    return db.schema
        .createTable('Collection')
        .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
        .addColumn('type', 'text')
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    return db.schema
        .dropTable('Collection')
        .execute();
}