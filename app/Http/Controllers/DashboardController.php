<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Task;
use App\Models\Schedule; 
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $today = Carbon::today();
        $dayOfWeek = $today->dayOfWeek;

        $days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

        // 1. Jadwal Hari Ini
        $todaySchedules = Schedule::where('user_id', auth()->id())
    ->where(function ($query) use ($today, $dayOfWeek) {
        $query->where(function ($q) use ($today) {
            $q->where('schedule_type', 'one_time')
              ->whereDate('event_date', $today);
        })
        ->orWhere(function ($q) use ($dayOfWeek) {
            $q->where('schedule_type', 'recurring')
              ->where('recurring_day', $dayOfWeek);
        });
    })
    ->orderBy('event_time')
    ->get();


        // 2. Tugas Hari Ini yang Belum Selesai
        $todayIncompleteTasks = $user->tasks()
                                    ->where('completed', false)
                                    ->whereDate('deadline', $today)
                                    ->orderBy('priority', 'asc') // Urutkan sesuai prioritas 
                                    ->get();

        // 3. Jumlah Tugas Mendatang (di hari lain yang belum selesai)
        $upcomingTasksCount = $user->tasks()
                                    ->where('completed', false)
                                    ->whereDate('deadline', '>', $today) // Deadline setelah hari ini
                                    ->count();

        // 4. Persentase Progres Tugas
        $totalTasks = $user->tasks()->count();
        $completedTasks = $user->tasks()->where('completed', true)->count();
        $progressPercentage = ($totalTasks > 0) ? round(($completedTasks / $totalTasks) * 100) : 0;

        return view('dashboard', compact(
            'todaySchedules',
            'todayIncompleteTasks',
            'upcomingTasksCount',
            'progressPercentage',
            'days'
        ));
    }
}