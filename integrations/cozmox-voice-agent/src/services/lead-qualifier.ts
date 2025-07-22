/**
 * Lead Qualifier Service
 * 
 * Handles lead qualification through voice interactions, scoring, and categorization
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('LeadQualifier')

export interface ContactData {
  id: string
  name?: string
  phone: string
  email?: string
  company?: string
  source?: string
  tags?: string[]
  notes?: string
}

export interface QualificationData {
  budget?: string
  timeline?: string
  intent?: string
  score?: number
  confidence?: number
  reasoning?: string
}

export interface LeadScore {
  score: number
  confidence: number
  reasoning: string
  factors: {
    budget: number
    timeline: number
    intent: number
    engagement: number
  }
}

export interface QualificationResult {
  score: number
  stage: 'cold' | 'warm' | 'hot' | 'qualified'
  notes: string[]
  nextActions: string[]
  confidence: number
}

export class LeadQualifier {
  private config: any
  private scoringWeights: {
    budgetWeight: number
    timelineWeight: number
    intentWeight: number
  }

  constructor(config: any) {
    this.config = config
    this.scoringWeights = {
      budgetWeight: config.leadQualification?.scoringCriteria?.budgetWeight || 30,
      timelineWeight: config.leadQualification?.scoringCriteria?.timelineWeight || 25,
      intentWeight: config.leadQualification?.scoringCriteria?.intentWeight || 45
    }
  }

  /**
   * Analyze contact for lead qualification potential
   */
  async analyzeContact(contact: ContactData): Promise<QualificationResult> {
    logger.info('Analyzing contact for qualification:', { contactId: contact.id })

    try {
      // Basic scoring based on contact data
      let score = 0
      const notes: string[] = []
      const nextActions: string[] = []

      // Score based on available data
      if (contact.email) {
        score += 10
        notes.push('Email available for follow-up')
      }

      if (contact.company) {
        score += 15
        notes.push('Business contact identified')
      }

      if (contact.source) {
        switch (contact.source.toLowerCase()) {
          case 'referral':
            score += 25
            notes.push('High-value referral source')
            break
          case 'website':
            score += 15
            notes.push('Organic website inquiry')
            break
          case 'social':
            score += 10
            notes.push('Social media lead')
            break
          default:
            score += 5
        }
      }

      // Analyze tags for qualification signals
      if (contact.tags) {
        for (const tag of contact.tags) {
          if (tag.toLowerCase().includes('interested')) {
            score += 20
            notes.push('Expressed interest')
          }
          if (tag.toLowerCase().includes('budget')) {
            score += 15
            notes.push('Budget discussed')
          }
        }
      }

      // Determine stage based on score
      const stage = this.determineLeadStage(score)
      
      // Generate next actions
      nextActions.push(...this.generateNextActions(stage, contact))

      return {
        score: Math.min(100, score),
        stage,
        notes,
        nextActions,
        confidence: 0.7 // Base confidence for contact analysis
      }

    } catch (error) {
      logger.error('Contact analysis failed:', error)
      throw new Error('Lead qualification analysis failed')
    }
  }

  /**
   * Qualify lead based on voice conversation data
   */
  async qualifyLead(qualificationData: QualificationData): Promise<LeadScore> {
    logger.info('Qualifying lead with conversation data:', {
      budget: !!qualificationData.budget,
      timeline: !!qualificationData.timeline,
      intent: qualificationData.intent
    })

    try {
      const factors = {
        budget: this.scoreBudget(qualificationData.budget),
        timeline: this.scoreTimeline(qualificationData.timeline),
        intent: this.scoreIntent(qualificationData.intent),
        engagement: qualificationData.score || 50 // Base engagement score
      }

      // Calculate weighted score
      const score = (
        (factors.budget * this.scoringWeights.budgetWeight / 100) +
        (factors.timeline * this.scoringWeights.timelineWeight / 100) +
        (factors.intent * this.scoringWeights.intentWeight / 100) +
        (factors.engagement * 0.1) // 10% weight for engagement
      )

      const confidence = this.calculateConfidence(factors, qualificationData)
      const reasoning = this.generateReasoning(factors, score)

      return {
        score: Math.round(Math.min(100, score)),
        confidence,
        reasoning,
        factors
      }

    } catch (error) {
      logger.error('Lead qualification failed:', error)
      throw new Error('Lead qualification processing failed')
    }
  }

  /**
   * Update lead score based on new information
   */
  async updateLeadScore(leadData: any): Promise<LeadScore> {
    logger.info('Updating lead score:', { leadId: leadData.id })

    try {
      // Get existing score or start fresh
      const existingScore = leadData.score || 0
      const existingFactors = leadData.factors || {
        budget: 0,
        timeline: 0,
        intent: 0,
        engagement: 0
      }

      // Update factors based on new data
      const updatedFactors = { ...existingFactors }

      if (leadData.budget) {
        updatedFactors.budget = Math.max(updatedFactors.budget, this.scoreBudget(leadData.budget))
      }

      if (leadData.timeline) {
        updatedFactors.timeline = Math.max(updatedFactors.timeline, this.scoreTimeline(leadData.timeline))
      }

      if (leadData.intent) {
        updatedFactors.intent = Math.max(updatedFactors.intent, this.scoreIntent(leadData.intent))
      }

      // Increase engagement score for continued interaction
      updatedFactors.engagement = Math.min(100, updatedFactors.engagement + 10)

      // Recalculate score
      const newScore = (
        (updatedFactors.budget * this.scoringWeights.budgetWeight / 100) +
        (updatedFactors.timeline * this.scoringWeights.timelineWeight / 100) +
        (updatedFactors.intent * this.scoringWeights.intentWeight / 100) +
        (updatedFactors.engagement * 0.1)
      )

      const confidence = this.calculateConfidence(updatedFactors, leadData)
      const reasoning = this.generateReasoning(updatedFactors, newScore)

      return {
        score: Math.round(Math.min(100, newScore)),
        confidence,
        reasoning,
        factors: updatedFactors
      }

    } catch (error) {
      logger.error('Lead score update failed:', error)
      throw new Error('Lead score update failed')
    }
  }

  /**
   * Get qualifying questions based on configuration
   */
  getQualifyingQuestions(): string[] {
    const defaultQuestions = [
      'What is your budget range for this project?',
      'When are you looking to start?',
      'What is your timeline for making a decision?',
      'Have you worked with similar services before?',
      'What is driving this need right now?'
    ]

    if (this.config.leadQualification?.qualifyingQuestions) {
      return this.config.leadQualification.qualifyingQuestions
        .split('\n')
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 0)
    }

    return defaultQuestions
  }

  /**
   * Score budget information
   */
  private scoreBudget(budget?: string): number {
    if (!budget) return 0

    const budgetLower = budget.toLowerCase()
    
    // Look for budget ranges or amounts
    if (budgetLower.includes('unlimited') || budgetLower.includes('no limit')) return 100
    if (budgetLower.includes('high') || budgetLower.includes('premium')) return 90
    if (budgetLower.includes('medium') || budgetLower.includes('reasonable')) return 70
    if (budgetLower.includes('low') || budgetLower.includes('tight')) return 30
    if (budgetLower.includes('no budget') || budgetLower.includes('free')) return 0

    // Try to extract numeric values
    const numbers = budget.match(/\d+/g)
    if (numbers && numbers.length > 0) {
      const amount = parseInt(numbers[0])
      if (amount >= 100000) return 100 // ₹1L+
      if (amount >= 50000) return 80   // ₹50K+
      if (amount >= 25000) return 60   // ₹25K+
      if (amount >= 10000) return 40   // ₹10K+
      if (amount >= 5000) return 20    // ₹5K+
    }

    return 50 // Default if budget mentioned but unclear
  }

  /**
   * Score timeline information
   */
  private scoreTimeline(timeline?: string): number {
    if (!timeline) return 0

    const timelineLower = timeline.toLowerCase()
    
    if (timelineLower.includes('immediately') || timelineLower.includes('asap')) return 100
    if (timelineLower.includes('this week') || timelineLower.includes('urgent')) return 90
    if (timelineLower.includes('this month') || timelineLower.includes('soon')) return 80
    if (timelineLower.includes('next month') || timelineLower.includes('1-2 month')) return 70
    if (timelineLower.includes('quarter') || timelineLower.includes('3 month')) return 50
    if (timelineLower.includes('next year') || timelineLower.includes('6 month')) return 30
    if (timelineLower.includes('someday') || timelineLower.includes('eventually')) return 10

    return 50 // Default if timeline mentioned but unclear
  }

  /**
   * Score intent information
   */
  private scoreIntent(intent?: string): number {
    if (!intent) return 0

    const intentLower = intent.toLowerCase()
    
    // High intent keywords
    if (intentLower.includes('buy') || intentLower.includes('purchase')) return 100
    if (intentLower.includes('ready') || intentLower.includes('decision')) return 90
    if (intentLower.includes('interested') || intentLower.includes('need')) return 80
    if (intentLower.includes('considering') || intentLower.includes('exploring')) return 60
    if (intentLower.includes('learning') || intentLower.includes('research')) return 40
    if (intentLower.includes('curious') || intentLower.includes('wondering')) return 30

    return 50 // Default if intent mentioned but unclear
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(factors: any, data: any): number {
    let confidence = 0.5 // Base confidence
    
    // Increase confidence based on data completeness
    if (factors.budget > 0) confidence += 0.15
    if (factors.timeline > 0) confidence += 0.15
    if (factors.intent > 0) confidence += 0.15
    if (data.confidence) confidence += (data.confidence / 100) * 0.05

    return Math.min(1, confidence)
  }

  /**
   * Generate reasoning for the score
   */
  private generateReasoning(factors: any, score: number): string {
    const reasons: string[] = []
    
    if (factors.budget > 70) reasons.push('Strong budget indication')
    else if (factors.budget > 40) reasons.push('Moderate budget capacity')
    else if (factors.budget > 0) reasons.push('Limited budget mentioned')

    if (factors.timeline > 70) reasons.push('Urgent timeline')
    else if (factors.timeline > 40) reasons.push('Reasonable timeline')
    else if (factors.timeline > 0) reasons.push('Long-term timeline')

    if (factors.intent > 70) reasons.push('High purchase intent')
    else if (factors.intent > 40) reasons.push('Moderate interest level')
    else if (factors.intent > 0) reasons.push('Early research phase')

    if (factors.engagement > 70) reasons.push('High engagement level')

    if (reasons.length === 0) {
      return 'Score based on limited information available'
    }

    return reasons.join(', ')
  }

  /**
   * Determine lead stage based on score
   */
  private determineLeadStage(score: number): 'cold' | 'warm' | 'hot' | 'qualified' {
    if (score >= 80) return 'qualified'
    if (score >= 60) return 'hot'
    if (score >= 40) return 'warm'
    return 'cold'
  }

  /**
   * Generate next actions based on lead stage
   */
  private generateNextActions(stage: string, contact: ContactData): string[] {
    const actions: string[] = []

    switch (stage) {
      case 'qualified':
        actions.push('Schedule immediate follow-up call')
        actions.push('Prepare detailed proposal')
        actions.push('Assign to senior sales rep')
        break
      case 'hot':
        actions.push('Follow up within 24 hours')
        actions.push('Send relevant case studies')
        actions.push('Schedule demo or consultation')
        break
      case 'warm':
        actions.push('Add to nurture sequence')
        actions.push('Send educational content')
        actions.push('Follow up in 3-5 days')
        break
      case 'cold':
        actions.push('Add to long-term nurture')
        actions.push('Send occasional updates')
        actions.push('Follow up in 2-4 weeks')
        break
    }

    // Add contact-specific actions
    if (!contact.email) {
      actions.push('Collect email address')
    }
    
    if (!contact.company) {
      actions.push('Identify company/organization')
    }

    return actions
  }
}