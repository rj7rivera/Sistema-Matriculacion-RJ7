import { useState } from 'react'
import { supabase } from '../services/supabaseClient'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) {
      setErrorMessage('Correo y contraseña son obligatorios.')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        })

        if (error) {
          throw error
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        })

        if (error) {
          throw error
        }

        setSuccessMessage('Cuenta creada. Si tu proyecto pide verificacion, revisa tu correo.')
      }
    } catch (error) {
      setErrorMessage(error.message || 'No fue posible autenticarte.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const switchMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'))
    setErrorMessage('')
    setSuccessMessage('')
  }

  return (
    <div className="auth-shell">
      <section className="auth-card" aria-label="Formulario de acceso">
        <p className="auth-kicker">Unidad Educativa San Gabriel</p>
        <h1>{mode === 'login' ? 'Ingresar al sistema' : 'Crear cuenta de acceso'}</h1>
        <p className="auth-help">
          {mode === 'login'
            ? 'Usa tu correo y contraseña para trabajar con los modulos.'
            : 'Crea tu cuenta para habilitar operaciones protegidas por seguridad RLS.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Correo</span>
            <input
              type="email"
              placeholder="correo@dominio.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="form-field">
            <span>Contrasena</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {errorMessage ? <p className="auth-message is-error">{errorMessage}</p> : null}
          {successMessage ? <p className="auth-message is-success">{successMessage}</p> : null}

          <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <button type="button" className="auth-link" onClick={switchMode}>
          {mode === 'login' ? 'No tienes cuenta? Crear una ahora' : 'Ya tienes cuenta? Inicia sesion'}
        </button>
      </section>
    </div>
  )
}

export default LoginPage
