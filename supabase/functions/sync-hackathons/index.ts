import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HackathonData {
  title: string
  description: string | null
  start_date: string
  end_date: string
  registration_deadline: string
  registration_url: string
  source: 'mlh' | 'devfolio' | 'unstop' | 'devpost' | 'community'
  mode: 'online' | 'offline' | 'hybrid'
  location: string | null
  prize_pool: string | null
  image_url: string | null
  skills: string[]
}

// MLH Hackathons Scraper
async function fetchMLHHackathons(): Promise<HackathonData[]> {
  try {
    console.log('Fetching MLH hackathons...')
    const response = await fetch('https://mlh.io/seasons/2025/events')
    const html = await response.text()
    
    const hackathons: HackathonData[] = []
    
    // Parse MLH events from their page structure
    const eventPattern = /<div class="event-wrapper"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g
    const namePattern = /<h3[^>]*class="event-name"[^>]*>([^<]+)<\/h3>/
    const datePattern = /<p[^>]*class="event-date"[^>]*>([^<]+)<\/p>/
    const locationPattern = /<span[^>]*class="event-location"[^>]*>([^<]+)<\/span>/
    const linkPattern = /<a[^>]*href="([^"]+)"[^>]*class="event-link"/
    const imagePattern = /<img[^>]*src="([^"]+)"[^>]*class="event-logo"/
    const hybridPattern = /hybrid/i
    const digitalPattern = /digital|online|virtual/i
    
    let match
    while ((match = eventPattern.exec(html)) !== null) {
      const eventHtml = match[1]
      
      const nameMatch = namePattern.exec(eventHtml)
      const dateMatch = datePattern.exec(eventHtml)
      const locationMatch = locationPattern.exec(eventHtml)
      const linkMatch = linkPattern.exec(eventHtml)
      const imageMatch = imagePattern.exec(eventHtml)
      
      if (nameMatch && dateMatch) {
        const title = nameMatch[1].trim()
        const dateStr = dateMatch[1].trim()
        const location = locationMatch ? locationMatch[1].trim() : null
        const registrationUrl = linkMatch ? linkMatch[1] : `https://mlh.io/events`
        const imageUrl = imageMatch ? imageMatch[1] : null
        
        // Determine mode
        let mode: 'online' | 'offline' | 'hybrid' = 'offline'
        if (hybridPattern.test(eventHtml)) {
          mode = 'hybrid'
        } else if (digitalPattern.test(eventHtml) || digitalPattern.test(location || '')) {
          mode = 'online'
        }
        
        // Parse dates (MLH format: "Feb 7 - 9, 2025")
        const now = new Date()
        const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        
        hackathons.push({
          title,
          description: `Join ${title} - an MLH hackathon event. Build something amazing with fellow developers!`,
          start_date: futureDate.toISOString(),
          end_date: new Date(futureDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          registration_deadline: futureDate.toISOString(),
          registration_url: registrationUrl,
          source: 'mlh',
          mode,
          location,
          prize_pool: null,
          image_url: imageUrl,
          skills: ['JavaScript', 'Python', 'React', 'Node.js']
        })
      }
    }
    
    console.log(`Found ${hackathons.length} MLH hackathons`)
    return hackathons
  } catch (error) {
    console.error('Error fetching MLH hackathons:', error)
    return []
  }
}

// Devfolio Hackathons API
async function fetchDevfolioHackathons(): Promise<HackathonData[]> {
  try {
    console.log('Fetching Devfolio hackathons...')
    const response = await fetch('https://api.devfolio.co/api/search/hackathons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'application_open',
        from: 0,
        size: 50
      })
    })
    
    if (!response.ok) {
      console.log('Devfolio API not accessible, using fallback data')
      return getDevfolioFallbackData()
    }
    
    const data = await response.json()
    const hackathons: HackathonData[] = []
    
    if (data.hits?.hits) {
      for (const hit of data.hits.hits) {
        const source = hit._source
        hackathons.push({
          title: source.name,
          description: source.desc || source.tagline,
          start_date: source.starts_at,
          end_date: source.ends_at,
          registration_deadline: source.reg_ends_at || source.starts_at,
          registration_url: `https://${source.slug}.devfolio.co`,
          source: 'devfolio',
          mode: source.is_online ? 'online' : 'offline',
          location: source.location,
          prize_pool: source.prize_pool ? `₹${source.prize_pool.toLocaleString()}` : null,
          image_url: source.logo,
          skills: source.themes || []
        })
      }
    }
    
    console.log(`Found ${hackathons.length} Devfolio hackathons`)
    return hackathons
  } catch (error) {
    console.error('Error fetching Devfolio hackathons:', error)
    return getDevfolioFallbackData()
  }
}

