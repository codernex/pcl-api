import { MigrationInterface, QueryRunner } from "typeorm";

export class ContactUpdate1794805987062 implements MigrationInterface {
    name = 'ContactUpdate1794805987062'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`customer\` CHANGE \`opening_balance\` \`opening_balance\` bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`customer\` CHANGE \`credit_limit\` \`credit_limit\` bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`customer\` CHANGE \`due\` \`due\` bigint NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`customer\` CHANGE \`due\` \`due\` bigint NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`customer\` CHANGE \`credit_limit\` \`credit_limit\` bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`customer\` CHANGE \`opening_balance\` \`opening_balance\` bigint NOT NULL DEFAULT '0'`);
    }

}
