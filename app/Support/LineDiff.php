<?php

namespace App\Support;

use UnexpectedValueException;

/**
 * A line based diff. Operations are applied in order to the lines of the original text:
 * [0, n] keeps n lines, [-1, n] removes n lines and [1, [...lines]] inserts lines.
 *
 * @phpstan-type Operation array{0: int, 1: int|list<string>}
 */
class LineDiff
{
    /**
     * Above this many line comparisons the changed region is stored as a full replacement.
     */
    private const MAX_COMPARISONS = 1_000_000;

    /**
     * @return list<Operation>
     */
    public static function compute(string $from, string $to): array
    {
        $old = explode("\n", $from);
        $new = explode("\n", $to);

        $shortest = min(count($old), count($new));
        $prefix = 0;

        while ($prefix < $shortest && $old[$prefix] === $new[$prefix]) {
            $prefix++;
        }

        $suffix = 0;

        while ($suffix < $shortest - $prefix && $old[count($old) - 1 - $suffix] === $new[count($new) - 1 - $suffix]) {
            $suffix++;
        }

        $operations = [];

        self::push($operations, 0, $prefix);

        foreach (self::changes(
            array_slice($old, $prefix, count($old) - $prefix - $suffix),
            array_slice($new, $prefix, count($new) - $prefix - $suffix),
        ) as [$type, $value]) {
            self::push($operations, $type, $value);
        }

        self::push($operations, 0, $suffix);

        return $operations;
    }

    /**
     * @param  list<Operation>  $operations
     */
    public static function apply(string $from, array $operations): string
    {
        $old = explode("\n", $from);
        $lines = [];
        $position = 0;

        foreach ($operations as [$type, $value]) {
            if (is_array($value)) {
                array_push($lines, ...$value);

                continue;
            }

            if ($type === 0) {
                array_push($lines, ...array_slice($old, $position, $value));
            }

            $position += $value;
        }

        if ($position !== count($old)) {
            throw new UnexpectedValueException('The diff does not match the text it is applied to.');
        }

        return implode("\n", $lines);
    }

    /**
     * Diff the changed middle region with a longest common subsequence table.
     *
     * @param  list<string>  $old
     * @param  list<string>  $new
     * @return list<Operation>
     */
    private static function changes(array $old, array $new): array
    {
        $oldCount = count($old);
        $newCount = count($new);

        if ($oldCount * $newCount > self::MAX_COMPARISONS) {
            return [[-1, $oldCount], [1, $new]];
        }

        $lengths = array_fill(0, $oldCount + 1, array_fill(0, $newCount + 1, 0));

        for ($i = $oldCount - 1; $i >= 0; $i--) {
            for ($j = $newCount - 1; $j >= 0; $j--) {
                $lengths[$i][$j] = $old[$i] === $new[$j]
                    ? $lengths[$i + 1][$j + 1] + 1
                    : max($lengths[$i + 1][$j], $lengths[$i][$j + 1]);
            }
        }

        $operations = [];
        $i = 0;
        $j = 0;

        while ($i < $oldCount || $j < $newCount) {
            if ($i < $oldCount && $j < $newCount && $old[$i] === $new[$j]) {
                self::push($operations, 0, 1);
                $i++;
                $j++;
            } elseif ($j >= $newCount || ($i < $oldCount && $lengths[$i + 1][$j] >= $lengths[$i][$j + 1])) {
                self::push($operations, -1, 1);
                $i++;
            } else {
                self::push($operations, 1, [$new[$j]]);
                $j++;
            }
        }

        return $operations;
    }

    /**
     * Append an operation, merging it into the previous one when they are of the same type.
     *
     * @param  list<Operation>  $operations
     * @param  int|list<string>  $value
     */
    private static function push(array &$operations, int $type, int|array $value): void
    {
        if ($value === 0 || $value === []) {
            return;
        }

        $last = array_key_last($operations);

        if ($last === null || $operations[$last][0] !== $type) {
            $operations[] = [$type, $value];

            return;
        }

        $previous = $operations[$last][1];

        if (is_array($previous) && is_array($value)) {
            $operations[$last][1] = [...$previous, ...$value];
        } elseif (is_int($previous) && is_int($value)) {
            $operations[$last][1] = $previous + $value;
        }
    }
}
