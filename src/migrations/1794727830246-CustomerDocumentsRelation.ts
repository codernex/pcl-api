import { MigrationInterface, QueryRunner } from "typeorm";

export class CustomerDocumentsRelation1794727830246 implements MigrationInterface {
    name = 'CustomerDocumentsRelation1794727830246'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`customer\` DROP COLUMN \`documents\``);
        await queryRunner.query(`ALTER TABLE \`documents\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`documents\` ADD \`customerId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`documents\` ADD CONSTRAINT \`FK_1cbf180163aa949282edd424a92\` FOREIGN KEY (\`customerId\`) REFERENCES \`customer\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`documents\` DROP FOREIGN KEY \`FK_1cbf180163aa949282edd424a92\``);
        await queryRunner.query(`ALTER TABLE \`documents\` DROP COLUMN \`customerId\``);
        await queryRunner.query(`ALTER TABLE \`documents\` DROP COLUMN \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`customer\` ADD \`documents\` text COLLATE "utf8mb4_general_ci" NULL`);
    }

}
