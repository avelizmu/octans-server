import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    return db.schema
        .createTable('CollectionShare')
        .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
        .addColumn('collectionId', 'integer')
        .addColumn('userId', 'integer')
        .addForeignKeyConstraint('collectionshare_collectionId_id_fk', ['collectionId'], 'Collection', ['id'])
        .addForeignKeyConstraint('collectionshare_userId_id_fk', ['userId'], 'User', ['id'])
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    return db.schema
        .dropTable('CollectionShare')
        .execute();
}