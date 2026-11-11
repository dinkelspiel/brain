<?php

use App\Support\LineDiff;

it('turns one text into another', function (string $from, string $to) {
    expect(LineDiff::apply($from, LineDiff::compute($from, $to)))->toBe($to);
})->with([
    'identical' => ["a\nb", "a\nb"],
    'empty to text' => ['', "a\nb"],
    'text to empty' => ["a\nb", ''],
    'changed middle line' => ["a\nb\nc", "a\nx\nc"],
    'inserted at the start' => ["b\nc", "a\nb\nc"],
    'appended at the end' => ["a\nb", "a\nb\nc\n"],
    'interleaved changes' => ["a\nb\nc\nd\ne", "a\nc\nx\ne\nf"],
    'repeated lines' => ["a\na\nb\na", "a\nb\na\na"],
    'completely different' => ["a\nb", "x\ny\nz"],
]);

it('keeps unchanged lines as counts', function () {
    expect(LineDiff::compute("a\nb\nc", "a\nx\nc"))->toBe([[0, 1], [-1, 1], [1, ['x']], [0, 1]])
        ->and(LineDiff::compute("a\nb", "a\nb"))->toBe([[0, 2]]);
});

it('replaces the changed region when it is too large to compare line by line', function () {
    $from = implode("\n", array_map(fn (int $line) => "old {$line}", range(1, 1001)));
    $to = implode("\n", array_map(fn (int $line) => "new {$line}", range(1, 1001)));

    $diff = LineDiff::compute($from, $to);

    expect($diff)->toHaveCount(2)
        ->and($diff[0])->toBe([-1, 1001])
        ->and(LineDiff::apply($from, $diff))->toBe($to);
});

it('refuses a diff for a different text', function () {
    LineDiff::apply("a\nb\nc", LineDiff::compute("a\nb", "a\nx"));
})->throws(UnexpectedValueException::class);
