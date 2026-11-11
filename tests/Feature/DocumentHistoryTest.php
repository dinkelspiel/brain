<?php

use App\Models\Document;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());

    $this->document = Document::find(
        $this->postJson(route('api.v1.documents.store'), [
            'title' => 'Notes',
            'content' => "one\ntwo\nthree",
        ])->json('data.id'),
    );
});

function saveDocument(Document $document, array $input): void
{
    test()->patchJson(route('api.v1.documents.update', $document), $input)->assertOk();
}

it('records a keyframe when a document is created', function () {
    $history = $this->document->histories()->sole();

    expect($history->isKeyframe())->toBeTrue()
        ->and($history->title)->toBe('Notes')
        ->and($history->content)->toBe("one\ntwo\nthree");
});

it('folds saves within the history window into the latest entry', function () {
    $this->travel(Document::HISTORY_WINDOW_MINUTES - 1)->minutes();
    saveDocument($this->document, ['title' => 'Renamed', 'content' => "one\nTWO\nthree"]);

    $history = $this->document->histories()->sole();

    expect($history->isKeyframe())->toBeTrue()
        ->and($history->title)->toBe('Renamed')
        ->and($history->content)->toBe("one\nTWO\nthree");
});

it('stores a diff for a save after the history window', function () {
    $this->travel(Document::HISTORY_WINDOW_MINUTES + 1)->minutes();
    saveDocument($this->document, ['content' => "one\nTWO\nthree"]);

    $latest = $this->document->histories()->latest('id')->first();

    expect($this->document->histories()->count())->toBe(2)
        ->and($latest->isKeyframe())->toBeFalse()
        ->and($latest->diff)->toBe([[0, 1], [-1, 1], [1, ['TWO']], [0, 1]])
        ->and($latest->resolveContent())->toBe("one\nTWO\nthree");
});

it('lets the newest save win when merging into a diff entry', function () {
    $this->travel(Document::HISTORY_WINDOW_MINUTES + 1)->minutes();
    saveDocument($this->document, ['content' => "one\nTWO\nthree"]);

    $this->travel(5)->minutes();
    saveDocument($this->document, ['title' => 'Final', 'content' => "zero\none\nthree"]);

    $latest = $this->document->histories()->latest('id')->first();

    expect($this->document->histories()->count())->toBe(2)
        ->and($latest->title)->toBe('Final')
        ->and($latest->resolveContent())->toBe("zero\none\nthree")
        ->and($latest->previous()->resolveContent())->toBe("one\ntwo\nthree");
});

it('stores a keyframe every interval and can rebuild every entry', function () {
    $contents = ["one\ntwo\nthree"];

    foreach (range(1, Document::HISTORY_KEYFRAME_INTERVAL) as $version) {
        $this->travel(Document::HISTORY_WINDOW_MINUTES + 1)->minutes();
        $contents[] = $content = "one\nversion {$version}\nthree";
        saveDocument($this->document, ['content' => $content]);
    }

    $histories = $this->document->histories()->orderBy('id')->get();

    expect($histories->filter->isKeyframe()->keys()->all())->toBe([0, Document::HISTORY_KEYFRAME_INTERVAL])
        ->and($histories->map->resolveContent()->all())->toBe($contents);
});

it('does not record a save without changes', function () {
    $this->travel(Document::HISTORY_WINDOW_MINUTES + 1)->minutes();
    saveDocument($this->document, ['title' => 'Notes', 'content' => "one\ntwo\nthree"]);

    expect($this->document->histories()->count())->toBe(1);
});
