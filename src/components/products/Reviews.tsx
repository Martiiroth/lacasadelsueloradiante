'use client'

import { useState } from 'react'
import { ProductService } from '../../lib/products'
import { useAuth } from '../../contexts/AuthContext'
import type { ProductReview } from '../../types/products'

interface ReviewsProps {
  productId: string
  reviews: ProductReview[]
  onReviewAdded?: () => void
}

export default function Reviews({ productId, reviews, onReviewAdded }: ReviewsProps) {
  const { user } = useAuth()
  const [showAddReview, setShowAddReview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  })

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 
      : 0
  }))

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.client?.id) {
      alert('Debes iniciar sesión para escribir una reseña')
      return
    }

    if (!reviewForm.comment.trim()) {
      alert('Por favor, escribe un comentario')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await ProductService.addReview(
        productId,
        user.client.id,
        reviewForm.rating,
        reviewForm.comment.trim()
      )

      if (result.success) {
        setReviewForm({ rating: 5, comment: '' })
        setShowAddReview(false)
        onReviewAdded?.()
        alert('¡Reseña añadida exitosamente!')
      } else {
        alert(result.error || 'Error al añadir la reseña')
      }
    } catch (error: any) {
      alert(error.message || 'Error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    }

    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Verificar si el usuario ya ha escrito una reseña
  const userHasReviewed = user?.client?.id && reviews.some(
    review => review.client_id === user.client!.id
  )

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800">
        Reseñas ({reviews.length})
      </h3>

      {/* Resumen de calificaciones */}
      {reviews.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-800">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mt-1">
                {renderStars(Math.round(averageRating), 'lg')}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex-1 space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center text-sm">
                  <span className="w-3 text-gray-600">{rating}</span>
                  <svg className="w-4 h-4 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <div className="w-32 bg-gray-200 rounded-full h-2 mx-3">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-600">({count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Botón para añadir reseña */}
      {user && !userHasReviewed && (
        <div className="border-b pb-6">
          {!showAddReview ? (
            <button
              onClick={() => setShowAddReview(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Escribir una reseña
            </button>
          ) : (
            <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h4 className="text-lg font-semibold">Escribir reseña</h4>
              
              {/* Selector de calificación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calificación
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className={`w-8 h-8 ${
                        star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comentario */}
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Comentario
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Comparte tu experiencia con este producto..."
                  required
                />
              </div>

              {/* Botones */}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar reseña'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddReview(false)
                    setReviewForm({ rating: 5, comment: '' })
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {userHasReviewed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            Ya has escrito una reseña para este producto.
          </p>
        </div>
      )}

      {/* Lista de reseñas */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.286-.306l-5.314 2.07a1 1 0 01-1.24-1.24l2.07-5.314A8.955 8.955 0 013 12a8 8 0 018-8c4.418 0 8 3.582 8 8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reseñas aún</h3>
            <p className="text-gray-500">Sé el primero en escribir una reseña para este producto</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    {renderStars(review.rating)}
                    <span className="font-medium text-gray-800">
                      {review.client?.first_name} {review.client?.last_name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDate(review.created_at)}
                  </p>
                </div>
              </div>
              {review.comment && (
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}