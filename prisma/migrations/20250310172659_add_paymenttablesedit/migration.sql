/*
  Warnings:

  - You are about to drop the column `payment_method_id` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `transaction_id` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[payment_id]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[order_id]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'UNDER_CONSIDERATION';

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_payment_method_id_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "payment_method_id",
DROP COLUMN "transaction_id",
ADD COLUMN     "payment_id" INTEGER;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "order_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Order_payment_id_key" ON "Order"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_order_id_key" ON "Payment"("order_id");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
