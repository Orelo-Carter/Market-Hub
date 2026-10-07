import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStorefrontCategories } from '../../services/storefrontApi'
import { getCategoryHeroCopy, getCategoryHeroImage } from '../../utils/categoryHero'

const AUTOPLAY_MS = 5000
const SWIPE_THRESHOLD = 45

function parentIdOf(category) {
  if (!category.parent) return null
  return typeof category.parent === 'object' ? category.parent._id : category.parent
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(query.matches)

    const handleChange = (event) => setPrefersReducedMotion(event.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

function CategoryHeroSlider() {
  const [categories, setCategories] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isUserPaused, setIsUserPaused] = useState(false)
  const touchStartX = useRef(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const topCategories = useMemo(
    () => categories.filter((category) => !parentIdOf(category)),
    [categories],
  )
  const slides = useMemo(
    () => topCategories.map((category) => ({
      ...category,
      ...getCategoryHeroCopy(category),
      image: getCategoryHeroImage(category),
    })),
    [topCategories],
  )
  const hasSlides = slides.length > 0
  const shouldAutoplay = hasSlides && slides.length > 1 && !prefersReducedMotion && !isHovered && !isUserPaused

  useEffect(() => {
    let isMounted = true

    async function loadCategories() {
      const result = await getStorefrontCategories()
      if (!isMounted) return
      setCategories(Array.isArray(result.data) ? result.data : [])
    }

    loadCategories()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!shouldAutoplay) return undefined
    const timer = window.setTimeout(() => {
      setCurrentIndex((index) => (index + 1) % slides.length)
    }, AUTOPLAY_MS)

    return () => window.clearTimeout(timer)
  }, [currentIndex, shouldAutoplay, slides.length])

  useEffect(() => {
    if (currentIndex > slides.length - 1) setCurrentIndex(0)
  }, [currentIndex, slides.length])

  const goToSlide = (index) => {
    if (!slides.length) return
    setCurrentIndex((index + slides.length) % slides.length)
  }

  const goNext = () => goToSlide(currentIndex + 1)
  const goPrevious = () => goToSlide(currentIndex - 1)

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight') goNext()
    if (event.key === 'ArrowLeft') goPrevious()
  }

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
    const delta = touchStartX.current - endX
    touchStartX.current = null

    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    if (delta > 0) goNext()
    else goPrevious()
  }

  if (!hasSlides) {
    return <div className="category-hero-slider is-loading" aria-label="Loading category highlights" />
  }

  return (
    <section
      className="category-hero-slider"
      aria-label="Featured shopping categories"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`category-hero-stage${prefersReducedMotion ? ' reduce-motion' : ''}`}>
        {slides.map((slide, index) => (
          <article
            className={`category-hero-slide${index === currentIndex ? ' is-active' : ''}`}
            key={slide._id}
            style={{ backgroundImage: `url("${slide.image}")` }}
            aria-hidden={index !== currentIndex}
          >
            <div className="category-hero-overlay" />
            <div className="category-hero-content">
              <h1>{slide.headline}</h1>
              {slide.subtext ? <p>{slide.subtext}</p> : null}
              <Link className="category-hero-cta" to={`/category/${slide.slug}`}>
                {slide.cta}
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="category-hero-dots" aria-label="Choose featured category">
        {slides.map((slide, index) => (
          <button
            type="button"
            className={index === currentIndex ? 'is-active' : ''}
            key={slide._id}
            aria-label={`Show ${slide.name}`}
            aria-current={index === currentIndex}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>

      {slides.length > 1 ? (
        <div className="category-hero-controls">
          <button type="button" aria-label="Previous category" onClick={goPrevious}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" aria-label="Next category" onClick={goNext}>
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            aria-label={isUserPaused ? 'Resume autoplay' : 'Pause autoplay'}
            onClick={() => setIsUserPaused((value) => !value)}
          >
            {isUserPaused || prefersReducedMotion ? <Play size={17} /> : <Pause size={17} />}
          </button>
        </div>
      ) : null}
    </section>
  )
}

export default CategoryHeroSlider
