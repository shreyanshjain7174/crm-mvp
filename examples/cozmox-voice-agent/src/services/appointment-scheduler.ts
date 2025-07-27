/**
 * Appointment Scheduler Service
 * 
 * Handles appointment scheduling logic, availability checking, and calendar integration
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('AppointmentScheduler')

export interface AppointmentRequest {
  contactId?: string
  phoneNumber: string
  preferredDate?: string
  preferredTime?: string
  duration?: number
  notes?: string
  customerName?: string
  customerEmail?: string
}

export interface ScheduledAppointment {
  id: string
  contactId?: string
  customerName?: string
  customerEmail?: string
  phoneNumber: string
  scheduledDate: Date
  duration: number
  status: 'pending' | 'confirmed' | 'cancelled'
  notes?: string
  createdAt: Date
  requiresApproval: boolean
}

export interface TimeSlot {
  date: string
  time: string
  available: boolean
  duration: number
}

export class AppointmentScheduler {
  private config: any

  constructor(config: any) {
    this.config = config
  }

  /**
   * Schedule a new appointment
   */
  async scheduleAppointment(request: AppointmentRequest): Promise<ScheduledAppointment> {
    logger.info('Scheduling appointment:', { 
      phoneNumber: request.phoneNumber,
      preferredDate: request.preferredDate,
      preferredTime: request.preferredTime
    })

    try {
      // Parse preferred date and time
      const scheduledDate = this.parseDateTime(request.preferredDate, request.preferredTime)
      
      // Check availability
      const isAvailable = await this.checkAvailability(
        scheduledDate, 
        request.duration || this.config.appointmentSettings?.duration || 30
      )

      if (!isAvailable) {
        // Find next available slot
        const nextSlot = await this.findNextAvailableSlot(
          scheduledDate,
          request.duration || this.config.appointmentSettings?.duration || 30
        )
        
        if (nextSlot) {
          logger.info('Suggested alternative appointment time:', nextSlot)
          scheduledDate.setTime(nextSlot.getTime())
        } else {
          throw new Error('No available appointment slots found')
        }
      }

      // Create appointment
      const appointment: ScheduledAppointment = {
        id: this.generateAppointmentId(),
        contactId: request.contactId,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        phoneNumber: request.phoneNumber,
        scheduledDate,
        duration: request.duration || this.config.appointmentSettings?.duration || 30,
        status: this.config.appointmentSettings?.requiresApproval ? 'pending' : 'confirmed',
        notes: request.notes,
        createdAt: new Date(),
        requiresApproval: this.config.appointmentSettings?.requiresApproval || false
      }

      // Store appointment (in real implementation, this would go to database)
      await this.storeAppointment(appointment)

      // Send notifications
      if (!appointment.requiresApproval) {
        await this.sendAppointmentConfirmation(appointment)
      } else {
        await this.sendApprovalRequest(appointment)
      }

      logger.info('Appointment scheduled successfully:', { appointmentId: appointment.id })
      return appointment

    } catch (error) {
      logger.error('Failed to schedule appointment:', error)
      throw new Error('Appointment scheduling failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  /**
   * Check if a time slot is available
   */
  async checkAvailability(dateTime: Date, duration: number): Promise<boolean> {
    try {
      // Check business hours
      if (!this.isWithinBusinessHours(dateTime)) {
        logger.debug('Time slot outside business hours:', dateTime)
        return false
      }

      // Check for conflicts with existing appointments
      const conflicts = await this.getConflictingAppointments(dateTime, duration)
      
      if (conflicts.length > 0) {
        logger.debug('Time slot conflicts with existing appointments:', conflicts.length)
        return false
      }

      // Check buffer time
      const bufferTime = this.config.appointmentSettings?.bufferTime || 15
      const hasBuffer = await this.checkBufferTime(dateTime, duration, bufferTime)
      
      if (!hasBuffer) {
        logger.debug('Insufficient buffer time around appointment')
        return false
      }

      return true
    } catch (error) {
      logger.error('Availability check failed:', error)
      return false
    }
  }

  /**
   * Find the next available appointment slot
   */
  async findNextAvailableSlot(preferredDate: Date, duration: number): Promise<Date | null> {
    const searchDays = 14 // Search up to 2 weeks ahead
    const currentDate = new Date(preferredDate)
    
    for (let dayOffset = 0; dayOffset < searchDays; dayOffset++) {
      const searchDate = new Date(currentDate)
      searchDate.setDate(currentDate.getDate() + dayOffset)
      
      // Get business hours for this day
      const daySchedule = this.getDaySchedule(searchDate)
      if (!daySchedule) continue
      
      // Check every 30-minute slot during business hours
      const slots = this.generateTimeSlots(searchDate, daySchedule, duration)
      
      for (const slot of slots) {
        if (await this.checkAvailability(slot, duration)) {
          return slot
        }
      }
    }
    
    return null
  }

  /**
   * Get available time slots for a specific date
   */
  async getAvailableSlots(date: Date, duration = 30): Promise<TimeSlot[]> {
    const daySchedule = this.getDaySchedule(date)
    if (!daySchedule) return []
    
    const slots = this.generateTimeSlots(date, daySchedule, duration)
    const availableSlots: TimeSlot[] = []
    
    for (const slot of slots) {
      const isAvailable = await this.checkAvailability(slot, duration)
      availableSlots.push({
        date: slot.toISOString().split('T')[0],
        time: slot.toTimeString().slice(0, 5),
        available: isAvailable,
        duration
      })
    }
    
    return availableSlots
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string, reason?: string): Promise<void> {
    logger.info('Cancelling appointment:', { appointmentId, reason })
    
    try {
      // Update appointment status
      await this.updateAppointmentStatus(appointmentId, 'cancelled')
      
      // Send cancellation notification
      await this.sendCancellationNotification(appointmentId, reason)
      
      logger.info('Appointment cancelled successfully:', appointmentId)
    } catch (error) {
      logger.error('Failed to cancel appointment:', error)
      throw error
    }
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(
    appointmentId: string, 
    newDate: Date, 
    newDuration?: number
  ): Promise<ScheduledAppointment> {
    logger.info('Rescheduling appointment:', { appointmentId, newDate })
    
    try {
      const existingAppointment = await this.getAppointment(appointmentId)
      if (!existingAppointment) {
        throw new Error('Appointment not found')
      }
      
      // Check availability for new time
      const duration = newDuration || existingAppointment.duration
      const isAvailable = await this.checkAvailability(newDate, duration)
      
      if (!isAvailable) {
        throw new Error('New time slot is not available')
      }
      
      // Update appointment
      const updatedAppointment: ScheduledAppointment = {
        ...existingAppointment,
        scheduledDate: newDate,
        duration,
        status: this.config.appointmentSettings?.requiresApproval ? 'pending' : 'confirmed'
      }
      
      await this.storeAppointment(updatedAppointment)
      
      // Send reschedule notification
      await this.sendRescheduleNotification(updatedAppointment)
      
      return updatedAppointment
    } catch (error) {
      logger.error('Failed to reschedule appointment:', error)
      throw error
    }
  }

  /**
   * Parse date and time strings into Date object
   */
  private parseDateTime(dateStr?: string, timeStr?: string): Date {
    const now = new Date()
    
    if (!dateStr && !timeStr) {
      // Default to next business day at 10 AM
      const tomorrow = new Date(now)
      tomorrow.setDate(now.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      return tomorrow
    }
    
    const date = dateStr ? new Date(dateStr) : new Date()
    
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number)
      date.setHours(hours, minutes, 0, 0)
    }
    
    return date
  }

  /**
   * Check if time is within business hours
   */
  private isWithinBusinessHours(dateTime: Date): boolean {
    if (!this.config.businessHours?.enabled) return true
    
    const daySchedule = this.getDaySchedule(dateTime)
    if (!daySchedule) return false
    
    const timeStr = dateTime.toTimeString().slice(0, 5)
    return timeStr >= daySchedule.open && timeStr <= daySchedule.close
  }

  /**
   * Get business schedule for a specific day
   */
  private getDaySchedule(date: Date): { open: string; close: string } | null {
    if (!this.config.businessHours?.schedule) return null
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[date.getDay()]
    
    return this.config.businessHours.schedule[dayName] || null
  }

  /**
   * Generate time slots for a day
   */
  private generateTimeSlots(date: Date, schedule: { open: string; close: string }, duration: number): Date[] {
    const slots: Date[] = []
    const [openHour, openMinute] = schedule.open.split(':').map(Number)
    const [closeHour, closeMinute] = schedule.close.split(':').map(Number)
    
    const current = new Date(date)
    current.setHours(openHour, openMinute, 0, 0)
    
    const endTime = new Date(date)
    endTime.setHours(closeHour, closeMinute, 0, 0)
    
    while (current.getTime() + (duration * 60000) <= endTime.getTime()) {
      slots.push(new Date(current))
      current.setMinutes(current.getMinutes() + 30) // 30-minute intervals
    }
    
    return slots
  }

  /**
   * Check for conflicting appointments
   */
  private async getConflictingAppointments(dateTime: Date, duration: number): Promise<any[]> {
    // In real implementation, this would query the database
    // For now, return empty array (no conflicts)
    return []
  }

  /**
   * Check buffer time around appointment
   */
  private async checkBufferTime(dateTime: Date, duration: number, bufferMinutes: number): Promise<boolean> {
    // In real implementation, check if there are appointments within buffer time
    return true
  }

  /**
   * Generate unique appointment ID
   */
  private generateAppointmentId(): string {
    return 'apt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * Store appointment in database
   */
  private async storeAppointment(appointment: ScheduledAppointment): Promise<void> {
    // In real implementation, store in database
    logger.debug('Storing appointment:', appointment.id)
  }

  /**
   * Get appointment by ID
   */
  private async getAppointment(appointmentId: string): Promise<ScheduledAppointment | null> {
    // In real implementation, fetch from database
    return null
  }

  /**
   * Update appointment status
   */
  private async updateAppointmentStatus(appointmentId: string, status: string): Promise<void> {
    // In real implementation, update database
    logger.debug('Updating appointment status:', { appointmentId, status })
  }

  /**
   * Send appointment confirmation
   */
  private async sendAppointmentConfirmation(appointment: ScheduledAppointment): Promise<void> {
    logger.info('Sending appointment confirmation:', appointment.id)
    // In real implementation, send SMS/email confirmation
  }

  /**
   * Send approval request
   */
  private async sendApprovalRequest(appointment: ScheduledAppointment): Promise<void> {
    logger.info('Sending approval request for appointment:', appointment.id)
    // In real implementation, notify business owner for approval
  }

  /**
   * Send cancellation notification
   */
  private async sendCancellationNotification(appointmentId: string, reason?: string): Promise<void> {
    logger.info('Sending cancellation notification:', { appointmentId, reason })
    // In real implementation, send notification
  }

  /**
   * Send reschedule notification
   */
  private async sendRescheduleNotification(appointment: ScheduledAppointment): Promise<void> {
    logger.info('Sending reschedule notification:', appointment.id)
    // In real implementation, send notification
  }
}