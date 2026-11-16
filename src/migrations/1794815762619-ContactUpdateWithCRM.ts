import { MigrationInterface, QueryRunner } from "typeorm";

export class ContactUpdateWithCRM1794815762619 implements MigrationInterface {
    name = 'ContactUpdateWithCRM1794815762619'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`customer\` ADD \`savings\` int NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`customer\` DROP COLUMN \`savings\``);
    }

}
