<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class PlannerController extends Controller
{
    // Method untuk menampilkan halaman planner
    public function index()
    {
        return view('planner');
    }

    // Method untuk menyimpan jadwal baru
    public function store(Request $request)
    {
        // Validasi data input
        $validatedData = $request->validate([
            'event_name' => 'required|string|max:255',
            'event_time' => 'required|date_format:H:i',
            'schedule_type' => 'required|in:one_time,recurring',
            'event_date' => 'nullable|date|required_if:schedule_type,one_time',
            'recurring_day' => 'nullable|integer|between:0,6|required_if:schedule_type,recurring',
        ]);

        $schedule = new Schedule();
         $schedule->user_id = auth()->id();
         $schedule->user_id = Auth::id(); 
        $schedule->event_name = $validatedData['event_name'];
        $schedule->event_time = $validatedData['event_time'];
        $schedule->schedule_type = $validatedData['schedule_type'];

        // Atur event_date atau recurring_day berdasarkan tipe jadwal
        if ($validatedData['schedule_type'] === 'one_time') {
            $schedule->event_date = $validatedData['event_date'];
            $schedule->recurring_day = null; 
        } else { 
            $schedule->event_date = null; 
            $schedule->recurring_day = $validatedData['recurring_day'];
        }

        $schedule->user_id = auth()->id();

        $schedule->save();
     
        return response()->json(['success' => true, 'message' => 'Jadwal berhasil ditambahkan!']);
    }

     // Method untuk menampilkan detail jadwal untuk diedit
    public function edit(Schedule $schedule)
    {
        return response()->json(['schedule' => $schedule]);
    }

    // Method untuk memperbarui jadwal
    public function update(Request $request, Schedule $schedule)
    {
        // Validasi data input
        $validatedData = $request->validate([
            'event_name' => 'required|string|max:255',
            'event_time' => 'required|date_format:H:i',
            'schedule_type' => 'required|in:one_time,recurring',
            'event_date' => 'nullable|date|required_if:schedule_type,one_time',
            'recurring_day' => 'nullable|integer|between:0,6|required_if:schedule_type,recurring',
        ]);

        $schedule->event_name = $validatedData['event_name'];
        $schedule->event_time = $validatedData['event_time'];
        $schedule->schedule_type = $validatedData['schedule_type'];

        if ($validatedData['schedule_type'] === 'one_time') {
            $schedule->event_date = $validatedData['event_date'];
            $schedule->recurring_day = null;
        } else {
            $schedule->event_date = null;
            $schedule->recurring_day = $validatedData['recurring_day'];
        }

        $schedule->save();

        return response()->json(['success' => true, 'message' => 'Jadwal berhasil diperbarui!']);
    }

    // Method untuk menghapus jadwal
    public function destroy(Schedule $schedule)
    {
        $schedule->delete();
        return response()->json(['success' => true, 'message' => 'Jadwal berhasil dihapus!']);
    }
    
    // Method untuk mendapatkan jadwal per bulan untuk tampilan kalender
    public function schedulesForMonth(Request $request)
    {
        $year = $request->query('year');
        $month = $request->query('month');

        $schedules = Schedule::whereYear('event_date', $year)
                            ->whereMonth('event_date', $month)
                            ->get();

        return response()->json($schedules);
    }

    // Method untuk mendapatkan jadwal untuk tanggal tertentu (digunakan saat klik tanggal di kalender)
    public function getSchedulesByDate(Request $request)
    {
        $date = $request->query('date'); // Mengambil parameter 'date' dari URL (YYYY-MM-DD)

        // Validasi tanggal dasar
        if (!$date || !strtotime($date)) {
            return response()->json(['error' => 'Tanggal tidak valid.'], 400);
        }

        // Tentukan hari dalam seminggu untuk tanggal yang diminta (0=Minggu, 6=Sabtu)
        $dayOfWeek = date('w', strtotime($date));

        $schedules = Schedule::where('user_id', Auth::id())
    ->where(function ($query) use ($date, $dayOfWeek) {
        $query->where(function ($q) use ($date) {
            $q->where('schedule_type', 'one_time')
              ->where('event_date', $date);
        })
        ->orWhere(function ($q) use ($dayOfWeek) {
            $q->where('schedule_type', 'recurring')
              ->where('recurring_day', $dayOfWeek);
        });
    })
    ->get();

        return response()->json(['schedules' => $schedules]);
    }

    public function schedulesForDate(Request $request)
    {
        $year = $request->input('year');
        $month = $request->input('month');
        $day = $request->input('day');

        // Validate input
        if (!$year || !$month || !$day) {
            return response()->json(['schedules' => []], 400); 
        }

        $date = Carbon::createFromDate($year, $month, $day);
        $dayOfWeek = $date->dayOfWeek; 

        $schedules = Schedule::where('user_id', Auth::id())
            ->where(function($query) use ($date, $dayOfWeek) {
                $query->where('schedule_type', 'one_time') 
                      ->whereDate('event_date', $date);
            })
            ->orWhere(function($query) use ($dayOfWeek) {
                $query->where('schedule_type', 'recurring')
                      ->where('recurring_day', $dayOfWeek);
            })
            ->orderBy('event_time')
            ->get();

        return response()->json(['schedules' => $schedules]);
    }

    // Method untuk detail jadwal 
    public function show(Schedule $schedule)
    {
        if ($schedule->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        return response()->json($schedule);
    }

    // Method untuk menampilkan keseluruhan jadwal 
    public function getAllSchedules()
    {
        $schedules = Schedule::where('user_id', Auth::id())
                            ->orderBy('schedule_type')
                            ->orderBy('event_time')
                            ->get();

        return response()->json(['schedules' => $schedules]);
    }
}