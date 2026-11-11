export type DocumentData = {
    id: number;
    title: string;
    content?: string;
    created_at: string;
    updated_at: string;
};

export type DocumentInput = {
    title: string;
    content: string;
};

export type DocumentSearchResult = {
    id: number;
    title: string;
    excerpt: string | null;
    created_at: string;
    updated_at: string;
};

export type DocumentHistoryEntry = {
    id: number;
    title: string;
    content?: string;
    previous_content?: string | null;
    created_at: string;
    updated_at: string;
};
