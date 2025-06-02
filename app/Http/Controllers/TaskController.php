<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon; // Import Carbon untuk manipulasi tanggal

class TaskController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Ambil tugas yang belum selesai, urutkan berdasarkan deadline dan priority
        $incompleteTasks = $user->tasks()
                                ->where('completed', false)
                                ->orderByRaw("CASE
                                    WHEN priority = '" . Task::PRIORITY_NOW . "' THEN 1
                                    WHEN priority = '" . Task::PRIORITY_RUSH . "' THEN 2
                                    WHEN priority = '" . Task::PRIORITY_PLAN . "' THEN 3
                                    ELSE 4
                                END") // Urutkan priority: Now > Rush > Plan
                                ->orderBy('deadline', 'asc') // Urutkan deadline menaik (terdekat duluan)
                                ->get();

        // Ambil tugas yang sudah selesai (akan diletakkan di paling bawah)
        $completedTasks = $user->tasks()
                               ->where('completed', true)
                               ->orderBy('updated_at', 'desc') // Bisa diurutkan berdasarkan waktu selesai
                               ->get();

        // Gabungkan tugas yang belum selesai di atas, dan yang selesai di bawah
        $tasks = $incompleteTasks->concat($completedTasks);

        return view('tasks', compact('tasks'));
    }

    // Perbarui Metode `store()` untuk menerima deadline dan priority
    public function store(Request $request)
    {
        $request->validate([
            'description' => 'required|string|max:255',
            'deadline' => 'nullable|date', // Validasi tanggal, boleh kosong
            'priority' => 'required|in:now,rush,plan', // Validasi prioritas
        ]);

        Auth::user()->tasks()->create([
            'description' => $request->description,
            'deadline' => $request->deadline,
            'priority' => $request->priority,
            'completed' => false,
        ]);

        // Update total tasks count (ini sudah ada dari sebelumnya)
        $user = Auth::user();
        $user->total_tasks_count = $user->tasks()->count();
        $user->save();

        return redirect()->route('tasks.index')->with('success', 'Tugas Berhasil Ditambahkan!');
    }

    // Metode toggleComplete() (yang sudah ada)
    public function toggleComplete(Task $task)
    {
        if ($task->user_id !== Auth::id()) {
            abort(403);
        }

        $task->completed = !$task->completed; 
        $task->save();

        // Update completed tasks count
        $user = Auth::user();
        $user->completed_tasks_count = $user->tasks()->where('completed', true)->count();
        $user->save();

        return redirect()->route('tasks.index')->with('success', 'Tugas Selesai!');
    }

    // Metode destroy() 
    public function destroy(Task $task)
    {
        if ($task->user_id !== Auth::id()) {
            abort(403);
        }

        $task->delete();

        $user = Auth::user();
        $user->total_tasks_count = $user->tasks()->count();
        if ($task->completed) {
            $user->completed_tasks_count = $user->tasks()->where('completed', true)->count();
        }
        $user->save();

        return redirect()->route('tasks.index')->with('success', 'Tugas Berhasil Dihapus!');
    }

    public function update(Request $request, Task $task)
    {
        if ($task->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $validatedData = $request->validate([
            'description' => 'required|string|max:255',
            'deadline' => 'nullable|date',
            'priority' => 'required|in:now,rush,plan',
        ]);

        $task->update($validatedData);

        return redirect()->route('tasks.index')->with('success', 'Tugas Berhasil Diubah!');
    }
}