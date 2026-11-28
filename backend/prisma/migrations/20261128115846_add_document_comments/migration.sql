-- CreateTable
CREATE TABLE "document_comments" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_comments_documentId_idx" ON "document_comments"("documentId");

-- CreateIndex
CREATE INDEX "document_comments_workspaceId_idx" ON "document_comments"("workspaceId");

-- CreateIndex
CREATE INDEX "document_comments_parentId_idx" ON "document_comments"("parentId");

-- AddForeignKey
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "workspace_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "document_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
