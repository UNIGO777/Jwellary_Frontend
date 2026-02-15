import { api } from './api.js'

export const mailService = {
  async send({ to, subject, text, html }) {
    return api.post('/api/mail/send', { body: { to, subject, text, html } })
  },

  async contact({ name, email, phone, message, orderId, type }) {
    return api.post('/api/mail/contact', { body: { name, email, phone, message, orderId, type } })
  }
}
