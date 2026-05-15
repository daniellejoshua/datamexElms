<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class CloudSyncController extends Controller
{
    public function handle(Request $request)
    {
        $data = $request->validate([
            'model' => ['required', 'string'],
            'data' => ['required', 'array'],
            'deleted' => ['boolean'],
        ]);

        $modelClass = $data['model'];
        if (! class_exists($modelClass)) {
            abort(400, 'Unknown model');
        }

        $attributes = $data['data'];
        $deleted = $data['deleted'] ?? false;

        // first try to locate the record by its primary key (which will
        // match when the same database has been used), but fall back to a
        // `uuid` attribute if provided.  this prevents duplicates when the
        // LAN instance and the cloud instance generated different auto‑increment
        // ids for the same logical entity.
        $record = null;
        if (isset($attributes['id'])) {
            $record = $modelClass::withTrashed()->find($attributes['id']);
        }

        if (! $record && isset($attributes['uuid'])) {
            $record = $modelClass::withTrashed()
                ->where('uuid', $attributes['uuid'])
                ->first();
        }

        if ($deleted) {
            $record?->delete();
        } elseif ($record) {
            $record->update($attributes);
        } else {
            $modelClass::create($attributes);
        }

        return response()->noContent();
    }
}
