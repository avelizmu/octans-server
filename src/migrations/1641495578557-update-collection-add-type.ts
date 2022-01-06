import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    return db.schema
        .alterTable('Collection')
        .addColumn('type', 'varchar(16)')
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    return db.schema
        .alterTable('Collection')
        .dropColumn('type')
        .execute();
}