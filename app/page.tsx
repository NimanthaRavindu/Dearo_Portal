'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, UserCircle, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [nic, setNic] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [isAdmin, setIsAdmin] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!nic || nic.length < 10) {
            setError('කරුණාකර නිවැරදි NIC අංකයක් ඇතුළත් කරන්න.');
            setLoading(false);
            return;
        }

        if (!password || password.length < 4) {
            setError('මුරපදය අවම වශයෙන් අකුරු 4ක් විය යුතුය.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/auth/login", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nic, password }),
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem("user", JSON.stringify({
                    name: data.user.name,
                    role: data.user.role,
                    nic: data.user.nic,
                    email: data.user.email,
                    createdAt: data.user.createdAt,
                }));
                router.push('/dashboard');
            } else {
                setError(data.message || 'පද්ධතියට ඇතුළු වීමට නොහැක.');
            }
        } catch (err) {
            setError('Server එක සමඟ සම්බන්ධ විය නොහැක. කරුණාකර නැවත උත්සාහ කරන්න.');
        } finally {
            setLoading(false);
        }
    };

    const onNicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNic(val);

        if (val === "200207401029") {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    };

    return (
        <div className="relative w-full h-screen flex items-center justify-center p-6 overflow-hidden antialiased">
            {/* Background Layer - FIXED */}
            <div className="absolute inset-0 w-full h-full -z-10">
                <Image
                    src="/back.gif"
                    alt="Animated Background"
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" />
            </div>

            {/* Login Card */}
            <div className="relative z-20 bg-white/85 backdrop-blur-2xl p-10 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200 ring-4 ring-white">
                        <Image src="/dearo2.png" alt="Dearo Logo" width={50} height={50} className="object-contain" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">DEARO PORTAL</h1>
                    <p className="text-slate-500 text-sm font-bold mt-1">Internal Document System</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-500 text-red-700 rounded-xl flex items-center gap-3">
                        <AlertCircle size={20} className="shrink-0" />
                        <span className="text-xs font-bold leading-tight">{error}</span>
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity (NIC)</label>
                        <div className="relative mt-1.5">
                            <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Enter NIC"
                                className="w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 ring-blue-100"
                                value={nic}
                                onChange={onNicChange}
                                autoComplete="one-time-code"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
                        <div className="relative mt-1.5">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="w-full pl-12 pr-12 py-4 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 ring-blue-100"
                                value={password}
                                autoComplete="new-password"
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-blue-100 transition disabled:opacity-50"
                    >
                        {loading ? "CONNECTING..." : "SIGN IN TO SYSTEM"}
                    </button>
                </form>

                {isAdmin && (
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500">Don't have an account?</p>
                        <Link href="/signup" className="text-sm font-bold text-blue-600 hover:text-blue-700">
                            Create New Account for User...
                        </Link>
                    </div>
                )}
            </div>

            <footer className="absolute bottom-6 text-center z-20">
                <p className="text-[10px] font-bold text-white/70 flex items-center justify-center gap-1">
                    <CheckCircle2 size={12} className="text-blue-400" /> Authorized Access Only
                </p>
            </footer>
        </div>
    );
}