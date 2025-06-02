<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // Menampilkan halaman Login
    public function showLoginForm()
    {
        return view('auth.login');
    }

    // Memproses permintaan Login
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        if (Auth::attempt(['name' => $credentials['username'], 'password' => $credentials['password']])) {
            $request->session()->regenerate();
            return redirect()->intended('/dashboard'); // Arahkan ke dashboard setelah login
        }

        return back()->withErrors([
            'username' => 'Nama atau Kata Sandi salah.',
        ])->onlyInput('username');
    }

    // Menampilkan halaman Register
    public function showRegistrationForm()
    {
        return view('auth.register');
    }

    // Memproses permintaan Register
    public function register(Request $request)
    {
        $request->validate([
            'username' => 'required|unique:users,name|max:255', 
            'password' => 'required|min:6|confirmed',
        ]);

        User::create([
            'name' => $request->username, 
            'email' => $request->username . '@example.com', 
            'password' => Hash::make($request->password),
            'profile_picture' => 'images/profile-icon.png',
        ]);

        return redirect()->route('login')->with('success', 'Pendaftaran berhasil! Silakan login.');
    }

    // Logout pengguna
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/')->with('success', 'Anda telah keluar.');
    }
}