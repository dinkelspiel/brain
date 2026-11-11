export type User = {
    id: number;
    username: string;
};

export type Auth = {
    user: User | null;
};
