import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    return db.schema
        .createTable('Media')
        .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
        .addColumn('hash', 'varchar(40)')
        .addColumn('mediaType', 'varchar(128)')
        .addColumn('width', 'integer')
        .addColumn('height', 'integer')
        .addColumn('duration', 'integer')
        .addColumn('size', 'bigint')
        .addColumn('created', 'datetime')
        .addColumn('createdBy', 'integer')
        .addForeignKeyConstraint('media_createdBy_id_fk', ['createdBy'], 'User', ['id'])
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    return db.schema
        .dropTable('Media')
        .execute();
}