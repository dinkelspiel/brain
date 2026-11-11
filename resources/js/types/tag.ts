export type Tag = {
    id: number;
    parent_id: number | null;
    name: string;
    path: string;
    created_at: string;
    updated_at: string;
};

export type TagInput = {
    parent_id: number | null;
    name: string;
};
