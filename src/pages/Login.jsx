import { motion } from 'framer-motion'
import Auth from './Auth.jsx'

export default function Login() {
  const MotionDiv = motion.div

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Auth initialMode="login" />
    </MotionDiv>
  )
}
