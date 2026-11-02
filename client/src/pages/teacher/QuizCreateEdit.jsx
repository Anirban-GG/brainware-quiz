import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import { ArrowLeft, Save, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

export default function QuizCreateEdit() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Computer Applications',
    difficulty: 'medium',
    duration: 15,
    passingMarks: 5,
    randomizeQuestions: true,
    randomizeAnswers: true,
    negativeMarking: false,
    negativeMarksPerQuestion: 0.25,
    antiCheatSettings: {
      enabled: true,
      blockTabSwitch: true,
      blockClipboard: true,
      requireFullscreen: true,
      maxWarnings: 3
    },
    published: 'draft'
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEdit) {
      const fetchQuiz = async () => {
        try {
          const res = await teacherService.getQuizById(id);
          if (res.success && res.quiz) {
            setFormData({
              title: res.quiz.title || '',
              description: res.quiz.description || '',
              category: res.quiz.category || 'Computer Applications',
              difficulty: res.quiz.difficulty || 'medium',
              duration: res.quiz.duration || 15,
              passingMarks: res.quiz.passingMarks || 5,
              randomizeQuestions: res.quiz.randomizeQuestions !== false,
              randomizeAnswers: res.quiz.randomizeAnswers !== false,
              negativeMarking: !!res.quiz.negativeMarking,
              negativeMarksPerQuestion: res.quiz.negativeMarksPerQuestion || 0.25,
              antiCheatSettings: {
                enabled: res.quiz.antiCheatSettings?.enabled !== false,
                blockTabSwitch: res.quiz.antiCheatSettings?.blockTabSwitch !== false,
                blockClipboard: res.quiz.antiCheatSettings?.blockClipboard !== false,
                requireFullscreen: res.quiz.antiCheatSettings?.requireFullscreen !== false,
                maxWarnings: res.quiz.antiCheatSettings?.maxWarnings || 3
              },
              published: res.quiz.published || 'draft'
            });
          }
        } catch (err) {
          setError('Failed to load quiz details.');
        } finally {
          setLoading(false);
        }
      };
      fetchQuiz();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('antiCheat.')) {
      const key = name.replace('antiCheat.', '');
      setFormData(prev => ({
        ...prev,
        antiCheatSettings: {
          ...prev.antiCheatSettings,
          [key]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('Quiz title is required.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await teacherService.updateQuiz(id, formData);
        setSuccess('Quiz updated successfully.');
        setTimeout(() => navigate('/teacher/quizzes'), 1000);
      } else {
        const res = await teacherService.createQuiz(formData);
        if (res.success && res.quiz) {
          setSuccess('Quiz created successfully! Now add questions to the quiz.');
          setTimeout(() => navigate(`/teacher/quizzes/${res.quiz._id}/questions`), 1200);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save examination.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading quiz parameters...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/teacher/quizzes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-bwu-700 dark:hover:text-red-400"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Examinations</span>
        </Link>
        <span className="text-xs text-slate-400 uppercase font-semibold">
          {isEdit ? 'Editing Mode' : 'New Assessment'}
        </span>
      </div>

      <div className="bg-white dark:bg-darkSurface-card p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {isEdit ? 'Update Examination Settings' : 'Create New Examination'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure examination timing, randomization options, and anti-cheating protocols.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Basic Examination Details
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Quiz Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. End Semester Continuous Assessment - JavaScript"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Description / Academic Guidelines
              </label>
              <textarea
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleChange}
                placeholder="Assessment instructions visible to students prior to start..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Subject / Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g. Computer Applications"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Difficulty Level
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-sm"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timing & Scoring Configuration */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-darkSurface-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Timing & Evaluation Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  min="1"
                  max="180"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Passing Marks
                </label>
                <input
                  type="number"
                  name="passingMarks"
                  min="0"
                  value={formData.passingMarks}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Publish State
                </label>
                <select
                  name="published"
                  value={formData.published}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-sm"
                >
                  <option value="draft">Draft (Hidden from students)</option>
                  <option value="published">Published (Available for exam)</option>
                  <option value="unpublished">Unpublished (Archived)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Randomization & Negative Marking Switches */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-darkSurface-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Exam Randomization & Scoring Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Randomize Question Order
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Each student receives questions in randomized sequence
                  </span>
                </div>
                <input
                  type="checkbox"
                  name="randomizeQuestions"
                  checked={formData.randomizeQuestions}
                  onChange={handleChange}
                  className="w-4 h-4 text-bwu-700 rounded focus:ring-bwu-700"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Randomize Answer Options
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Shuffles options A, B, C, D (overridable per question)
                  </span>
                </div>
                <input
                  type="checkbox"
                  name="randomizeAnswers"
                  checked={formData.randomizeAnswers}
                  onChange={handleChange}
                  className="w-4 h-4 text-bwu-700 rounded focus:ring-bwu-700"
                />
              </label>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Negative Marking
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Deduct marks for incorrect answers
                  </span>
                </div>
                <input
                  type="checkbox"
                  name="negativeMarking"
                  checked={formData.negativeMarking}
                  onChange={handleChange}
                  className="w-4 h-4 text-bwu-700 rounded focus:ring-bwu-700"
                />
              </label>

              {formData.negativeMarking && (
                <div className="pt-3 border-t border-slate-200 dark:border-darkSurface-border max-w-xs">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Deduction per incorrect answer
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    name="negativeMarksPerQuestion"
                    value={formData.negativeMarksPerQuestion}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-xs text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Anti-Cheating Settings */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-darkSurface-border">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-bwu-700 dark:text-red-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Browser Anti-Cheating Parameters
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border cursor-pointer">
                <input
                  type="checkbox"
                  name="antiCheat.blockTabSwitch"
                  checked={formData.antiCheatSettings.blockTabSwitch}
                  onChange={handleChange}
                  className="w-4 h-4 text-bwu-700 rounded"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Detect and log tab switching & window blur
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border cursor-pointer">
                <input
                  type="checkbox"
                  name="antiCheat.blockClipboard"
                  checked={formData.antiCheatSettings.blockClipboard}
                  onChange={handleChange}
                  className="w-4 h-4 text-bwu-700 rounded"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Block clipboard (Copy, Paste, Cut) & Right-click
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border cursor-pointer">
                <input
                  type="checkbox"
                  name="antiCheat.requireFullscreen"
                  checked={formData.antiCheatSettings.requireFullscreen}
                  onChange={handleChange}
                  className="w-4 h-4 text-bwu-700 rounded"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Log fullscreen exits during examination
                </span>
              </label>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-darkSurface-subtle border border-slate-200 dark:border-darkSurface-border flex items-center justify-between">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Max warning threshold
                </span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  name="antiCheat.maxWarnings"
                  value={formData.antiCheatSettings.maxWarnings}
                  onChange={handleChange}
                  className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-card text-xs text-center"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-darkSurface-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/teacher/quizzes')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkSurface-subtle"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 shadow-md shadow-red-700/20 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create & Proceed to Questions'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
