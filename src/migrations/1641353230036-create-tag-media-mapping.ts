import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    return db.schema
        .createTable('TagMediaMapping')
        .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
        .addColumn('tagId', 'integer')
        .addColumn('mediaId', 'integer')
        .addForeignKeyConstraint('tagmediamapping_tagId_id_fk', ['tagId'], 'Tag', ['id'])
        .addForeignKeyConstraint('tagmediamapping_mediaId_id_fk', ['mediaId'], 'Media', ['id'])
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    return db.schema
        .dropTable('TagMediaMapping')
        .execute();
}