import { Component } from 'react'
import { ErrorState } from '../components/ui/index.js'

// Atrapa errores de una pantalla para que no se caiga toda la app.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return <ErrorState mensaje="Esta pantalla tuvo un problema. Tus datos están a salvo." onReintentar={() => this.setState({ error: null })} />
    }
    return this.props.children
  }
}
