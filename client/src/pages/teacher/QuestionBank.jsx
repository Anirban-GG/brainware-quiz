import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import Badge from '../../components/Badge';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Modal from '../../components/Modal';
import {
  FileQuestion,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info
} from 'lucide-react';

export default function QuestionBank() {
  const { id } = useParams(); // quizId
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Question Modal (Add or Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionFormData, setQuestionFormData] = useState({
    questionText: '',
    options: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' }
    ],
    correctAnswer: 'A',
    marks: 1,
    negativeMarks: 0,
    explanation: '',
    randomizeOptions: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Delete modal
  const [deleteQId, setDeleteQId] = useState(null);

  useEffect(() => {
    fetchQuizAndQuestions();
  }, [id]);

  const fetchQuizAndQuestions = async () => {
    try {
      const res = await teacherService.getQuizById(id);
      if (res.success) {
        setQuiz(res.quiz);
        setQuestions(res.questions || []);
      }
    } catch (err) {
      console.error('Failed to load quiz questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setQuestionFormData({
      questionText: '',
      options: [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' }
      ],
      correctAnswer: 'A',
      marks: 1,
      negativeMarks: quiz?.negativeMarking ? (quiz.negativeMarksPerQuestion || 0.25) : 0,
      explanation: '',
      randomizeOptions: true
    });
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    setQuestionFormData({
      questionText: q.questionText,
      options: q.options && q.options.length ? q.options : [
        { id: 'A', text: '' },
        { id: 'B', text: '' }
      ],
      correctAnswer: q.correctAnswer,
      marks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0,
      explanation: q.explanation || '',
      randomizeOptions: q.randomizeOptions !== false
    });
    setError('');
    setModalOpen(true);
  };

  const handleOptionChange = (idx, text) => {
    const nextOptions = [...questionFormData.options];
    nextOptions[idx].text = text;
    setQuestionFormData(prev => ({ ...prev, options: nextOptions }));
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setError('');

    if (!questionFormData.questionText.trim()) {
      setError('Question text is required.');
      return;
    }

    const emptyOpts = questionFormData.options.some(o => !o.text.trim());
    if (emptyOpts) {
      setError('Please fill in text for all options.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingQuestion) {
        const res = await teacherService.updateQuestion(editingQuestion._id, questionFormData);
        if (res.success) {
          setQuestions(prev => prev.map(q => q._id === editingQuestion._id ? res.question : q));
          setModalOpen(false);
        }
      } else {
        const res = await teacherService.addQuestion(id, questionFormData);
        if (res.success) {
          setQuestions(prev => [...prev, res.question]);
          if (res.totalMarks !== undefined && quiz) {
            setQuiz(prev => ({ ...prev, totalMarks: res.totalMarks }));
          }
          setModalOpen(false);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save question.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteQId) return;
    try {
      const res = await teacherService.deleteQuestion(deleteQId);
      if (res.success) {
        setQuestions(prev => prev.filter(q => q._id !== deleteQId));
        if (res.totalMarks !== undefined && quiz) {
          setQuiz(prev => ({ ...prev, totalMarks: res.totalMarks }));
        }
        setDeleteQId(null);
      }
    } catch (err) {
      alert('Failed to delete question');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/teacher/quizzes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-bwu-700 dark:hover:text-red-400 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Examinations</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {quiz?.title || 'Question Repository'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Total Questions: {questions.length} • Total Marks: {quiz?.totalMarks || 0}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 shadow-md shadow-red-700/20 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Questions List */}
      {loading ? (
        <LoadingSkeleton count={3} height="h-28" />
      ) : questions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-darkSurface-card rounded-2xl border border-slate-200 dark:border-darkSurface-border space-y-3">
          <FileQuestion className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No Questions Added Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            This examination is empty. Add multiple choice questions, define correct answers, and configure randomization overrides.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-bwu-700 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Question</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q._id}
              className="bg-white dark:bg-darkSurface-card p-5 rounded-2xl border border-slate-200/90 dark:border-darkSurface-border shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-darkSurface-subtle font-bold text-xs flex items-center justify-center text-slate-800 dark:text-slate-200 font-mono">
                    {idx + 1}
                  </span>
                  <Badge variant="primary" size="xs">
                    +{q.marks} Mark{q.marks > 1 ? 's' : ''}
                  </Badge>
                  {q.negativeMarks > 0 && (
                    <span className="text-[10px] text-amber-600 font-medium">
                      -{q.negativeMarks} Neg
                    </span>
                  )}
                  {!q.randomizeOptions && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold" title="Option order is strictly preserved">
                      Fixed Option Order
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkSurface-subtle"
                    title="Edit question"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteQId(q._id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm font-semibold text-slate-900 dark:text-white whitespace-pre-wrap">
                {q.questionText}
              </p>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                {q.options?.map((opt) => {
                  const isCorrect = q.correctAnswer === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-medium'
                          : 'bg-slate-50/50 dark:bg-darkSurface-subtle/50 border-slate-200 dark:border-darkSurface-border text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-white/70 dark:bg-black/30 border border-slate-300 dark:border-darkSurface-border">
                        {opt.id}
                      </span>
                      <span className="flex-1 truncate">{opt.text}</span>
                      {isCorrect && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-darkSurface-border">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Explanation: </span>
                  <span>{q.explanation}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => !submitting && setModalOpen(false)}
          title={editingQuestion ? 'Edit Question' : 'Add Question to Quiz'}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                Question Text
              </label>
              <textarea
                rows={3}
                value={questionFormData.questionText}
                onChange={(e) => setQuestionFormData({ ...questionFormData, questionText: e.target.value })}
                placeholder="Enter complete question statement..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-xs"
                required
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Answer Options & Correct Answer Selection
              </label>
              {questionFormData.options.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="correctAnswer"
                      value={opt.id}
                      checked={questionFormData.correctAnswer === opt.id}
                      onChange={() => setQuestionFormData({ ...questionFormData, correctAnswer: opt.id })}
                      className="w-4 h-4 text-bwu-700"
                    />
                    <span className="w-6 h-6 rounded bg-slate-100 dark:bg-darkSurface-subtle font-bold text-center leading-6 shrink-0 font-mono">
                      {opt.id}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${opt.id} text...`}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-xs"
                    required
                  />
                </div>
              ))}
            </div>

            {/* Individual Question Randomization Override */}
            <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!questionFormData.randomizeOptions}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, randomizeOptions: !e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Do not randomize options for this question
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Enable this when options depend on fixed position (e.g. "Both A and B" or "All of the above").
                  </span>
                </div>
              </label>
            </div>

            {/* Marks & Negative Marks */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Marks
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={questionFormData.marks}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, marks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Negative Deduction
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={questionFormData.negativeMarks}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, negativeMarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                Solution Explanation (Displayed post-exam)
              </label>
              <textarea
                rows={2}
                value={questionFormData.explanation}
                onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
                placeholder="Educational rationale for the correct answer..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-darkSurface-border bg-white dark:bg-darkSurface-subtle text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-bwu-700 hover:bg-bwu-800 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Question Confirmation */}
      {deleteQId && (
        <Modal
          isOpen={!!deleteQId}
          onClose={() => setDeleteQId(null)}
          title="Delete Question"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Are you sure you want to delete this question?
            </p>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteQId(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteQuestion}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
