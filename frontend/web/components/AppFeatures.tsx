const features = [
  { title: 'Treni\u0146u pl\u0101no\u0161ana', description: 'Izveido personaliz\u0113tus skr\u0113jienu pl\u0101nus.', icon: '🏃' },
  { title: 'GPS ieraksts', description: 'Saglab\u0101 mar\u0161rutus un distanci re\u0101l\u0101 laik\u0101.', icon: '📍' },
  { title: 'Statistika', description: 'Skaties progresu un sal\u012bdzini rezult\u0101tus ar draugiem.', icon: '📊' }
]

export default function AppFeatures() {
  return (
    <section className="px-6 py-16">
      <h2 className="mb-8 text-center text-3xl font-semibold">Iesp\u0113jas</h2>
      <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl bg-[#121212] p-6 text-center hover:bg-gray-800 transition-colors">
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="mb-2 text-xl font-medium">{f.title}</h3>
            <p className="text-gray-400">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
