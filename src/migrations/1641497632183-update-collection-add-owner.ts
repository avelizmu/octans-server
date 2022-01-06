import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('Collection')
        .addColumn('ownerId', 'integer')
        .execute();

    return db.schema
        .alterTable('Collection')
        .addForeignKeyConstraint('collection_ownerId_id_fk', ['ownerId'], 'User', ['id'])
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    return db.schema
        .alterTable('Collection')
        .dropColumn('ownerId')
        .execute();
}