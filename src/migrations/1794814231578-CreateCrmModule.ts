import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCrmModule1794814231578 implements MigrationInterface {
    name = 'CreateCrmModule1794814231578'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`crm_activity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type\` enum ('CALL', 'MEETING', 'EMAIL', 'NOTE', 'PROPOSAL', 'TASK') NOT NULL DEFAULT 'CALL', \`title\` varchar(255) NOT NULL, \`description\` text NULL, \`status\` enum ('PLANNED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED', \`dueDate\` datetime NULL, \`completedAt\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`dealId\` int NULL, \`customerId\` int NULL, \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`crm_deal\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`description\` text NULL, \`value\` bigint NOT NULL DEFAULT '0', \`stage\` enum ('LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST') NOT NULL DEFAULT 'LEAD', \`priority\` enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM', \`probability\` int NOT NULL DEFAULT '20', \`source\` enum ('DIRECT_SALES', 'REFERRAL', 'WEBSITE', 'TRADE_SHOW', 'COLD_CALL', 'OTHER') NOT NULL DEFAULT 'DIRECT_SALES', \`expectedCloseDate\` date NULL, \`actualCloseDate\` date NULL, \`contactName\` varchar(255) NULL, \`contactEmail\` varchar(255) NULL, \`contactPhone\` varchar(255) NULL, \`companyName\` varchar(255) NULL, \`lostReason\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`customerId\` int NULL, \`assignedToId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`customer\` CHANGE \`opening_balance\` \`opening_balance\` bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`customer\` CHANGE \`credit_limit\` \`credit_limit\` bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`customer\` CHANGE \`due\` \`due\` bigint NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`crm_activity\` ADD CONSTRAINT \`FK_91b777395b9e37289301cc40836\` FOREIGN KEY (\`dealId\`) REFERENCES \`crm_deal\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crm_activity\` ADD CONSTRAINT \`FK_915699e7f44aaf44b66e2f90cb1\` FOREIGN KEY (\`customerId\`) REFERENCES \`customer\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crm_activity\` ADD CONSTRAINT \`FK_74d7be42964e6523d19e2d0872e\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crm_deal\` ADD CONSTRAINT \`FK_6b89247765a91d9df98b311650e\` FOREIGN KEY (\`customerId\`) REFERENCES \`customer\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crm_deal\` ADD CONSTRAINT \`FK_124dad6662c76cdcc2ca1126ca3\` FOREIGN KEY (\`assignedToId\`) REFERENCES \`user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`crm_deal\` DROP FOREIGN KEY \`FK_124dad6662c76cdcc2ca1126ca3\``);
        await queryRunner.query(`ALTER TABLE \`crm_deal\` DROP FOREIGN KEY \`FK_6b89247765a91d9df98b311650e\``);
        await queryRunner.query(`ALTER TABLE \`crm_activity\` DROP FOREIGN KEY \`FK_74d7be42964e6523d19e2d0872e\``);
        await queryRunner.query(`ALTER TABLE \`crm_activity\` DROP FOREIGN KEY \`FK_915699e7f44aaf44b66e2f90cb1\``);
        await queryRunner.query(`ALTER TABLE \`crm_activity\` DROP FOREIGN KEY \`FK_91b777395b9e37289301cc40836\``);
        await queryRunner.query(`ALTER TABLE \`customer\` CHANGE \`due\` \`due\` bigint NULL`);
        await queryRunner.query(`ALTER TABLE \`customer\` CHANGE \`credit_limit\` \`credit_limit\` bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`customer\` CHANGE \`opening_balance\` \`opening_balance\` bigint NOT NULL`);
        await queryRunner.query(`DROP TABLE \`crm_deal\``);
        await queryRunner.query(`DROP TABLE \`crm_activity\``);
    }

}
