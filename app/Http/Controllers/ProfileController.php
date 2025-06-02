<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Models\Schedule; 
use App\Models\Task;     

class ProfileController extends Controller
{
     public function index()
    {
        return view('profile');
    }

    public function showChangePasswordForm()
    {
        return view('change-password');
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6|confirmed',
        ]);

        $user = Auth::user();

        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Password lama tidak cocok.']);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return redirect()->route('profile.index')->with('success', 'Password berhasil diubah!');
    }

    // Method baru untuk verifikasi password 
    public function verifyPassword(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        if (Hash::check($request->password, Auth::user()->password)) {
            return response()->json(['verified' => true]);
        }

        return response()->json(['verified' => false], 401);
    }

    public function deleteAccount(Request $request)
    {
        $user = Auth::user();

        // Hapus juga foto profil dari storage jika ada
        if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
            Storage::disk('public')->delete($user->profile_picture);
        }
        
        // Hapus semua jadwal terkait pengguna
        Schedule::where('user_id', $user->id)->delete();
        // Hapus semua tugas terkait pengguna
        Task::where('user_id', $user->id)->delete();

        Auth::logout(); // Logout sebelum menghapus
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $user->delete();

        return response()->json(['success' => true, 'message' => 'Akun Anda telah berhasil dihapus.']);
    }

    // Method untuk mengupload foto profil
    public function uploadPicture(Request $request)
    {
        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048', // Validasi gambar
        ]);

        $user = Auth::user();

        // Hapus gambar lama jika ada
        if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
            Storage::disk('public')->delete($user->profile_picture);
        }

        // Simpan gambar baru
        $path = $request->file('profile_picture')->store('profile_pictures', 'public');

        // Update path di database
        $user->profile_picture = $path;
        $user->save();

        return redirect()->route('profile.index')->with('success', 'Foto profil berhasil diunggah!');
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name' => 'required|string|max:255',
            'profile_picture' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $user->name = $request->name;

        if ($request->hasFile('profile_picture')) {
            $file = $request->file('profile_picture');
            $filename = time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('profile_pictures', $filename, 'public');

            $user->profile_picture = 'storage/' . $path;
        }

        $user->save();

        return redirect()->back()->with('success', 'Profil berhasil diperbarui.');
    }

}