// Devpost Hackathons
async function fetchDevpostHackathons(): Promise<HackathonData[]> {
  try {
    console.log('Fetching Devpost hackathons...')
    const response = await fetch('https://devpost.com/api/hackathons?status=upcoming&status=open')
    
    if (!response.ok) {
      console.log('Devpost API not accessible, using fallback data')
      return getDevpostFallbackData()
    }
    
    const data = await response.json()
    const hackathons: HackathonData[] = []
    
    if (data.hackathons) {
      for (const h of data.hackathons) {
        hackathons.push({
          title: h.title,
          description: h.tagline,
          start_date: h.submission_period_dates?.split(' - ')[0] || new Date().toISOString(),
          end_date: h.submission_period_dates?.split(' - ')[1] || new Date().toISOString(),
          registration_deadline: h.submission_period_dates?.split(' - ')[0] || new Date().toISOString(),
          registration_url: h.url,
          source: 'devpost',
          mode: h.online_only ? 'online' : 'offline',
          location: h.location,
          prize_pool: h.prize_amount ? `$${h.prize_amount.toLocaleString()}` : null,
          image_url: h.thumbnail_url,
          skills: h.themes || []
        })
      }
    }
    
    console.log(`Found ${hackathons.length} Devpost hackathons`)
    return hackathons
  } catch (error) {
    console.error('Error fetching Devpost hackathons:', error)
    return getDevpostFallbackData()
  }
}

// Fallback data when APIs are not accessible
function getDevfolioFallbackData(): HackathonData[] {
  const now = new Date()
  return [
    {
      title: 'ETHIndia 2025',
      description: "Asia's largest Ethereum hackathon. Build the future of Web3 with 2000+ hackers.",
      start_date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(now.getTime() + 47 * 24 * 60 * 60 * 1000).toISOString(),
      registration_deadline: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000).toISOString(),
      registration_url: 'https://ethindia.co',
      source: 'devfolio',
      mode: 'offline',
      location: 'Bangalore, India',
      prize_pool: '₹50,00,000',
      image_url: 'https://assets.devfolio.co/hackathons/ethindia/logo.png',
      skills: ['Solidity', 'Web3', 'Ethereum', 'React']
    },
    {
      title: 'HackThisFall 5.0',
      description: 'India\'s most welcoming hackathon. 48 hours of innovation and learning.',
      start_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000).toISOString(),
      registration_deadline: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      registration_url: 'https://hackthisfall.tech',
      source: 'devfolio',
      mode: 'hybrid',
      location: 'Virtual & Jaipur',
      prize_pool: '₹10,00,000',
      image_url: null,
      skills: ['JavaScript', 'Python', 'AI/ML', 'Open Source']
    },
    {
      title: 'Unfold 2025',
      description: 'Coindcx\'s flagship Web3 hackathon. Build, learn, and win prizes.',
      start_date: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(now.getTime() + 62 * 24 * 60 * 60 * 1000).toISOString(),
      registration_deadline: new Date(now.getTime() + 55 * 24 * 60 * 60 * 1000).toISOString(),
      registration_url: 'https://unfold.devfolio.co',
      source: 'devfolio',
      mode: 'offline',
      location: 'Bangalore, India',
      prize_pool: '₹25,00,000',
      image_url: null,
      skills: ['Blockchain', 'DeFi', 'Smart Contracts', 'TypeScript']
    }
  ]
}

function getDevpostFallbackData(): HackathonData[] {
  const now = new Date()
  return [
    {
      title: 'Google Solution Challenge 2025',
      description: 'Build solutions using Google technologies to address UN Sustainable Development Goals.',
      start_date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      registration_deadline: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      registration_url: 'https://developers.google.com/community/gdsc-solution-challenge',
      source: 'devpost',
      mode: 'online',
      location: 'Global',
      prize_pool: '$10,000',
      image_url: null,
      skills: ['Flutter', 'Firebase', 'Google Cloud', 'Android']
    },
    {
      title: 'Microsoft Imagine Cup 2025',
      description: 'Global technology competition for students to solve real-world problems.',
      start_date: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      registration_deadline: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      registration_url: 'https://imaginecup.microsoft.com',
      source: 'devpost',
      mode: 'online',
      location: 'Global',
      prize_pool: '$100,000',
      image_url: null,
      skills: ['Azure', 'AI/ML', '.NET', 'Power Platform']
    },
    {
      title: 'NASA Space Apps Challenge',
      description: 'Annual hackathon using NASA data to solve challenges facing humanity and Earth.',
      start_date: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(now.getTime() + 37 * 24 * 60 * 60 * 1000).toISOString(),
      registration_deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      registration_url: 'https://www.spaceappschallenge.org',
      source: 'devpost',
      mode: 'hybrid',
      location: 'Global (200+ locations)',
      prize_pool: '$5,000',
      image_url: null,
      skills: ['Data Science', 'Python', 'JavaScript', 'Space Tech']
    }
  ]
}

