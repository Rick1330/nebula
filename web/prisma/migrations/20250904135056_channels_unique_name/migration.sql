/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,name]` on the table `Channel` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Channel_workspaceId_name_key" ON "public"."Channel"("workspaceId", "name");
