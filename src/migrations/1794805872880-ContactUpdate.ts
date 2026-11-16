import { MigrationInterface, QueryRunner } from "typeorm";

export class ContactUpdate1794805872880 implements MigrationInterface {
    name = 'ContactUpdate1794805872880'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`customer\` DROP COLUMN \`savings\``);
        await queryRunner.query(`ALTER TABLE \`customer\` DROP COLUMN \`is_hire_account_closed\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`customer\` ADD \`is_hire_account_closed\` tinyint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`customer\` ADD \`savings\` bigint NOT NULL DEFAULT '0'`);
    }

}
