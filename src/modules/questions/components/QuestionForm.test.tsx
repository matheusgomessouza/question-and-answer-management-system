import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionForm } from './QuestionForm'
import { Answer } from '../../answers/types'
import { Question } from '../types'
import { QuestionFormData } from '../validators/questionSchema'

describe('QuestionForm', () => {
  const mockAnswers: Answer[] = [
    { id: '1', description: 'Answer 1', order: 1, active: true },
    { id: '2', description: 'Answer 2', order: 2, active: false },
    { id: '3', description: 'Answer 3', order: 3, active: true },
  ]

  const mockQuestion: Question = {
    id: 'q1',
    description: 'Test Question',
    active: true,
    order: 1,
    answerIds: ['1'],
  }

  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render form with default values for create mode', () => {
      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('Enter question description')
      const activeCheckbox = screen.getByLabelText('Active')
      const orderInput = screen.getByRole('spinbutton', { name: /order/i })
      const createButton = screen.getByRole('button', { name: /create/i })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })

      expect(descriptionInput).toHaveValue('')
      expect(activeCheckbox).toBeChecked()
      expect(orderInput).toHaveValue(0)
      expect(createButton).toBeInTheDocument()
      expect(cancelButton).toBeInTheDocument()
    })

    it('should render form with populated values for edit mode', () => {
      render(
        <QuestionForm
          question={mockQuestion}
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('Enter question description')
      const activeCheckbox = screen.getByLabelText('Active')
      const orderInput = screen.getByRole('spinbutton', { name: /order/i })
      const updateButton = screen.getByRole('button', { name: /update/i })

      expect(descriptionInput).toHaveValue('Test Question')
      expect(activeCheckbox).toBeChecked()
      expect(orderInput).toHaveValue(1)
      expect(updateButton).toBeInTheDocument()
    })

    it('should render description input with autofocus', () => {
      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('Enter question description')
      expect(descriptionInput).toHaveFocus()
    })

    it('should render all available answers as checkboxes', () => {
      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByLabelText(/Answer 1/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Answer 2/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Answer 3/)).toBeInTheDocument()
    })

    it('should show empty state when no answers available', () => {
      render(
        <QuestionForm
          answers={[]}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('No answers available. Create answers first.')).toBeInTheDocument()
    })

    it('should mark inactive answers with (Inactive) label', () => {
      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('(Inactive)')).toBeInTheDocument()
    })
  })

  describe('Answer Sorting', () => {
    it('should display answers sorted by order ascending', () => {
      const unorderedAnswers: Answer[] = [
        { id: '3', description: 'Answer C', order: 3, active: true },
        { id: '1', description: 'Answer A', order: 1, active: true },
        { id: '2', description: 'Answer B', order: 2, active: true },
      ]

      render(
        <QuestionForm
          answers={unorderedAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const labels = screen.getAllByText(/Answer [ABC]/)
      expect(labels[0]).toHaveTextContent('Answer A')
      expect(labels[1]).toHaveTextContent('Answer B')
      expect(labels[2]).toHaveTextContent('Answer C')
    })

    it('should not mutate the original answers array', () => {
      const originalAnswers = [...mockAnswers]

      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(mockAnswers).toEqual(originalAnswers)
    })
  })

  describe('Answer Selection', () => {
    it('should pre-select answers in edit mode', () => {
      render(
        <QuestionForm
          question={mockQuestion}
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const answer1Checkbox = screen.getByLabelText(/Answer 1/) as HTMLInputElement
      const answer2Checkbox = screen.getByLabelText(/Answer 2/) as HTMLInputElement

      expect(answer1Checkbox.checked).toBe(true)
      expect(answer2Checkbox.checked).toBe(false)
    })

    it('should allow selecting multiple answers', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('Enter question description')
      const answer1Checkbox = screen.getByLabelText(/Answer 1/)
      const answer2Checkbox = screen.getByLabelText(/Answer 2/)
      const submitButton = screen.getByRole('button', { name: /create/i })

      await user.type(descriptionInput, 'Test Question')
      await user.click(answer1Checkbox)
      await user.click(answer2Checkbox)
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })

      const [[submittedData]] = mockOnSubmit.mock.calls as [[QuestionFormData]]
      expect(submittedData.answerIds).toContain('1')
      expect(submittedData.answerIds).toContain('2')
    })

    it('should allow deselecting answers', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <QuestionForm
          question={mockQuestion}
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const answer1Checkbox = screen.getByLabelText(/Answer 1/)
      const submitButton = screen.getByRole('button', { name: /update/i })

      // Answer 1 is pre-selected, deselect it
      await user.click(answer1Checkbox)
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })

      const [[submittedData]] = mockOnSubmit.mock.calls as [[QuestionFormData]]
      expect(submittedData.answerIds).not.toContain('1')
    })

    it('should submit with empty answerIds array when no answers selected', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('Enter question description')
      const submitButton = screen.getByRole('button', { name: /create/i })

      await user.type(descriptionInput, 'Question without answers')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })

      const [[submittedData]] = mockOnSubmit.mock.calls as [[QuestionFormData]]
      expect(submittedData.answerIds).toEqual([])
    })
  })

  describe('User Interactions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should toggle active checkbox', async () => {
      const user = userEvent.setup()
      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const activeCheckbox = screen.getByLabelText('Active')
      expect(activeCheckbox).toBeChecked()

      await user.click(activeCheckbox)
      expect(activeCheckbox).not.toBeChecked()

      await user.click(activeCheckbox)
      expect(activeCheckbox).toBeChecked()
    })

    it('should update order input value', async () => {
      const user = userEvent.setup()
      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const orderInput = screen.getByRole('spinbutton', { name: /order/i })
      
      await user.clear(orderInput)
      await user.type(orderInput, '5')

      expect(orderInput).toHaveValue(5)
    })
  })

  describe('Form Submission', () => {
    it('should submit form with correct data in create mode', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('Enter question description')
      const activeCheckbox = screen.getByLabelText('Active')
      const orderInput = screen.getByRole('spinbutton', { name: /order/i })
      const answer1Checkbox = screen.getByLabelText(/Answer 1/)
      const submitButton = screen.getByRole('button', { name: /create/i })

      await user.type(descriptionInput, 'New Question')
      await user.click(activeCheckbox) // Unchecks it
      await user.clear(orderInput)
      await user.type(orderInput, '3')
      await user.click(answer1Checkbox)
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })

      const [[submittedData]] = mockOnSubmit.mock.calls as [[QuestionFormData]]
      expect(submittedData).toEqual({
        description: 'New Question',
        active: false,
        order: 3,
        answerIds: ['1'],
      })
    })

    it('should submit form with updated data in edit mode', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <QuestionForm
          question={mockQuestion}
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('Enter question description')
      const submitButton = screen.getByRole('button', { name: /update/i })

      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Updated Question')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })

      const [[submittedData]] = mockOnSubmit.mock.calls as [[QuestionFormData]]
      expect(submittedData.description).toBe('Updated Question')
    })

    it('should disable buttons during submission', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('Enter question description')
      const submitButton = screen.getByRole('button', { name: /create/i })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })

      await user.type(descriptionInput, 'Test question')
      await user.click(submitButton)

      // Buttons should be disabled during submission
      expect(submitButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })

    it('should show loading state on submit button during submission', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('Enter question description')
      const submitButton = screen.getByRole('button', { name: /create/i })

      await user.type(descriptionInput, 'Test question')
      await user.click(submitButton)

      // Button should have aria-busy attribute when loading
      expect(submitButton).toHaveAttribute('aria-busy', 'true')

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Form Validation', () => {
    it('should display error for empty description', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Description is required')
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should display error for description exceeding 500 characters', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('Enter question description')
      const submitButton = screen.getByRole('button', { name: /create/i })

      const longText = 'a'.repeat(501)
      await user.type(descriptionInput, longText)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Maximum 500 characters')
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should accept valid description within limits', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('Enter question description')
      const submitButton = screen.getByRole('button', { name: /create/i })

      const validText = 'a'.repeat(500)
      await user.type(descriptionInput, validText)
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should clear validation errors when input is corrected', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('Enter question description')
      const submitButton = screen.getByRole('button', { name: /create/i })

      // First trigger validation error
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Description is required')
      })

      // Then fix the error
      await user.type(descriptionInput, 'Valid description')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument()
      expect(screen.getByLabelText('Active')).toBeInTheDocument()
      expect(screen.getByRole('spinbutton', { name: /order/i })).toBeInTheDocument()
    })

    it('should mark invalid fields with aria-invalid', async () => {
      const user = userEvent.setup()
      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      await waitFor(() => {
        const descriptionInput = screen.getByPlaceholderText('Enter question description')
        expect(descriptionInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('should have proper role for error messages', async () => {
      const user = userEvent.setup()
      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
      })
    })

    it('should have accessible labels for answer checkboxes', () => {
      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      mockAnswers.forEach(answer => {
        const checkbox = screen.getByLabelText(new RegExp(answer.description))
        expect(checkbox).toBeInTheDocument()
        expect(checkbox).toHaveAttribute('type', 'checkbox')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle single answer correctly', () => {
      const singleAnswer: Answer[] = [
        { id: '1', description: 'Only answer', order: 1, active: true },
      ]

      render(
        <QuestionForm
          answers={singleAnswer}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByLabelText(/Only answer/)).toBeInTheDocument()
    })

    it('should handle answers with same order numbers', () => {
      const sameOrderAnswers: Answer[] = [
        { id: '1', description: 'Answer A', order: 1, active: true },
        { id: '2', description: 'Answer B', order: 1, active: true },
      ]

      render(
        <QuestionForm
          answers={sameOrderAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByLabelText(/Answer A/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Answer B/)).toBeInTheDocument()
    })

    it('should handle long descriptions gracefully', () => {
      const longDescriptionAnswer: Answer[] = [
        {
          id: '1',
          description: 'This is a very long answer description that tests how the component handles lengthy text content',
          order: 1,
          active: true,
        },
      ]

      render(
        <QuestionForm
          answers={longDescriptionAnswer}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(/This is a very long answer description/)).toBeInTheDocument()
    })

    it('should handle order value of 0', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <QuestionForm
          answers={mockAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('Enter question description')
      screen.getByRole('spinbutton', { name: /order/i })
      const submitButton = screen.getByRole('button', { name: /create/i })

      await user.type(descriptionInput, 'Test')
      // Order is already 0 by default
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })

      const [[submittedData]] = mockOnSubmit.mock.calls as [[QuestionFormData]]
      expect(submittedData.order).toBe(0)
    })

    it('should handle all inactive answers', () => {
      const inactiveAnswers: Answer[] = [
        { id: '1', description: 'Inactive 1', order: 1, active: false },
        { id: '2', description: 'Inactive 2', order: 2, active: false },
      ]

      render(
        <QuestionForm
          answers={inactiveAnswers}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const inactiveLabels = screen.getAllByText('(Inactive)')
      expect(inactiveLabels).toHaveLength(2)
    })
  })
})