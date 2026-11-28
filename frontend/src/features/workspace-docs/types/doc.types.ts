export interface DocumentPerson {
     id: string;
     name: string;
     avatar: string | null;
}

export interface WorkspaceDoc {
     id: string;
     workspaceId: string;
     title: string;
     excerpt?: string;
     contentJson?: object | null;
     contentText?: string;
     createdAt: string;
     updatedAt: string;
     createdBy: DocumentPerson;
     updatedBy: DocumentPerson;
}

export interface CreateDocPayload {
     title?: string;
}

export interface UpdateDocPayload {
     title?: string;
     contentJson?: object;
     contentText?: string;
}

export interface DocumentCommentAuthor {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
}

export interface DocumentComment {
      id: string;
      documentId: string;
      workspaceId: string;
      parentId: string | null;
      body: string;
      createdAt: string;
      updatedAt: string;
      author: DocumentCommentAuthor;
      replies?: DocumentComment[];
}

export interface CreateDocumentCommentPayload {
      body: string;
      parentId?: string;
}
