import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnswerForm } from './AnswerForm'
import { Answer } from '../types'

describe('AnswerForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render form with default values for create mode', () => {
      render(<AnswerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const descriptionInput = screen.getByPlaceholderText('Enter answer description')
      const activeCheckbox = screen.getByRole('checkbox', { name: /active/i })
      const orderInput = screen.getByRole('spinbutton', { name: /order/i })
      const createButton = screen.getByRole('button', { name: /create/i })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })

      expect(descriptionInput).toHaveValue('')
      expect(activeCheckbox).toBeChecked()
      expect(orderInput).toHaveValue(0)
      expect(createButton).toBeInTheDocument()
      expect(cancelButton).toBeInTheDocument()
    })

    it('should render form with populated fields for edit mode', () => {
      const answer: Answer = {
        id: '1',
        description: 'Test answer',
        active: false,
        order: 5,
      }

      render(<AnswerForm answer={answer} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const descriptionInput = screen.getByPlaceholderText('Enter answer description')
      const activeCheckbox = screen.getByRole('checkbox', { name: /active/i })
      const orderInput = screen.getByRole('spinbutton', { name: /order/i })
      const updateButton = screen.getByRole('button', { name: /update/i })

      expect(descriptionInput).toHaveValue('Test answer')
      expect(activeCheckbox).not.toBeChecked()
      expect(orderInput).toHaveValue(5)
      expect(updateButton).toBeInTheDocument()
    })
  })

  describe('User interactions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<AnswerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledOnce()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should toggle active checkbox', async () => {
      const user = userEvent.setup()
      render(<AnswerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const activeCheckbox = screen.getByRole('checkbox', { name: /active/i })
      expect(activeCheckbox).toBeChecked()

      await user.click(activeCheckbox)
      expect(activeCheckbox).not.toBeChecked()

      await user.click(activeCheckbox)
      expect(activeCheckbox).toBeChecked()
    })

    it('should update order input value', async () => {
      const user = userEvent.setup()
      render(<AnswerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const orderInput = screen.getByRole('spinbutton', { name: /order/i })
      
      await user.clear(orderInput)
      await user.type(orderInput, '10')

      expect(orderInput).toHaveValue(10)
    })
  })

  describe('Form submission', () => {
    it('should submit form with correct data in create mode', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(<AnswerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const descriptionInput = screen.getByPlaceholderText('Enter answer description')
      const activeCheckbox = screen.getByRole('checkbox', { name: /active/i })
      const orderInput = screen.getByRole('spinbutton', { name: /order/i })
      const createButton = screen.getByRole('button', { name: /create/i })

      await user.type(descriptionInput, 'New answer')
      await user.click(activeCheckbox)
      await user.clear(orderInput)
      await user.type(orderInput, '3')
      await user.click(createButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })

      const [[submittedData]] = mockOnSubmit.mock.calls
      expect(submittedData).toEqual({
        description: 'New answer',
        active: false,
        order: 3,
      })
    })

    it('should submit form with updated data in edit mode', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      const answer: Answer = {
        id: '1',
        description: 'Original answer',
        active: true,
        order: 2,
      }

      render(<AnswerForm answer={answer} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const descriptionInput = screen.getByPlaceholderText('Enter answer description')
      const updateButton = screen.getByRole('button', { name: /update/i })

      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Updated answer')
      await user.click(updateButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })

      const [[submittedData]] = mockOnSubmit.mock.calls
      expect(submittedData).toEqual({
        description: 'Updated answer',
        active: true,
        order: 2,
      })
    })

    it('should disable buttons during submission', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<AnswerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const descriptionInput = screen.getByPlaceholderText('Enter answer description')
      const createButton = screen.getByRole('button', { name: /create/i })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })

      await user.type(descriptionInput, 'Test answer')
      await user.click(createButton)

      // Buttons should be disabled during submission
      expect(createButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })

    it('should show loading state on submit button during submission', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<AnswerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const descriptionInput = screen.getByPlaceholderText('Enter answer description')
      const createButton = screen.getByRole('button', { name: /create/i })

      await user.type(descriptionInput, 'Test answer')
      await user.click(createButton)

      expect(createButton).toHaveAttribute('aria-busy', 'true')

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Form validation', () => {
    it('should display error for empty description', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(<AnswerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const createButton = screen.getByRole('button', { name: /create/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Description is required')
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should display error for description exceeding 500 characters', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(<AnswerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const descriptionInput = screen.getByPlaceholderText('Enter answer description')
      const createButton = screen.getByRole('button', { name: /create/i })

      // Type a string with more than 500 characters
      const longText = 'a'.repeat(501)
      await user.type(descriptionInput, longText)
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Maximum 500 characters')
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should validate order accepts zero and positive values', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(<AnswerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const descriptionInput = screen.getByPlaceholderText('Enter answer description')
      const orderInput = screen.getByRole('spinbutton', { name: /order/i })
      const createButton = screen.getByRole('button', { name: /create/i })

      await user.type(descriptionInput, 'Valid description')
      await user.clear(orderInput)
      await user.type(orderInput, '0')
      await user.click(createButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })

      const [[submittedData]] = mockOnSubmit.mock.calls
      expect(submittedData.order).toBe(0)

      // Test with positive value
      vi.clearAllMocks()
      await user.clear(orderInput)
      await user.type(orderInput, '10')
      await user.click(createButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })

      const [[submittedData2]] = mockOnSubmit.mock.calls
      expect(submittedData2.order).toBe(10)
    })

    it('should clear validation errors when input is corrected', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)

      render(<AnswerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const descriptionInput = screen.getByPlaceholderText('Enter answer description')
      const createButton = screen.getByRole('button', { name: /create/i })

      // First trigger validation error
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Description is required')
      })

      // Then fix the error
      await user.type(descriptionInput, 'Valid description')
      await user.click(createButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })

      const [[submittedData]] = mockOnSubmit.mock.calls
      expect(submittedData).toEqual({
        description: 'Valid description',
        active: true,
        order: 0,
      })

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(<AnswerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /active/i })).toBeInTheDocument()
      expect(screen.getByRole('spinbutton', { name: /order/i })).toBeInTheDocument()
    })

    it('should mark invalid fields with aria-invalid', async () => {
      const user = userEvent.setup()
      render(<AnswerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const createButton = screen.getByRole('button', { name: /create/i })
      await user.click(createButton)

      await waitFor(() => {
        const descriptionInput = screen.getByPlaceholderText('Enter answer description')
        expect(descriptionInput).toHaveAttribute('aria-invalid', 'true')
      })
    })
  })
})