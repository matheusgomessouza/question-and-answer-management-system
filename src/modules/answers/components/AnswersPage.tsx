import { useState } from 'react'
import { useAnswers } from '../hooks/useAnswers'
import { Answer } from '../types'
import { AnswerForm } from './AnswerForm'
import { AnswerList } from './AnswerList'
import { Modal } from '@/shared/components/Modal'
import { Button } from '@/shared/components/Button'
import { Spinner } from '@/shared/components/Spinner'
import { Card } from '@/shared/components/Card'
import { AnswerFormData } from '../validators/answerSchema'

export function AnswersPage() {
  const { answers, isLoading, createAnswer, updateAnswer, deleteAnswer, isDeleting } = useAnswers()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAnswer, setEditingAnswer] = useState<Answer | null>(null)

  const handleCreate = () => {
    setEditingAnswer(null)
    setIsModalOpen(true)
  }

  const handleEdit = (answer: Answer) => {
    setEditingAnswer(answer)
    setIsModalOpen(true)
  }

  const handleSubmit = async (data: AnswerFormData) => {
    try {
      if (editingAnswer) {
        await updateAnswer({ id: editingAnswer.id, input: data })
      } else {
        await createAnswer(data)
      }
      setIsModalOpen(false)
      setEditingAnswer(null)
    } catch (error) {
      console.error('Failed to save answer:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this answer? It will be removed from all associated questions.')) {
      try {
        await deleteAnswer(id)
      } catch (error) {
        console.error('Failed to delete answer:', error)
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAnswer(null)
  }

  if (isLoading) {
    return <Spinner size="large" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Answers</h1>
          <p className="text-gray-600 mt-1">Manage answer options for questions</p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          + New Answer
        </Button>
      </div>

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
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-700">
            Total Answers: <span className="font-bold">{answers.length}</span>
          </p>
        </div>
      </Card>

      <AnswerList
        answers={answers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingAnswer ? 'Edit Answer' : 'Create New Answer'}
      >
        <AnswerForm answer={editingAnswer || undefined} onSubmit={handleSubmit} onCancel={handleCloseModal} />
      </Modal>
    </div>
  )
}
