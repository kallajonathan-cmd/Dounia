import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const city = searchParams.get('city')

    const apiKey = process.env.OPENWEATHER_API_KEY

    if (!apiKey || apiKey === 'your-openweather-api-key-here') {
      // Return mock data if no API key
      return NextResponse.json({
        main: { temp: 18, humidity: 65 },
        weather: [{ description: 'Partiellement nuageux', icon: '02d' }],
        wind: { speed: 12 },
        name: city || 'Paris',
      })
    }

    const query = lat && lon ? `lat=${lat}&lon=${lon}` : `q=${encodeURIComponent(city || 'Paris')}`
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${query}&appid=${apiKey}&units=metric&lang=fr`,
      { next: { revalidate: 1800 } }
    )

    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: 'Impossible de récupérer la météo', main: { temp: null } },
      { status: 500 }
    )
  }
}
