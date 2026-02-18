import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionsPage } from './QuestionsPage'
import { useQuestions } from '../hooks/useQuestions'
import { useAnswers } from '../../answers/hooks/useAnswers'
import { Question } from '../types'
import { Answer } from '../../answers/types'
import { QuestionFormData } from '../validators/questionSchema'
import { CreateQuestionInput, UpdateQuestionInput } from '../types'
import { CreateAnswerInput, UpdateAnswerInput } from '../../answers/types'

interface QuestionFormProps {
  question?: Question
  answers: Answer[]
  onSubmit: (data: QuestionFormData) => Promise<void>
  onCancel: () => void
  existingQuestions?: Array<Pick<Question, 'id' | 'order'>>
}

interface QuestionListProps {
  questions: Question[]
  onEdit: (question: Question) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large'
}

interface UseQuestionsReturn {
  questions: Question[]
  isLoading: boolean
  error: Error | null
  createQuestion: (input: CreateQuestionInput) => Promise<Question>
  updateQuestion: (params: { id: string; input: UpdateQuestionInput }) => Promise<Question>
  deleteQuestion: (id: string) => Promise<void>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

interface UseAnswersReturn {
  answers: Answer[]
  isLoading: boolean
  error: Error | null
  createAnswer: (input: CreateAnswerInput) => Promise<Answer>
  updateAnswer: (params: { id: string; input: UpdateAnswerInput }) => Promise<Answer>
  deleteAnswer: (id: string) => Promise<void>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

vi.mock('../hooks/useQuestions')
vi.mock('../../answers/hooks/useAnswers')

vi.mock('./QuestionForm', () => ({
  QuestionForm: ({ question, onSubmit, onCancel }: QuestionFormProps) => (
    <div data-testid="question-form">
      <div data-testid="form-mode">{question ? 'edit' : 'create'}</div>
      {question && <div data-testid="form-question-id">{question.id}</div>}
      <button onClick={() => onSubmit({ description: 'Test Question', active: true, order: 1, answerIds: [] })}>
        Submit Form
      </button>
      <button onClick={onCancel}>Cancel Form</button>
    </div>
  ),
}))

vi.mock('./QuestionList', () => ({
  QuestionList: ({ questions, onEdit, onDelete, isDeleting }: QuestionListProps) => (
    <div data-testid="question-list">
      <div data-testid="questions-count">{questions.length}</div>
      <div data-testid="is-deleting">{isDeleting ? 'true' : 'false'}</div>
      {questions.map(q => (
        <div key={q.id} data-testid={`question-${q.id}`}>
          <button onClick={() => onEdit(q)}>Edit Question {q.id}</button>
          <button onClick={() => onDelete(q.id)}>Delete Question {q.id}</button>
        </div>
      ))}
    </div>
  ),
}))

vi.mock('@/shared/components/Modal', () => ({
  Modal: ({ isOpen, children, title, onClose }: ModalProps) =>
    isOpen ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose}>Close Modal</button>
        {children}
      </div>
    ) : null,
}))

vi.mock('@/shared/components/Button', () => ({
  Button: ({ children, onClick, variant }: ButtonProps) => (
    <button onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
}))

vi.mock('@/shared/components/Spinner', () => ({
  Spinner: ({ size }: SpinnerProps) => (
    <div data-testid="spinner" data-size={size}>Loading...</div>
  ),
}))

describe('QuestionsPage', () => {
  const mockAnswers: Answer[] = [
    { id: 'a1', description: 'Answer 1', active: true, order: 1 },
  ]

  const mockQuestions: Question[] = [
    { id: 'q1', description: 'Question 1', active: true, order: 1, answers: [] },
  ]

  const mockCreateQuestion = vi.fn<(input: CreateQuestionInput) => Promise<Question>>()
  const mockUpdateQuestion = vi.fn<(params: { id: string; input: UpdateQuestionInput }) => Promise<Question>>()
  const mockDeleteQuestion = vi.fn<(id: string) => Promise<void>>()

  const mockCreateAnswer = vi.fn<(input: CreateAnswerInput) => Promise<Answer>>()
  const mockUpdateAnswer = vi.fn<(params: { id: string; input: UpdateAnswerInput }) => Promise<Answer>>()
  const mockDeleteAnswer = vi.fn<(id: string) => Promise<void>>()

  const defaultUseQuestionsReturn: UseQuestionsReturn = {
    questions: mockQuestions,
    isLoading: false,
    error: null,
    createQuestion: mockCreateQuestion,
    updateQuestion: mockUpdateQuestion,
    deleteQuestion: mockDeleteQuestion,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
  }

  const defaultUseAnswersReturn: UseAnswersReturn = {
    answers: mockAnswers,
    isLoading: false,
    error: null,
    createAnswer: mockCreateAnswer,
    updateAnswer: mockUpdateAnswer,
    deleteAnswer: mockDeleteAnswer,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateQuestion.mockResolvedValue(mockQuestions[0])
    mockUpdateQuestion.mockResolvedValue(mockQuestions[0])
    mockDeleteQuestion.mockResolvedValue(undefined)

    mockCreateAnswer.mockResolvedValue(mockAnswers[0])
    mockUpdateAnswer.mockResolvedValue(mockAnswers[0])
    mockDeleteAnswer.mockResolvedValue(undefined)

    vi.mocked(useQuestions).mockReturnValue(defaultUseQuestionsReturn)
    vi.mocked(useAnswers).mockReturnValue(defaultUseAnswersReturn)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows loading when questions are loading', () => {
    vi.mocked(useQuestions).mockReturnValue({
      ...defaultUseQuestionsReturn,
      questions: [],
      isLoading: true,
    })

    render(<QuestionsPage />)

    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('shows loading when answers are loading', () => {
    vi.mocked(useAnswers).mockReturnValue({
      ...defaultUseAnswersReturn,
      answers: [],
      isLoading: true,
    })

    render(<QuestionsPage />)

    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('creates a question from the form', async () => {
    const user = userEvent.setup()
    render(<QuestionsPage />)

    await user.click(screen.getByRole('button', { name: '+ New Question' }))
    await user.click(screen.getByRole('button', { name: 'Submit Form' }))

    await waitFor(() => {
      expect(mockCreateQuestion).toHaveBeenCalledWith({
        description: 'Test Question',
        active: true,
        order: 1,
        answerIds: [],
      })
    })
  })

  it('updates a question from the form', async () => {
    const user = userEvent.setup()
    render(<QuestionsPage />)

    await user.click(screen.getByRole('button', { name: 'Edit Question q1' }))
    await user.click(screen.getByRole('button', { name: 'Submit Form' }))

    await waitFor(() => {
      expect(mockUpdateQuestion).toHaveBeenCalledWith({
        id: 'q1',
        input: {
          description: 'Test Question',
          active: true,
          order: 1,
          answerIds: [],
        },
      })
    })
  })
})
