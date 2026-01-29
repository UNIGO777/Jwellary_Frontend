import { api } from './api.js'

export const mailService = {
  async send({ to, subject, text, html }) {
    return api.post('/api/mail/send', { body: { to, subject, text, html } })
  },

  async contact({ name, email, message }) {
    return api.post('/api/mail/contact', { body: { name, email, message } })
  }
}

