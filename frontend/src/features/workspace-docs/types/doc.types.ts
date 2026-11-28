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
