export interface EligibilityRule {
  id: number
  name: string
  factor: 'INCOME' | 'EMPLOYMENT' | 'OBLIGATIONS' | 'REPAYMENT_HISTORY'
  weight: number
  thresholds: EligibilityThreshold[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EligibilityThreshold {
  min: number
  max: number | null
  score: number
}

export type EligibilityRecommendation = 'ELIGIBLE' | 'REVIEW' | 'NOT_ELIGIBLE'

export interface EligibilityScore {
  id: number
  application: number
  application_id: string
  member_name: string
  total_score: number
  breakdown: Record<string, number>
  recommendation: EligibilityRecommendation
  reasons: string[]
  calculated_at: string
}

export interface EligibilityScoreListItem {
  id: number
  application_id: string
  member_name: string
  total_score: number
  recommendation: EligibilityRecommendation
  calculated_at: string
}
