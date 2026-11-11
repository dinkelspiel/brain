type Change = -1 | 0 | 1;

type Part<T> = { type: Change; items: T[] };

type Token = { text: string; isBlock: boolean };

/**
 * Above this many comparisons the changed region is shown as a full replacement.
 */
const MAX_COMPARISONS = 4_000_000;

/**
 * Markdown syntax at the start of a line that decides the block type: fences,
 * horizontal rules, headings, quotes and list markers.
 */
const BLOCK_SYNTAX =
    /^(?:[ \t]*(?:`{3,}|~{3,}).*|[ \t]*(?:[-*_][ \t]*){3,}$|(?:[ \t]*(?:(?:#{1,6}|[-*+](?:[ \t]+\[[ xX]\])?|\d+[.)])[ \t]+|>[ \t]?))+)/;

const WORD = /[\p{L}\p{N}_]+|[^\S\n]+|./gu;

export const ADDED_MARKERS = ['\uE000', '\uE001'] as const;
export const REMOVED_MARKERS = ['\uE002', '\uE003'] as const;

function lines(text: string): string[] {
    return text === '' ? [] : text.split(/(?<=\n)/);
}

function tokenize(text: string): Token[] {
    return lines(text).flatMap((line) => {
        const content = line.endsWith('\n') ? line.slice(0, -1) : line;
        const block = BLOCK_SYNTAX.exec(content)?.[0] ?? '';
        const tokens: Token[] = block ? [{ text: block, isBlock: true }] : [];

        for (const [word] of content.slice(block.length).matchAll(WORD)) {
            tokens.push({ text: word, isBlock: false });
        }

        if (content !== line) {
            tokens.push({ text: '\n', isBlock: false });
        }

        return tokens;
    });
}

function push<T>(parts: Part<T>[], type: Change, items: T[]) {
    if (items.length === 0) {
        return;
    }

    const last = parts.at(-1);

    if (last?.type === type) {
        last.items.push(...items);
    } else {
        parts.push({ type, items: [...items] });
    }
}

/**
 * Diff the changed middle region with a longest common subsequence table.
 */
function changes<T>(
    old: T[],
    next: T[],
    oldKeys: string[],
    nextKeys: string[],
) {
    const parts: Part<T>[] = [];

    if (old.length * next.length > MAX_COMPARISONS) {
        push(parts, -1, old);
        push(parts, 1, next);

        return parts;
    }

    const width = next.length + 1;
    const lengths = new Uint32Array((old.length + 1) * width);

    for (let i = old.length - 1; i >= 0; i--) {
        for (let j = next.length - 1; j >= 0; j--) {
            lengths[i * width + j] =
                oldKeys[i] === nextKeys[j]
                    ? lengths[(i + 1) * width + j + 1] + 1
                    : Math.max(
                          lengths[(i + 1) * width + j],
                          lengths[i * width + j + 1],
                      );
        }
    }

    let i = 0;
    let j = 0;

    while (i < old.length || j < next.length) {
        if (i < old.length && j < next.length && oldKeys[i] === nextKeys[j]) {
            push(parts, 0, [old[i]]);
            i++;
            j++;
        } else if (
            j >= next.length ||
            (i < old.length &&
                lengths[(i + 1) * width + j] >= lengths[i * width + j + 1])
        ) {
            push(parts, -1, [old[i]]);
            i++;
        } else {
            push(parts, 1, [next[j]]);
            j++;
        }
    }

    return parts;
}

function diff<T>(old: T[], next: T[], key: (item: T) => string): Part<T>[] {
    const oldKeys = old.map(key);
    const nextKeys = next.map(key);
    const shortest = Math.min(old.length, next.length);

    let prefix = 0;

    while (prefix < shortest && oldKeys[prefix] === nextKeys[prefix]) {
        prefix++;
    }

    let suffix = 0;

    while (
        suffix < shortest - prefix &&
        oldKeys[old.length - 1 - suffix] === nextKeys[next.length - 1 - suffix]
    ) {
        suffix++;
    }

    const parts: Part<T>[] = [];

    push(parts, 0, old.slice(0, prefix));

    for (const part of changes(
        old.slice(prefix, old.length - suffix),
        next.slice(prefix, next.length - suffix),
        oldKeys.slice(prefix, old.length - suffix),
        nextKeys.slice(prefix, next.length - suffix),
    )) {
        push(parts, part.type, part.items);
    }

    push(parts, 0, old.slice(old.length - suffix));

    return parts;
}

/**
 * Diff the lines first and then the words within the changed lines.
 */
function diffWords(from: string, to: string): Part<Token>[] {
    const parts: Part<Token>[] = [];
    let removed = '';
    let added = '';

    const flush = () => {
        for (const part of diff(
            tokenize(removed),
            tokenize(added),
            (token) => `${Number(token.isBlock)}${token.text}`,
        )) {
            push(parts, part.type, part.items);
        }

        removed = '';
        added = '';
    };

    for (const part of diff(lines(from), lines(to), (line) => line)) {
        if (part.type === -1) {
            removed += part.items.join('');
        } else if (part.type === 1) {
            added += part.items.join('');
        } else {
            flush();
            push(parts, 0, [{ text: part.items.join(''), isBlock: false }]);
        }
    }

    flush();

    return parts;
}

/**
 * The markdown of both versions merged, with the added and removed words wrapped in
 * marker characters. Block syntax is left outside the markers so that the merged text
 * keeps its headings, lists and code blocks, and the newest block type wins when it changed.
 */
export function markChanges(from: string, to: string): string {
    let output = '';
    let removedBlockStart: number | null = null;

    for (const part of diffWords(from, to)) {
        if (removedBlockStart !== null && part.type !== -1) {
            output = output.slice(0, removedBlockStart);
            removedBlockStart = null;
        }

        if (part.type === 0) {
            output += part.items.map((token) => token.text).join('');

            continue;
        }

        const [open, close] = part.type === 1 ? ADDED_MARKERS : REMOVED_MARKERS;
        let run = '';

        const flush = () => {
            if (run !== '') {
                output += open + run + close;
                run = '';
                removedBlockStart = null;
            }
        };

        for (const token of part.items) {
            if (token.text === '\n') {
                flush();
                output += '\n';
                removedBlockStart = null;

                continue;
            }

            if (
                token.isBlock &&
                run === '' &&
                (output === '' || output.endsWith('\n'))
            ) {
                removedBlockStart = part.type === -1 ? output.length : null;
                output += token.text;

                continue;
            }

            run += token.text;
        }

        flush();
    }

    return output;
}