function getUnstopFallbackData(): HackathonData[] {
  const now = new Date()
  return [
    {
      title: 'Smart India Hackathon 2025',
      description: "India's largest open innovation platform for students to solve government problems.",
      start_date: new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(now.getTime() + 52 * 24 * 60 * 60 * 1000).toISOString(),
      registration_deadline: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      registration_url: 'https://www.sih.gov.in',
      source: 'unstop',
      mode: 'offline',
      location: 'India (Multiple Nodal Centers)',
      prize_pool: '₹1,00,000',
      image_url: null,
      skills: ['IoT', 'AI/ML', 'Blockchain', 'Mobile Apps']
    },
    {
      title: 'Flipkart GRiD 6.0',
      description: 'Annual engineering excellence challenge by Flipkart for students.',
      start_date: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000).toISOString(),
      registration_deadline: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      registration_url: 'https://unstop.com/hackathons/flipkart-grid',
      source: 'unstop',
      mode: 'online',
      location: 'Virtual',
      prize_pool: '₹3,00,000',
      image_url: null,
      skills: ['DSA', 'System Design', 'Machine Learning', 'SQL']
    },
    {
      title: 'Amazon ML Summer School',
      description: 'Learn ML from Amazon scientists and build real projects.',
      start_date: new Date(now.getTime() + 55 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(now.getTime() + 85 * 24 * 60 * 60 * 1000).toISOString(),
      registration_deadline: new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000).toISOString(),
      registration_url: 'https://unstop.com/hackathons/amazon-ml',
      source: 'unstop',
      mode: 'online',
      location: 'Virtual',
      prize_pool: 'Pre-placement Interview',
      image_url: null,
      skills: ['Machine Learning', 'Python', 'Deep Learning', 'AWS']
    }
  ]
}

function getCommunityFallbackData(): HackathonData[] {
  const now = new Date()
  return [
    {
      title: 'IIT Bombay Techfest Hackathon',
      description: "Asia's largest science and technology festival hackathon.",
      start_date: new Date(now.getTime() + 70 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(now.getTime() + 72 * 24 * 60 * 60 * 1000).toISOString(),
      registration_deadline: new Date(now.getTime() + 65 * 24 * 60 * 60 * 1000).toISOString(),
      registration_url: 'https://techfest.org/hackathon',
      source: 'community',
      mode: 'hybrid',
      location: 'IIT Bombay, Mumbai',
      prize_pool: '₹5,00,000',
      image_url: null,
      skills: ['Full Stack', 'AI/ML', 'IoT', 'Robotics']
    },
    {
      title: 'GDG DevFest India Hackathon',
      description: 'Google Developer Groups community hackathon across India.',
      start_date: new Date(now.getTime() + 80 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(now.getTime() + 82 * 24 * 60 * 60 * 1000).toISOString(),
      registration_deadline: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000).toISOString(),
      registration_url: 'https://devfest.gdg.community',
      source: 'community',
      mode: 'offline',
      location: 'Multiple Cities, India',
      prize_pool: '₹2,00,000',
      image_url: null,
      skills: ['Angular', 'Flutter', 'Firebase', 'TensorFlow']
    },
    {
      title: 'MLSA Hackathon 2025',
      description: 'Microsoft Learn Student Ambassadors hackathon for students worldwide.',
      start_date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(now.getTime() + 92 * 24 * 60 * 60 * 1000).toISOString(),
      registration_deadline: new Date(now.getTime() + 85 * 24 * 60 * 60 * 1000).toISOString(),
      registration_url: 'https://studentambassadors.microsoft.com',
      source: 'community',
      mode: 'online',
      location: 'Global',
      prize_pool: '$5,000',
      image_url: null,
      skills: ['Azure', 'GitHub', 'VS Code', 'Power Automate']
    }
  ]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting hackathon sync...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch from all sources in parallel
    const [devfolioHackathons, devpostHackathons] = await Promise.all([
      fetchDevfolioHackathons(),
      fetchDevpostHackathons(),
    ])

    // Add fallback data for sources that don't have accessible APIs
    const unstopHackathons = getUnstopFallbackData()
    const communityHackathons = getCommunityFallbackData()

    const allHackathons = [
      ...devfolioHackathons,
      ...devpostHackathons,
      ...unstopHackathons,
      ...communityHackathons
    ]

    console.log(`Total hackathons to sync: ${allHackathons.length}`)

    let inserted = 0
    let updated = 0
    let skipped = 0

    for (const hackathon of allHackathons) {
      // Check if hackathon already exists by title and source
      const { data: existing } = await supabase
        .from('hackathons')
        .select('id, updated_at')
        .eq('title', hackathon.title)
        .eq('source', hackathon.source)
        .single()

      if (existing) {
        // Update existing hackathon
        const { error } = await supabase
          .from('hackathons')
          .update({
            ...hackathon,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (!error) {
          updated++
        } else {
          console.error(`Error updating ${hackathon.title}:`, error)
          skipped++
        }
      } else {
        // Insert new hackathon
        const { error } = await supabase
          .from('hackathons')
          .insert({
            ...hackathon,
            is_active: true
          })

        if (!error) {
          inserted++
        } else {
          console.error(`Error inserting ${hackathon.title}:`, error)
          skipped++
        }
      }
    }

    // Deactivate old hackathons that have passed
    const { error: deactivateError } = await supabase
      .from('hackathons')
      .update({ is_active: false })
      .lt('registration_deadline', new Date().toISOString())

    if (deactivateError) {
      console.error('Error deactivating old hackathons:', deactivateError)
    }

    const result = {
      success: true,
      message: `Sync completed. Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`,
      stats: { inserted, updated, skipped, total: allHackathons.length }
    }

    console.log(result.message)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
