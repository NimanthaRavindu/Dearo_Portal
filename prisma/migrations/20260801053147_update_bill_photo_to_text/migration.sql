/*
  Warnings:

  - You are about to drop the column `documentId` on the `documentrequest` table. All the data in the column will be lost.
  - You are about to drop the column `fromBranchId` on the `documentrequest` table. All the data in the column will be lost.
  - You are about to drop the column `toBranchId` on the `documentrequest` table. All the data in the column will be lost.
  - The values [LOAN_DOC,ACCOUNT_DOC,INVESTMENT_DOC] on the enum `documentrequest_documentType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[docNumber]` on the table `documentrequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `docNumber` to the `documentrequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `documentrequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `documentrequest` DROP FOREIGN KEY `DocumentRequest_fromBranchId_fkey`;

-- DropForeignKey
ALTER TABLE `documentrequest` DROP FOREIGN KEY `DocumentRequest_toBranchId_fkey`;

-- DropForeignKey
ALTER TABLE `requesthistory` DROP FOREIGN KEY `RequestHistory_branchId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_branchId_fkey`;

-- AlterTable
ALTER TABLE `account` ADD COLUMN `billPhoto` TEXT NULL;

-- AlterTable
ALTER TABLE `documentrequest` DROP COLUMN `documentId`,
    DROP COLUMN `fromBranchId`,
    DROP COLUMN `toBranchId`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `docNumber` VARCHAR(191) NOT NULL,
    ADD COLUMN `senderId` INTEGER NOT NULL,
    MODIFY `documentType` ENUM('LOAN', 'ACCOUNT', 'INVESTMENT') NOT NULL,
    MODIFY `status` ENUM('PENDING', 'APPROVED', 'DECLINED', 'RETURNED', 'SUBMITTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `investment` ADD COLUMN `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `user` ADD COLUMN `branch_name` VARCHAR(100) NULL,
    ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `role` ENUM('ADMIN', 'USER', 'MANAGER') NOT NULL DEFAULT 'USER',
    MODIFY `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- CreateIndex
CREATE UNIQUE INDEX `DocumentRequest_docNumber_key` ON `documentrequest`(`docNumber`);

-- CreateIndex
CREATE INDEX `DocumentRequest_senderId_fkey` ON `documentrequest`(`senderId`);

-- CreateIndex
CREATE UNIQUE INDEX `User_email_key` ON `user`(`email`);

-- AddForeignKey
ALTER TABLE `documentrequest` ADD CONSTRAINT `DocumentRequest_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `branch`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requesthistory` ADD CONSTRAINT `RequestHistory_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branch`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `User_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branch`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- RedefineIndex
CREATE INDEX `User_branchId_idx` ON `user`(`branchId`);
DROP INDEX `User_branchId_fkey` ON `user`;
