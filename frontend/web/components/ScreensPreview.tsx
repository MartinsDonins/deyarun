const screens = [
  'https://placehold.co/300x600',
  'https://placehold.co/300x600',
  'https://placehold.co/300x600'
]

export default function ScreensPreview() {
  return (
    <section className="bg-[#121212] px-6 py-16">
      <h2 className="mb-8 text-center text-3xl font-semibold">Ekr\u0101na paraugi</h2>
      <div className="mx-auto flex max-w-5xl justify-center gap-4">
        {screens.map((src, idx) => (
          <img key={idx} src={src} alt="screen" className="rounded-lg shadow-lg" />
        ))}
      </div>
    </section>
  )
}
