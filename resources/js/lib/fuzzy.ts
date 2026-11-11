function normalize(text: string): string {
    return text.toLowerCase().replace(/[^\p{L}\p{N}/]/gu, '');
}

function isSubsequence(query: string, target: string): boolean {
    let position = 0;

    for (const character of target) {
        if (character === query[position]) {
            position++;
        }

        if (position === query.length) {
            return true;
        }
    }

    return false;
}

function allowedTypos(query: string): number {
    return Math.floor(query.length / 4);
}

/**
 * The fewest edits (insertions, deletions, substitutions and swaps of two
 * neighbouring characters) that turn the query into any part of the target.
 */
function typoDistance(query: string, target: string): number {
    let beforePrevious: number[] = [];
    let previous = Array.from({ length: target.length + 1 }, () => 0);

    for (let i = 1; i <= query.length; i++) {
        const current = [i];

        for (let j = 1; j <= target.length; j++) {
            current[j] = Math.min(
                previous[j] + 1,
                current[j - 1] + 1,
                previous[j - 1] + (query[i - 1] === target[j - 1] ? 0 : 1),
            );

            if (
                i > 1 &&
                j > 1 &&
                query[i - 1] === target[j - 2] &&
                query[i - 2] === target[j - 1]
            ) {
                current[j] = Math.min(current[j], beforePrevious[j - 2] + 1);
            }
        }

        beforePrevious = previous;
        previous = current;
    }

    return Math.min(...previous);
}

/**
 * Scores how well the query matches the target, lower is better, or null
 * when it does not match. Case, spaces and punctuation are ignored.
 */
export function fuzzyScore(query: string, target: string): number | null {
    const search = normalize(query);
    const text = normalize(target);

    if (text.includes(search)) {
        return 0;
    }

    if (isSubsequence(search, text)) {
        return 1;
    }

    const typos = typoDistance(search, text);

    return typos <= allowedTypos(search) ? 1 + typos : null;
}

export function fuzzyFilter<T>(
    items: T[],
    query: string,
    text: (item: T) => string,
): T[] {
    return items
        .map((item) => ({ item, score: fuzzyScore(query, text(item)) }))
        .filter((match) => match.score !== null)
        .toSorted((a, b) => (a.score ?? 0) - (b.score ?? 0))
        .map((match) => match.item);
}
