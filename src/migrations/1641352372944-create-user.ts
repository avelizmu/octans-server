import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    return db.schema
        .createTable('User')
        .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
        .addColumn('username', 'varchar(64)')
        .addColumn('password', 'varchar(60)')
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    return db.schema
        .dropTable('User')
        .execute();
}