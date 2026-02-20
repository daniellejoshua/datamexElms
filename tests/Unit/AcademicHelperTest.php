<?php

use App\Helpers\AcademicHelper;

it('converts numeric grades to new gpa scale using dataset', function (float $numeric, ?string $expectedGpa) {
    expect(AcademicHelper::convertToGPA($numeric))->toBe($expectedGpa);
})->with([
    'excellent1' => [100.0, '1.00'],
    'boundary96' => [96.0, '1.00'],
    'just95' => [95.0, '1.25'],
    'boundary94' => [94.0, '1.25'],
    'just92' => [92.0, '1.50'],
    'boundary91' => [91.0, '1.50'],
    'just89' => [89.0, '1.75'],
    'boundary88' => [88.0, '1.75'],
    'mid85' => [85.0, '2.00'],
    'boundary83' => [83.0, '2.25'],
    'boundary80' => [80.0, '2.50'],
    'boundary78' => [78.0, '2.75'],
    'boundary75' => [75.0, '3.00'],
    'fail74' => [74.0, '5.00'],
    'fail0' => [0.0, '5.00'],
    'null' => [null, null],
]);

it('converts gpa back to percentage using dataset', function (float $gpa, ?float $expectedPct) {
    expect(AcademicHelper::convertGpaToPercentage($gpa))->toBe($expectedPct);
})->with([
    'min1_00' => [1.00, 96.0],
    'mid1_00' => [1.10, 96.0],
    'boundary1_25' => [1.25, 94.0],
    'boundary1_50' => [1.50, 91.0],
    'boundary1_75' => [1.75, 88.0],
    'boundary2_00' => [2.00, 85.0],
    'boundary2_25' => [2.25, 83.0],
    'boundary2_50' => [2.50, 80.0],
    'boundary2_75' => [2.75, 78.0],
    'boundary3_00' => [3.00, 75.0],
    'fail3_01' => [3.01, 0.0],
    'null' => [null, null],
]);
