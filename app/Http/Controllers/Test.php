<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class Test extends Controller 
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        
      $dataStore =  $request -> only('title');
        return $dataStore;
        // return response()->json([
        //     'id' => 1,
        //     'title' => 'Titletest2',
        //     'body' => 'body'
        // ])->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json([
            'message' => 'test',
            'data' => [
                'id' => 1,
                'title' => 'TItletest',
                'body' => 'body'
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}