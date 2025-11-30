<?php

use App\Models\User;
use App\Models\AuditLog;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// Create a test model with auditing
class TestAuditableModel extends Model
{
    use Auditable;
    
    protected $table = 'users'; // Use existing table for testing
    protected $fillable = ['name', 'email', 'password', 'role'];
}

it('creates audit log when model is created', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    
    $model = new TestAuditableModel();
    $model->fill([
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => bcrypt('password'),
        'role' => 'student'
    ]);
    $model->save();
    
    expect(AuditLog::count())->toBe(1);
    
    $auditLog = AuditLog::first();
    expect($auditLog->event)->toBe('created');
    expect($auditLog->user_id)->toBe($user->id);
    expect($auditLog->auditable_type)->toBe(TestAuditableModel::class);
    expect($auditLog->new_values)->toHaveKey('name', 'John Doe');
});

it('creates audit log when model is updated', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    
    $model = new TestAuditableModel();
    $model->fill([
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => bcrypt('password'),
        'role' => 'student'
    ]);
    $model->save();
    
    // Clear the creation audit log
    AuditLog::truncate();
    
    $model->update(['name' => 'Jane Doe']);
    
    expect(AuditLog::count())->toBe(1);
    
    $auditLog = AuditLog::first();
    expect($auditLog->event)->toBe('updated');
    expect($auditLog->old_values)->toHaveKey('name', 'John Doe');
    expect($auditLog->new_values)->toHaveKey('name', 'Jane Doe');
});

it('does not create audit log when no actual changes occur', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    
    $model = new TestAuditableModel();
    $model->fill([
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => bcrypt('password'),
        'role' => 'student'
    ]);
    $model->save();
    
    // Clear the creation audit log
    AuditLog::truncate();
    
    // Update with same values
    $model->update(['name' => 'John Doe']);
    
    expect(AuditLog::count())->toBe(0);
});

it('creates audit log when model is deleted', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    
    $model = new TestAuditableModel();
    $model->fill([
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => bcrypt('password'),
        'role' => 'student'
    ]);
    $model->save();
    
    // Clear the creation audit log
    AuditLog::truncate();
    
    $model->delete();
    
    expect(AuditLog::count())->toBe(1);
    
    $auditLog = AuditLog::first();
    expect($auditLog->event)->toBe('deleted');
    expect($auditLog->old_values)->toHaveKey('name', 'John Doe');
});

it('records request context in audit logs', function () {
    $user = User::factory()->create();
    
    $auditLog = AuditLog::create([
        'user_id' => $user->id,
        'event' => 'test',
        'auditable_type' => 'TestModel',
        'auditable_id' => 1,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'TestAgent',
        'url' => '/test',
        'method' => 'POST'
    ]);
    
    expect($auditLog->ip_address)->toBe('127.0.0.1');
    expect($auditLog->user_agent)->toBe('TestAgent');
    expect($auditLog->url)->toBe('/test');
    expect($auditLog->method)->toBe('POST');
});

it('can filter audit logs by event type', function () {
    $user = User::factory()->create();
    
    AuditLog::create([
        'user_id' => $user->id,
        'event' => 'created',
        'auditable_type' => 'TestModel',
        'auditable_id' => 1,
    ]);
    
    AuditLog::create([
        'user_id' => $user->id,
        'event' => 'updated',
        'auditable_type' => 'TestModel',
        'auditable_id' => 1,
    ]);
    
    expect(AuditLog::event('created')->count())->toBe(1);
    expect(AuditLog::event('updated')->count())->toBe(1);
});

it('can filter audit logs by age', function () {
    $user = User::factory()->create();
    
    // Create an old audit log
    $oldLog = AuditLog::create([
        'user_id' => $user->id,
        'event' => 'created',
        'auditable_type' => 'TestModel',
        'auditable_id' => 1,
    ]);
    $oldLog->created_at = now()->subDays(400);
    $oldLog->save();
    
    // Create a recent audit log  
    AuditLog::create([
        'user_id' => $user->id,
        'event' => 'updated',
        'auditable_type' => 'TestModel',
        'auditable_id' => 1,
    ]);
    
    expect(AuditLog::olderThan(365)->count())->toBe(1);
    expect(AuditLog::olderThan(30)->count())->toBe(1);
});
