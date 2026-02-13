export type UUID = string

export interface Answer {
  id: UUID
  description: string
  active: boolean
  order: number
}

export interface CreateAnswerInput {
  description: string
  active?: boolean
  order?: number
}

export interface UpdateAnswerInput {
  description?: string
  active?: boolean
  order?: number
}
