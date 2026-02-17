import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnswersPage } from './AnswersPage'
import { useAnswers } from '../hooks/useAnswers'
import { Answer } from '../types'
import { AnswerFormData } from '../validators/answerSchema'

vi.mock('../hooks/useAnswers')

interface AnswerFormProps {
  answer?: Answer
  onSubmit: (data: AnswerFormData) => Promise<void>
  onCancel: () => void
}

interface AnswerListProps {
  answers: Answer[]
  onEdit: (answer: Answer) => void
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
  variant?: 'primary' | 'secondary' | 'danger'
  onClick?: () => void
  children: React.ReactNode
}

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large'
}

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'glass' | 'solid'
}

vi.mock('./AnswerForm', () => ({
  AnswerForm: ({ onSubmit, onCancel, answer }: AnswerFormProps) => (
    <div data-testid="answer-form">
      <div>{answer ? `Editing: ${answer.description}` : 'Creating new answer'}</div>
      <button onClick={() => onSubmit({ description: 'Test Answer', active: true, order: 1 })}>
        Submit Form
      </button>
      <button onClick={onCancel}>Cancel Form</button>
    </div>
  ),
}))

vi.mock('./AnswerList', () => ({
  AnswerList: ({ answers, onEdit, onDelete, isDeleting }: AnswerListProps) => (
    <div data-testid="answer-list">
      <div>List has {answers.length} answers</div>
      <div>Deleting: {isDeleting.toString()}</div>
      {answers.map(answer => (
        <div key={answer.id} data-testid={`answer-${answer.id}`}>
          <span>{answer.description}</span>
          <button onClick={() => onEdit(answer)}>Edit Answer</button>
          <button onClick={() => onDelete(answer.id)}>Delete Answer</button>
        </div>
      ))}
    </div>
  ),
}))

vi.mock('@/shared/components/Modal', () => ({
  Modal: ({ isOpen, children, title, onClose }: ModalProps) =>
    isOpen ? (
      <div data-testid="modal" role="dialog">
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose} aria-label="Close modal">
          Close
        </button>
        {children}
      </div>
    ) : null,
}))

