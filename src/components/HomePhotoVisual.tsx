import { homeHeroPhoto } from '../pages/homePhotos'

export function HomePhotoVisual() {
  return (
    <div className="home-visual home-reveal">
      <figure className="home-visual-hero">
        <img
          src={homeHeroPhoto.src}
          alt={homeHeroPhoto.alt}
          width={640}
          height={800}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </figure>
    </div>
  )
}
