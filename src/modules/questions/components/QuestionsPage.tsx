import { useState } from 'react'
import { useQuestions } from '../hooks/useQuestions'
import { useAnswers } from '../../answers/hooks/useAnswers'
import { Question } from '../types'
import { QuestionForm } from './QuestionForm'
import { QuestionList } from './QuestionList'
import { Modal } from '@/shared/components/Modal'
import { Button } from '@/shared/components/Button'
import { Spinner } from '@/shared/components/Spinner'
import { Card } from '@/shared/components/Card'
import { QuestionFormData } from '../validators/questionSchema'

export function QuestionsPage() {
  const { questions, isLoading: questionsLoading, createQuestion, updateQuestion, deleteQuestion, isDeleting } = useQuestions()
  const { answers, isLoading: answersLoading } = useAnswers()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  const handleCreate = () => {
    setEditingQuestion(null)
    setIsModalOpen(true)
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setIsModalOpen(true)
  }

  const handleSubmit = async (data: QuestionFormData) => {
    try {
      if (editingQuestion) {
        await updateQuestion({ id: editingQuestion.id, input: data })
      } else {
        await createQuestion(data)
      }
      setIsModalOpen(false)
      setEditingQuestion(null)
    } catch (error) {
      console.error('Failed to save question:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await deleteQuestion(id)
      } catch (error) {
        console.error('Failed to delete question:', error)
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingQuestion(null)
  }

  if (questionsLoading || answersLoading) {
    return <Spinner size="large" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Questions</h1>
          <p className="text-gray-600 mt-1">Manage questions and their associated answers</p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          + New Question
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="glass" className="bg-primary-50/50">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-primary-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-700">
              Total Questions: <span className="font-bold">{questions.length}</span>
            </p>
          </div>
        </Card>

        <Card variant="glass" className="bg-accent-50/50">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-accent-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-700">
              Available Answers: <span className="font-bold">{answers.length}</span>
            </p>
          </div>
        </Card>
      </div>

      <QuestionList
        questions={questions}
        answers={answers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingQuestion ? 'Edit Question' : 'Create New Question'}
      >
        <QuestionForm
          question={editingQuestion || undefined}
          answers={answers}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  )
}