vi.mock('@/shared/components/Button', () => ({
  Button: ({ onClick, children, variant = 'primary' }: ButtonProps) => (
    <button onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
}))

vi.mock('@/shared/components/Spinner', () => ({
  Spinner: ({ size = 'medium' }: SpinnerProps) => (
    <div role="status" data-size={size}>
      Loading...
    </div>
  ),
}))

vi.mock('@/shared/components/Card', () => ({
  Card: ({ children, className, variant }: CardProps) => (
    <div data-testid="card" data-variant={variant} className={className}>
      {children}
    </div>
  ),
}))

describe('AnswersPage', () => {
  const mockAnswers: Answer[] = [
    { id: '1', description: 'Answer 1', active: true, order: 1 },
    { id: '2', description: 'Answer 2', active: false, order: 2 },
  ]

  const defaultMockReturn = {
    answers: mockAnswers,
    isLoading: false,
    error: null,
    createAnswer: vi.fn(),
    updateAnswer: vi.fn(),
    deleteAnswer: vi.fn(),
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockRestore()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('Loading State', () => {
    it('should render loading spinner when isLoading is true', () => {
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        answers: [],
        isLoading: true,
      })

      render(<AnswersPage />)

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByText('Answers')).not.toBeInTheDocument()
    })

    it('should render loading spinner with large size', () => {
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        answers: [],
        isLoading: true,
      })

      render(<AnswersPage />)

      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('data-size', 'large')
    })
  })

  describe('Page Rendering', () => {
    it('should render page title and description', () => {
      vi.mocked(useAnswers).mockReturnValue(defaultMockReturn)

      render(<AnswersPage />)

      expect(screen.getByText('Answers')).toBeInTheDocument()
      expect(screen.getByText('Manage answer options for questions')).toBeInTheDocument()
    })

    it('should render New Answer button', () => {
      vi.mocked(useAnswers).mockReturnValue(defaultMockReturn)

      render(<AnswersPage />)

      const newButton = screen.getByText('+ New Answer')
      expect(newButton).toBeInTheDocument()
      expect(newButton).toHaveAttribute('data-variant', 'primary')
    })

    it('should display total answer count', () => {
      vi.mocked(useAnswers).mockReturnValue(defaultMockReturn)

      render(<AnswersPage />)

      expect(screen.getByText(/Total Answers:/)).toBeInTheDocument()
      expect(screen.getByText((content, element) => {
        return element?.textContent === '2'
      })).toBeInTheDocument()
    })

    it('should display count of 0 when no answers', () => {
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        answers: [],
      })

      render(<AnswersPage />)

      expect(screen.getByText(/Total Answers:/)).toBeInTheDocument()
      expect(screen.getByText((content, element) => {
        return element?.textContent === '0'
      })).toBeInTheDocument()
    })

    it('should render AnswerList with correct props', () => {
      vi.mocked(useAnswers).mockReturnValue(defaultMockReturn)

      render(<AnswersPage />)

      expect(screen.getByTestId('answer-list')).toBeInTheDocument()
      expect(screen.getByText('List has 2 answers')).toBeInTheDocument()
    })

    it('should pass isDeleting prop to AnswerList', () => {
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        isDeleting: true,
      })

      render(<AnswersPage />)

      expect(screen.getByText('Deleting: true')).toBeInTheDocument()
    })
  })

  describe('Create Answer Flow', () => {
    it('should open modal with create title when New Answer is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useAnswers).mockReturnValue(defaultMockReturn)

      render(<AnswersPage />)

      await user.click(screen.getByText('+ New Answer'))

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Create New Answer')
    })

    it('should render AnswerForm in create mode when modal is opened', async () => {
      const user = userEvent.setup()
      vi.mocked(useAnswers).mockReturnValue(defaultMockReturn)

      render(<AnswersPage />)

      await user.click(screen.getByText('+ New Answer'))

      expect(screen.getByTestId('answer-form')).toBeInTheDocument()
      expect(screen.getByText('Creating new answer')).toBeInTheDocument()
    })

    it('should call createAnswer when form is submitted in create mode', async () => {
      const user = userEvent.setup()
      const createAnswerMock = vi.fn().mockResolvedValue(undefined)
      
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        createAnswer: createAnswerMock,
      })

      render(<AnswersPage />)

      await user.click(screen.getByText('+ New Answer'))
      await user.click(screen.getByText('Submit Form'))

      await waitFor(() => {
        expect(createAnswerMock).toHaveBeenCalledTimes(1)
        expect(createAnswerMock).toHaveBeenCalledWith({
          description: 'Test Answer',
          active: true,
          order: 1,
        })
      })
    })

    it('should close modal after successful creation', async () => {
      const user = userEvent.setup()
      const createAnswerMock = vi.fn().mockResolvedValue(undefined)
      
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        createAnswer: createAnswerMock,
      })

      render(<AnswersPage />)

      await user.click(screen.getByText('+ New Answer'))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.click(screen.getByText('Submit Form'))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should handle creation errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const createAnswerMock = vi.fn().mockRejectedValue(new Error('Network error'))
      
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        createAnswer: createAnswerMock,
      })

      render(<AnswersPage />)

      await user.click(screen.getByText('+ New Answer'))
      await user.click(screen.getByText('Submit Form'))

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to save answer:',
          expect.any(Error)
        )
      })

      // Modal should stay open on error
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Edit Answer Flow', () => {
    it('should open modal with edit title when Edit button is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useAnswers).mockReturnValue(defaultMockReturn)

      render(<AnswersPage />)

      await user.click(screen.getAllByText('Edit Answer')[0])

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Answer')
    })

    it('should render AnswerForm with answer data in edit mode', async () => {
      const user = userEvent.setup()
      vi.mocked(useAnswers).mockReturnValue(defaultMockReturn)

      render(<AnswersPage />)

      await user.click(screen.getAllByText('Edit Answer')[0])

      expect(screen.getByTestId('answer-form')).toBeInTheDocument()
      expect(screen.getByText('Editing: Answer 1')).toBeInTheDocument()
    })

    it('should call updateAnswer with correct id and data when form is submitted', async () => {
      const user = userEvent.setup()
      const updateAnswerMock = vi.fn().mockResolvedValue(undefined)
      
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        updateAnswer: updateAnswerMock,
      })

      render(<AnswersPage />)

      await user.click(screen.getAllByText('Edit Answer')[0])
      await user.click(screen.getByText('Submit Form'))

      await waitFor(() => {
        expect(updateAnswerMock).toHaveBeenCalledTimes(1)
        expect(updateAnswerMock).toHaveBeenCalledWith({
          id: '1',
          input: {
            description: 'Test Answer',
            active: true,
            order: 1,
          },
        })
      })
    })

    it('should close modal after successful update', async () => {
      const user = userEvent.setup()
      const updateAnswerMock = vi.fn().mockResolvedValue(undefined)
      
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        updateAnswer: updateAnswerMock,
      })

      render(<AnswersPage />)

      await user.click(screen.getAllByText('Edit Answer')[0])
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.click(screen.getByText('Submit Form'))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should handle update errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const updateAnswerMock = vi.fn().mockRejectedValue(new Error('Update failed'))
      
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        updateAnswer: updateAnswerMock,
      })

      render(<AnswersPage />)

      await user.click(screen.getAllByText('Edit Answer')[0])
      await user.click(screen.getByText('Submit Form'))

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to save answer:',
          expect.any(Error)
        )
      })

      // Modal should stay open on error
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should handle editing different answers', async () => {
      const user = userEvent.setup()
      const updateAnswerMock = vi.fn().mockResolvedValue(undefined)
      
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        updateAnswer: updateAnswerMock,
      })

      render(<AnswersPage />)

      // Edit second answer
      await user.click(screen.getAllByText('Edit Answer')[1])
      expect(screen.getByText('Editing: Answer 2')).toBeInTheDocument()

      await user.click(screen.getByText('Submit Form'))

      await waitFor(() => {
        expect(updateAnswerMock).toHaveBeenCalledWith({
          id: '2',
          input: {
            description: 'Test Answer',
            active: true,
            order: 1,
          },
        })
      })
    })
  })

  describe('Delete Answer Flow', () => {
    it('should show confirmation dialog when Delete is clicked', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
      
      vi.mocked(useAnswers).mockReturnValue(defaultMockReturn)

      render(<AnswersPage />)

      await user.click(screen.getAllByText('Delete Answer')[0])

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this answer? It will be removed from all associated questions.'
      )
    })

    it('should call deleteAnswer when deletion is confirmed', async () => {
      const user = userEvent.setup()
      const deleteAnswerMock = vi.fn().mockResolvedValue(undefined)
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        deleteAnswer: deleteAnswerMock,
      })

      render(<AnswersPage />)

      await user.click(screen.getAllByText('Delete Answer')[0])

      await waitFor(() => {
        expect(deleteAnswerMock).toHaveBeenCalledWith('1')
      })
    })

    it('should not call deleteAnswer when deletion is cancelled', async () => {
      const user = userEvent.setup()
      const deleteAnswerMock = vi.fn()
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        deleteAnswer: deleteAnswerMock,
      })

      render(<AnswersPage />)

      await user.click(screen.getAllByText('Delete Answer')[0])

      expect(deleteAnswerMock).not.toHaveBeenCalled()
    })

    it('should handle deletion errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const deleteAnswerMock = vi.fn().mockRejectedValue(new Error('Delete failed'))
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        deleteAnswer: deleteAnswerMock,
      })

      render(<AnswersPage />)

      await user.click(screen.getAllByText('Delete Answer')[0])

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to delete answer:',
          expect.any(Error)
        )
      })
    })
  })

  describe('Modal Interactions', () => {
    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useAnswers).mockReturnValue(defaultMockReturn)

      render(<AnswersPage />)

      await user.click(screen.getByText('+ New Answer'))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.click(screen.getByText('Cancel Form'))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useAnswers).mockReturnValue(defaultMockReturn)

      render(<AnswersPage />)

      await user.click(screen.getByText('+ New Answer'))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.click(screen.getByLabelText('Close modal'))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should reset editing state when modal is closed', async () => {
      const user = userEvent.setup()
      vi.mocked(useAnswers).mockReturnValue(defaultMockReturn)

      render(<AnswersPage />)

      // Open in edit mode
      await user.click(screen.getAllByText('Edit Answer')[0])
      expect(screen.getByText('Editing: Answer 1')).toBeInTheDocument()

      // Close modal
      await user.click(screen.getByText('Cancel Form'))

      // Open again - should be in create mode now
      await user.click(screen.getByText('+ New Answer'))
      expect(screen.getByText('Creating new answer')).toBeInTheDocument()
      expect(screen.queryByText('Editing:')).not.toBeInTheDocument()
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle multiple create/edit cycles', async () => {
      const user = userEvent.setup()
      const createAnswerMock = vi.fn().mockResolvedValue(undefined)
      const updateAnswerMock = vi.fn().mockResolvedValue(undefined)
      
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        createAnswer: createAnswerMock,
        updateAnswer: updateAnswerMock,
      })

      render(<AnswersPage />)

      // Create
      await user.click(screen.getByText('+ New Answer'))
      await user.click(screen.getByText('Submit Form'))
      await waitFor(() => expect(createAnswerMock).toHaveBeenCalledTimes(1))

      // Edit
      await user.click(screen.getAllByText('Edit Answer')[0])
      await user.click(screen.getByText('Submit Form'))
      await waitFor(() => expect(updateAnswerMock).toHaveBeenCalledTimes(1))

      // Create again
      await user.click(screen.getByText('+ New Answer'))
      await user.click(screen.getByText('Submit Form'))
      await waitFor(() => expect(createAnswerMock).toHaveBeenCalledTimes(2))
    })

    it('should display correct count with empty answers array', () => {
      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        answers: [],
      })

      render(<AnswersPage />)

      expect(screen.getByTestId('answer-list')).toBeInTheDocument()
      expect(screen.getByText('List has 0 answers')).toBeInTheDocument()
    })

    it('should display correct count with many answers', () => {
      const manyAnswers: Answer[] = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        description: `Answer ${i + 1}`,
        active: true,
        order: i + 1,
      }))

      vi.mocked(useAnswers).mockReturnValue({
        ...defaultMockReturn,
        answers: manyAnswers,
      })

      render(<AnswersPage />)

      expect(screen.getByText((content, element) => {
        return element?.textContent === '25'
      })).toBeInTheDocument()
    })
  })
})