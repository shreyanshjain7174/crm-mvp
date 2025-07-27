/**
 * Simple test to verify the Cozmox Voice Agent integration works
 */

import cozmoxVoiceAgent from './index'
import { CozmoxVoiceAPI } from './services/cozmox-api'
import { CallProcessor } from './services/call-processor'
import { AppointmentScheduler } from './services/appointment-scheduler'
import { LeadQualifier } from './services/lead-qualifier'

console.log('🚀 Testing Cozmox Voice Agent Integration...')

// Test 1: Agent exports properly
console.log('✅ Agent exports successfully:', typeof cozmoxVoiceAgent)

// Test 2: Services export properly
console.log('✅ CozmoxVoiceAPI exports:', typeof CozmoxVoiceAPI)
console.log('✅ CallProcessor exports:', typeof CallProcessor)
console.log('✅ AppointmentScheduler exports:', typeof AppointmentScheduler)
console.log('✅ LeadQualifier exports:', typeof LeadQualifier)

// Test 3: Service instantiation
try {
  const config = {
    apiKey: 'test-key',
    businessInfo: { name: 'Test Business' },
    appointmentSettings: { enabled: true, duration: 30 },
    leadQualification: { enabled: true }
  }

  const voiceAPI = new CozmoxVoiceAPI({ apiKey: 'test-key' })
  const callProcessor = new CallProcessor(config)
  const appointmentScheduler = new AppointmentScheduler(config)
  const leadQualifier = new LeadQualifier(config)

  console.log('✅ All services instantiate successfully')
} catch (error) {
  console.error('❌ Service instantiation failed:', error)
}

// Test 4: Basic functionality
try {
  const leadQualifier = new LeadQualifier({
    leadQualification: {
      enabled: true,
      scoringCriteria: {
        budgetWeight: 30,
        timelineWeight: 25,
        intentWeight: 45
      }
    }
  })

  const questions = leadQualifier.getQualifyingQuestions()
  console.log('✅ Lead qualification questions:', questions.length, 'questions')

  // Test lead scoring
  const testContact = {
    id: 'test-123',
    name: 'John Doe',
    phone: '+1234567890',
    email: 'john@test.com',
    company: 'Test Corp',
    source: 'referral'
  }

  leadQualifier.analyzeContact(testContact).then(result => {
    console.log('✅ Contact analysis result:', {
      score: result.score,
      stage: result.stage,
      notesCount: result.notes.length,
      actionsCount: result.nextActions.length
    })
  }).catch(error => {
    console.error('❌ Contact analysis failed:', error)
  })

} catch (error) {
  console.error('❌ Functionality test failed:', error)
}

console.log('🎉 Cozmox Voice Agent Integration test complete!')