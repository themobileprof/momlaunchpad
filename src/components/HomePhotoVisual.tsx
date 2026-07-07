import { homeHeroPhoto, homePhotoStrip } from '../pages/homePhotos'

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
      <div className="home-visual-strip">
        {homePhotoStrip.map((photo) => (
          <figure key={photo.src} className="home-visual-thumb">
            <img
              src={photo.src}
              alt={photo.alt}
              width={200}
              height={240}
              loading="lazy"
              decoding="async"
            />
          </figure>
        ))}
      </div>
    </div>
  )
}
