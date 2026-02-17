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

// Type definitions for mock components and hooks
interface QuestionFormProps {
  question?: Question
  answers: Answer[]
  onSubmit: (data: QuestionFormData) => Promise<void>
  onCancel: () => void
}

interface QuestionListProps {
  questions: Question[]
  answers: Answer[]
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

interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'glass'
  className?: string
}

interface UseQuestionsReturn {
  questions: Question[]
  isLoading: boolean
  error: Error | null
  createQuestion: (input: CreateQuestionInput) => Promise<Question>
  updateQuestion: (params: { id: string; input: UpdateQuestionInput }) => Promise<Question>
  deleteQuestion: (id: string) => Promise<void>
  associateAnswers: (params: { id: string; answerIds: string[] }) => Promise<Question>
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
      <button 
        onClick={() => onSubmit({ 
          description: 'Test Question', 
          active: true, 
          order: 1, 
          answerIds: [] 
        })}
      >
        Submit Form
      </button>
      <button onClick={onCancel}>Cancel Form</button>
    </div>
  ),
}))

vi.mock('./QuestionList', () => ({
  QuestionList: ({ questions, answers, onEdit, onDelete, isDeleting }: QuestionListProps) => (
    <div data-testid="question-list">
      <div data-testid="questions-count">{questions.length}</div>
      <div data-testid="answers-count">{answers.length}</div>
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

vi.mock('@/shared/components/Card', () => ({
  Card: ({ children, variant, className }: CardProps) => (
    <div data-testid="card" data-variant={variant} className={className}>
      {children}
    </div>
  ),
}))

describe('QuestionsPage', () => {
  const mockAnswers: Answer[] = [
    { id: 'a1', description: 'Answer 1', active: true, order: 1 },
    { id: 'a2', description: 'Answer 2', active: true, order: 2 },
  ]

  const mockQuestions: Question[] = [
    { id: 'q1', description: 'Question 1', active: true, order: 1, answerIds: ['a1'] },
    { id: 'q2', description: 'Question 2', active: false, order: 2, answerIds: ['a1', 'a2'] },
  ]

  const mockCreateQuestion = vi.fn<(input: CreateQuestionInput) => Promise<Question>>()
  const mockUpdateQuestion = vi.fn<(params: { id: string; input: UpdateQuestionInput }) => Promise<Question>>()
  const mockDeleteQuestion = vi.fn<(id: string) => Promise<void>>()
  const mockAssociateAnswers = vi.fn<(params: { id: string; answerIds: string[] }) => Promise<Question>>()
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
    associateAnswers: mockAssociateAnswers,
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
    mockAssociateAnswers.mockResolvedValue(mockQuestions[0])
    mockCreateAnswer.mockResolvedValue(mockAnswers[0])
    mockUpdateAnswer.mockResolvedValue(mockAnswers[0])
    mockDeleteAnswer.mockResolvedValue(undefined)
    
    vi.mocked(useQuestions).mockReturnValue(defaultUseQuestionsReturn)
    vi.mocked(useAnswers).mockReturnValue(defaultUseAnswersReturn)
    
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('Loading State', () => {
    it('should render loading spinner when questions are loading', () => {
      vi.mocked(useQuestions).mockReturnValue({
        ...defaultUseQuestionsReturn,
        questions: [],
        isLoading: true,
      })

      render(<QuestionsPage />)

      expect(screen.getByTestId('spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByTestId('spinner')).toHaveAttribute('data-size', 'large')
    })

    it('should render loading spinner when answers are loading', () => {
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultUseAnswersReturn,
        answers: [],
        isLoading: true,
      })

      render(<QuestionsPage />)

      expect(screen.getByTestId('spinner')).toBeInTheDocument()
      expect(screen.queryByText('Questions')).not.toBeInTheDocument()
    })

    it('should render loading spinner when both are loading', () => {
      vi.mocked(useQuestions).mockReturnValue({
        ...defaultUseQuestionsReturn,
        isLoading: true,
      })
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultUseAnswersReturn,
        isLoading: true,
      })

      render(<QuestionsPage />)

      expect(screen.getByTestId('spinner')).toBeInTheDocument()
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })
  })

  describe('Page Rendering', () => {
    it('should render page title and description', () => {
      render(<QuestionsPage />)

      expect(screen.getByRole('heading', { level: 1, name: 'Questions' })).toBeInTheDocument()
      expect(screen.getByText('Manage questions and their associated answers')).toBeInTheDocument()
    })

    it('should render New Question button', () => {
      render(<QuestionsPage />)

      const newButton = screen.getByRole('button', { name: '+ New Question' })
      expect(newButton).toBeInTheDocument()
      expect(newButton).toHaveAttribute('data-variant', 'primary')
    })

    it('should display total questions count', () => {
      render(<QuestionsPage />)

      const questionsText = screen.getByText(/Total Questions:/)
      expect(questionsText).toBeInTheDocument()
      expect(questionsText.parentElement).toHaveTextContent('Total Questions: 2')
    })

    it('should display available answers count', () => {
      render(<QuestionsPage />)

      const answersText = screen.getByText(/Available Answers:/)
      expect(answersText).toBeInTheDocument()
      expect(answersText.parentElement).toHaveTextContent('Available Answers: 2')
    })

    it('should display statistics cards with correct variants', () => {
      const { container } = render(<QuestionsPage />)

      const cards = screen.getAllByTestId('card')
      expect(cards.length).toBeGreaterThanOrEqual(2) // At least 2 stat cards

      // Statistics cards should have glass variant
      const glassCards = container.querySelectorAll('[data-variant="glass"]')
      expect(glassCards.length).toBeGreaterThanOrEqual(2)
    })

    it('should render QuestionList with correct props', () => {
      render(<QuestionsPage />)

      expect(screen.getByTestId('question-list')).toBeInTheDocument()
      expect(screen.getByTestId('questions-count')).toHaveTextContent('2')
      expect(screen.getByTestId('answers-count')).toHaveTextContent('2')
      expect(screen.getByTestId('is-deleting')).toHaveTextContent('false')
    })

    it('should render with empty questions list', () => {
      vi.mocked(useQuestions).mockReturnValue({
        ...defaultUseQuestionsReturn,
        questions: [],
      })

      render(<QuestionsPage />)

      const questionsText = screen.getByText(/Total Questions:/)
      expect(questionsText).toBeInTheDocument()
      expect(questionsText.parentElement).toHaveTextContent('Total Questions: 0')
      expect(screen.getByTestId('questions-count')).toHaveTextContent('0')
    })

    it('should render with empty answers list', () => {
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultUseAnswersReturn,
        answers: [],
      })

      render(<QuestionsPage />)

      const answersText = screen.getByText(/Available Answers:/)
      expect(answersText).toBeInTheDocument()
      expect(answersText.parentElement).toHaveTextContent('Available Answers: 0')
      expect(screen.getByTestId('answers-count')).toHaveTextContent('0')
    })
  })

  describe('Create Flow', () => {
    it('should open modal for creating new question', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: '+ New Question' }))

      expect(screen.getByTestId('modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Create New Question')
    })

    it('should render QuestionForm in create mode', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: '+ New Question' }))

      expect(screen.getByTestId('question-form')).toBeInTheDocument()
      expect(screen.getByTestId('form-mode')).toHaveTextContent('create')
      expect(screen.queryByTestId('form-question-id')).not.toBeInTheDocument()
    })

    it('should call createQuestion when submitting new question form', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: '+ New Question' }))
      await user.click(screen.getByRole('button', { name: 'Submit Form' }))

      await waitFor(() => {
        expect(mockCreateQuestion).toHaveBeenCalledTimes(1)
        expect(mockCreateQuestion).toHaveBeenCalledWith({
          description: 'Test Question',
          active: true,
          order: 1,
          answerIds: [],
        })
      })
    })

    it('should close modal after successful creation', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: '+ New Question' }))
      expect(screen.getByTestId('modal')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Submit Form' }))

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
      })
    })

    it('should handle creation error gracefully', async () => {
      const user = userEvent.setup()
      const error = new Error('Creation failed')
      mockCreateQuestion.mockRejectedValueOnce(error)

      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: '+ New Question' }))
      await user.click(screen.getByRole('button', { name: 'Submit Form' }))

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to save question:', error)
      })

      // Modal should remain open on error
      expect(screen.getByTestId('modal')).toBeInTheDocument()
    })

    it('should close modal when cancel button is clicked in create mode', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: '+ New Question' }))
      expect(screen.getByTestId('modal')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Cancel Form' }))

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
      expect(mockCreateQuestion).not.toHaveBeenCalled()
    })
  })

  describe('Edit Flow', () => {
    it('should open modal in edit mode when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: 'Edit Question q1' }))

      expect(screen.getByTestId('modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Question')
    })

    it('should render QuestionForm in edit mode with correct question', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: 'Edit Question q1' }))

      expect(screen.getByTestId('question-form')).toBeInTheDocument()
      expect(screen.getByTestId('form-mode')).toHaveTextContent('edit')
      expect(screen.getByTestId('form-question-id')).toHaveTextContent('q1')
    })

    it('should call updateQuestion when submitting edit form', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: 'Edit Question q1' }))
      await user.click(screen.getByRole('button', { name: 'Submit Form' }))

      await waitFor(() => {
        expect(mockUpdateQuestion).toHaveBeenCalledTimes(1)
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

    it('should close modal after successful update', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: 'Edit Question q2' }))
      expect(screen.getByTestId('modal')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Submit Form' }))

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
      })
    })

    it('should handle update error gracefully', async () => {
      const user = userEvent.setup()
      const error = new Error('Update failed')
      mockUpdateQuestion.mockRejectedValueOnce(error)

      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: 'Edit Question q1' }))
      await user.click(screen.getByRole('button', { name: 'Submit Form' }))

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to save question:', error)
      })

      // Modal should remain open on error
      expect(screen.getByTestId('modal')).toBeInTheDocument()
    })

    it('should close modal when cancel button is clicked in edit mode', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: 'Edit Question q1' }))
      expect(screen.getByTestId('modal')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Cancel Form' }))

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
      expect(mockUpdateQuestion).not.toHaveBeenCalled()
    })

    it('should edit different question correctly', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: 'Edit Question q2' }))

      expect(screen.getByTestId('form-question-id')).toHaveTextContent('q2')
    })
  })

  describe('Delete Flow', () => {
    it('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm')
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: 'Delete Question q1' }))

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this question?')
    })

    it('should call deleteQuestion when deletion is confirmed', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: 'Delete Question q1' }))

      await waitFor(() => {
        expect(mockDeleteQuestion).toHaveBeenCalledTimes(1)
        expect(mockDeleteQuestion).toHaveBeenCalledWith('q1')
      })
    })

    it('should not call deleteQuestion when deletion is cancelled', async () => {
      const user = userEvent.setup()
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: 'Delete Question q1' }))

      expect(mockDeleteQuestion).not.toHaveBeenCalled()
    })

    it('should handle delete error gracefully', async () => {
      const user = userEvent.setup()
      const error = new Error('Delete failed')
      mockDeleteQuestion.mockRejectedValueOnce(error)

      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: 'Delete Question q1' }))

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to delete question:', error)
      })
    })

    it('should pass isDeleting state to QuestionList', () => {
      vi.mocked(useQuestions).mockReturnValue({
        ...defaultUseQuestionsReturn,
        isDeleting: true,
      })

      render(<QuestionsPage />)

      expect(screen.getByTestId('is-deleting')).toHaveTextContent('true')
    })

    it('should delete different questions correctly', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: 'Delete Question q2' }))

      await waitFor(() => {
        expect(mockDeleteQuestion).toHaveBeenCalledWith('q2')
      })
    })
  })

  describe('Modal Interactions', () => {
    it('should close modal when clicking modal close button', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: '+ New Question' }))
      expect(screen.getByTestId('modal')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Close Modal' }))

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
    })

    it('should clear editing state when closing modal', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      // Open edit modal
      await user.click(screen.getByRole('button', { name: 'Edit Question q1' }))
      expect(screen.getByTestId('form-mode')).toHaveTextContent('edit')

      // Close modal
      await user.click(screen.getByRole('button', { name: 'Close Modal' }))

      // Open create modal - should be in create mode
      await user.click(screen.getByRole('button', { name: '+ New Question' }))
      expect(screen.getByTestId('form-mode')).toHaveTextContent('create')
    })

    it('should not open multiple modals simultaneously', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      await user.click(screen.getByRole('button', { name: '+ New Question' }))
      
      const modals = screen.getAllByTestId('modal')
      expect(modals).toHaveLength(1)
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete create-edit-delete workflow', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      // Create
      await user.click(screen.getByRole('button', { name: '+ New Question' }))
      await user.click(screen.getByRole('button', { name: 'Submit Form' }))
      await waitFor(() => expect(mockCreateQuestion).toHaveBeenCalled())

      // Edit
      await user.click(screen.getByRole('button', { name: 'Edit Question q1' }))
      await user.click(screen.getByRole('button', { name: 'Submit Form' }))
      await waitFor(() => expect(mockUpdateQuestion).toHaveBeenCalled())

      // Delete
      await user.click(screen.getByRole('button', { name: 'Delete Question q1' }))
      await waitFor(() => expect(mockDeleteQuestion).toHaveBeenCalled())
    })

    it('should display correct counts with multiple questions and answers', () => {
      const manyQuestions: Question[] = Array.from({ length: 10 }, (_, i) => ({
        id: `q${i}`,
        description: `Question ${i}`,
        active: true,
        order: i,
        answerIds: [],
      }))

      const manyAnswers: Answer[] = Array.from({ length: 15 }, (_, i) => ({
        id: `a${i}`,
        description: `Answer ${i}`,
        active: true,
        order: i,
      }))

      vi.mocked(useQuestions).mockReturnValue({
        ...defaultUseQuestionsReturn,
        questions: manyQuestions,
      })
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultUseAnswersReturn,
        answers: manyAnswers,
      })

      render(<QuestionsPage />)

      const questionsText = screen.getByText(/Total Questions:/)
      const answersText = screen.getByText(/Available Answers:/)
      
      expect(questionsText.parentElement).toHaveTextContent('Total Questions: 10')
      expect(answersText.parentElement).toHaveTextContent('Available Answers: 15')
    })

    it('should handle switching between create and edit modes', async () => {
      const user = userEvent.setup()
      render(<QuestionsPage />)

      // Open create modal
      await user.click(screen.getByRole('button', { name: '+ New Question' }))
      expect(screen.getByTestId('form-mode')).toHaveTextContent('create')
      await user.click(screen.getByRole('button', { name: 'Cancel Form' }))

      // Open edit modal
      await user.click(screen.getByRole('button', { name: 'Edit Question q1' }))
      expect(screen.getByTestId('form-mode')).toHaveTextContent('edit')
      await user.click(screen.getByRole('button', { name: 'Cancel Form' }))

      // Open create modal again
      await user.click(screen.getByRole('button', { name: '+ New Question' }))
      expect(screen.getByTestId('form-mode')).toHaveTextContent('create')
    })
  })
})