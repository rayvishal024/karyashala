export interface User {
     id: string;
     email: string;
     name: string;
     avatar: string | null;
     role: "USER" | "ADMIN";
     provider: "LOCAL" | "GOOGLE";
     isVerified: boolean;
     createdAt: string;
}

export interface LoginPayload {
     email: string;
     password: string;
}

export interface RegisterPayload {
     name: string;
     email: string;
     password: string;
}