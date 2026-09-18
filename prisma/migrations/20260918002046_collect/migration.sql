-- AlterTable
ALTER TABLE "payment_methods" ADD COLUMN     "authorizationCode" TEXT;

-- AlterTable
ALTER TABLE "student_charges" ADD COLUMN     "providerReference" TEXT;
