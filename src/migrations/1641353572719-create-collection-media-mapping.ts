import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    return db.schema
        .createTable('CollectionMediaMapping')
        .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
        .addColumn('collectionId', 'integer')
        .addColumn('mediaId', 'integer')
        .addForeignKeyConstraint('collectionmediamapping_collectionId_id_fk', ['collectionId'], 'Collection', ['id'])
        .addForeignKeyConstraint('collectionmediamapping_mediaId_id_fk', ['mediaId'], 'Media', ['id'])
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    return db.schema
        .dropTable('CollectionMediaMapping')
        .execute();
}