DROP TABLE IF EXISTS "DailyClosure", "Transaction", "Expense", "TruckRegistration", "ExpenseCategory", "TruckType", "User", "Farm" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;

-- Create Enum for Roles
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'FARM_ADMIN', 'WORKER');

-- Create User Table
CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "fullName" TEXT NOT NULL,
  "username" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "phoneNumber" TEXT,
  "role" "Role" NOT NULL DEFAULT 'WORKER',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "farmId" UUID,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Farm Table
CREATE TABLE "Farm" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "location" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create TruckType Table
CREATE TABLE "TruckType" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create ExpenseCategory Table
CREATE TABLE "ExpenseCategory" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create TruckRegistration Table
CREATE TABLE "TruckRegistration" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "truckTypeId" UUID NOT NULL REFERENCES "TruckType"("id"),
  "truckNumber" TEXT NOT NULL,
  "workerId" UUID NOT NULL REFERENCES "User"("id"),
  "farmId" UUID NOT NULL REFERENCES "Farm"("id"),
  "custodyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "overnightAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "driverName" TEXT,
  "driverPhone" TEXT,
  "truckLoad" DOUBLE PRECISION DEFAULT 0,
  "truckLoadUnit" TEXT,
  "date" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Expense Table
CREATE TABLE "Expense" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "categoryId" UUID NOT NULL REFERENCES "ExpenseCategory"("id"),
  "title" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "farmId" UUID NOT NULL REFERENCES "Farm"("id"),
  "workerId" UUID NOT NULL REFERENCES "User"("id"),
  "date" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "notes" TEXT
);

-- Create Transaction Table
CREATE TABLE "Transaction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "referenceNumber" TEXT UNIQUE NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "description" TEXT NOT NULL,
  "farmId" UUID NOT NULL REFERENCES "Farm"("id"),
  "workerId" UUID NOT NULL REFERENCES "User"("id"),
  "date" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create DailyClosure Table
CREATE TABLE "DailyClosure" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "farmId" UUID NOT NULL REFERENCES "Farm"("id"),
  "closedBy" UUID NOT NULL REFERENCES "User"("id"),
  "totalReceipts" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "netBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "trucksCount" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "closedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Custom Admin User
INSERT INTO "User" ("fullName", "username", "passwordHash", "role", "farmId") 
VALUES ('عمر ابراهيم', 'omar1999', 'omar128@', 'SUPER_ADMIN', NULL);

-- Insert Basic Lookups
INSERT INTO "TruckType" ("name") VALUES ('جامبو'), ('بودفر'), ('كساحة'), ('نص نقل');
INSERT INTO "ExpenseCategory" ("name") VALUES ('جاز'), ('أكل'), ('صيانة'), ('تحميل');
