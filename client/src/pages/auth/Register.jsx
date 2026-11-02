import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { parseLiveStudentCode } from '../../utils/studentCodeParser';
import ThemeToggle from '../../components/ThemeToggle';
import { GraduationCap, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Live parse student code
  const codeAnalysis = useMemo(() => {
    return parseLiveStudentCode(studentCode);
  }, [studentCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !studentCode.trim()) {
      setError('First name, last name, and student code are all required.');
      return;
    }

    if (!codeAnalysis.isValid) {
      setError(codeAnalysis.message || 'Please provide a valid Brainware student code format.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(firstName.trim(), lastName.trim(), codeAnalysis.normalizedCode);
      if (res.success) {
        // Newly registered student has mustChangePassword = true, redirect to change password
        navigate('/change-password', {
          state: {
            isNewRegistration: true,
            studentCode: codeAnalysis.normalizedCode
          }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-darkSurface-bg transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-bwu-800 to-bwu-600 flex items-center justify-center text-white shadow-xl shadow-red-600/25">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Create Student Account
        </h2>
        <p className="mt-1 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
          Brainware University Examination & Assessment System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-darkSurface-card py-8 px-6 sm:px-10 rounded-2xl border border-slate-200/80 dark:border-darkSurface-border shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Anirban"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bwu-700 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Shee"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bwu-700 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Student Code
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  BWU/COURSE/YY/ROLL
                </span>
              </div>
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                placeholder="e.g. BWU/BCA/24/001"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bwu-700 text-sm font-mono uppercase"
                required
              />
            </div>

            {/* Live Student Code Parsing Card */}
            {studentCode.trim().length > 0 && (
              <div
                className={`p-4 rounded-xl border text-xs transition-all ${
                  codeAnalysis.isValid
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-darkSurface-subtle border-slate-200 dark:border-darkSurface-border'
                }`}
              >
                {codeAnalysis.isValid ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valid Brainware University Student Code</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">
                          University
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {codeAnalysis.university}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">
                          Course
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {codeAnalysis.courseName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">
                          Admission Year
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {codeAnalysis.admissionYear}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">
                          Roll Number
                        </span>
                        <span className="font-medium font-mono text-slate-900 dark:text-white">
                          {codeAnalysis.rollNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                    <span>
                      {codeAnalysis.message || 'Please enter code in format BWU/COURSE/YY/ROLL'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Security Notice */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-200/80 dark:border-darkSurface-border text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-bwu-700 dark:text-red-400 mt-0.5" />
              <span>
                Initial password is your Student Code. You will be prompted to set a secure personal password immediately upon registration.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !codeAnalysis.isValid}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-bwu-700 hover:bg-bwu-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bwu-700 shadow-md shadow-red-700/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Registering student account...</span>
              ) : (
                <>
                  <span>Create Account & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-600 dark:text-slate-400">
            <span>Already registered? </span>
            <Link to="/login" className="font-semibold text-bwu-700 dark:text-red-400 hover:underline">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
